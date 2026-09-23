import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { upsertAdmin } from "../modules/auth/auth.repository.js";
import { deleteObject } from "../modules/files/object-storage.js";

const databaseDescribe = process.env.RUN_DB_TESTS === "true" ? describe : describe.skip;
const storageIt = process.env.RUN_STORAGE_TESTS === "true" ? it : it.skip;
const suffix = randomUUID().slice(0, 8);
const login = `integration-${suffix}`;
const password = "Integration_password_2026!";
const sampleNumber = `IT-${suffix}`;

databaseDescribe("API with PostgreSQL", () => {
  const agent = request.agent(app);
  let measurementId = "";

  beforeAll(async () => {
    await upsertAdmin(login, await hash(password, 4));
  });

  it("serves liveness, OpenAPI JSON and Swagger UI", async () => {
    const live = await request(app).get("/health/live");
    expect(live.status).toBe(200);
    expect(live.body).toEqual({ status: "ok" });

    const openapi = await request(app).get("/api/openapi.json");
    expect(openapi.status).toBe(200);
    expect(openapi.body.openapi).toBe("3.1.0");

    const swagger = await request(app).get("/api/docs/");
    expect(swagger.status).toBe(200);
    expect(swagger.text).toContain("Swagger UI");
  });

  storageIt("reports readiness when PostgreSQL and Object Storage are available", async () => {
    const response = await request(app).get("/health/ready");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ready",
      checks: { database: "ok", objectStorage: "ok" },
    });
  });

  afterAll(async () => {
    const files = await pool.query<{ object_key: string }>(
      `SELECT f.object_key
       FROM files f
       JOIN measurements m ON m.id = f.measurement_id
       WHERE m.sample_number = $1`,
      [sampleNumber],
    );
    for (const file of files.rows) {
      await deleteObject(file.object_key).catch(() => undefined);
    }
    await pool.query("DELETE FROM measurements WHERE sample_number = $1", [sampleNumber]);
    await pool.query("DELETE FROM users WHERE login = $1", [login]);
    await pool.end();
  });

  it("rejects an unauthenticated API request", async () => {
    const response = await request(app).get("/api/measurements");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("logs the administrator in and returns the current session", async () => {
    const loginResponse = await agent.post("/api/auth/login").send({ login, password });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers["set-cookie"]?.[0]).toContain("HttpOnly");

    const meResponse = await agent.get("/api/auth/me");
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.login).toBe(login);
  });

  it("creates a measurement without a file", async () => {
    const response = await agent.post("/api/measurements").send({
      sampleName: "Интеграционный образец",
      sampleNumber,
      organization: "Тестовая организация",
      customer: "Тестовый заказчик",
      measurementDate: "2026-09-21",
      measurementTime: "13:20",
      isReference: false,
      isRepair: false,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.sampleNumber).toBe(sampleNumber);
    expect(response.body.data.file).toBeNull();
    measurementId = response.body.data.id;
  });

  it("filters and paginates measurements", async () => {
    const response = await agent
      .get("/api/measurements")
      .query({ sampleNumber: suffix, page: 1, pageSize: 20 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.total).toBe(1);
  });

  it("updates only the fields sent in PATCH", async () => {
    const response = await agent
      .patch(`/api/measurements/${measurementId}`)
      .send({ isReference: true });

    expect(response.status).toBe(200);
    expect(response.body.data.isReference).toBe(true);
    expect(response.body.data.isRepair).toBe(false);
  });

  it("returns a clear error when the record has no file", async () => {
    const response = await agent.get(`/api/measurements/${measurementId}/file`);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("FILE_NOT_FOUND");
  });

  storageIt("validates and completes the file lifecycle in Object Storage", async () => {
    const tooLarge = await agent
      .post(`/api/measurements/${measurementId}/file`)
      .attach("file", Buffer.alloc(10 * 1_024 * 1_024 + 1), "measurement.zip");
    expect(tooLarge.status).toBe(400);
    expect(tooLarge.body.error.code).toBe("FILE_TOO_LARGE");

    const firstContent = "sample,value\nA,42\n";
    const upload = await agent
      .post(`/api/measurements/${measurementId}/file`)
      .attach("file", Buffer.from(firstContent), "results.csv");
    expect(upload.status).toBe(201);
    expect(upload.body.data.originalName).toBe("results.csv");

    const firstDownload = await agent.get(`/api/measurements/${measurementId}/file`);
    expect(firstDownload.status).toBe(200);
    expect(firstDownload.text).toBe(firstContent);

    const secondContent = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    const replacement = await agent
      .post(`/api/measurements/${measurementId}/file`)
      .attach("file", secondContent, { filename: "report.pdf", contentType: "application/pdf" });
    expect(replacement.status).toBe(200);

    const secondDownload = await agent.get(`/api/measurements/${measurementId}/file`);
    expect(secondDownload.status).toBe(200);
    expect(secondDownload.headers["content-type"]).toContain("application/pdf");
    expect(secondDownload.body).toEqual(secondContent);

    expect((await agent.delete(`/api/measurements/${measurementId}/file`)).status).toBe(204);
    expect((await agent.get(`/api/measurements/${measurementId}/file`)).status).toBe(404);
  });

  it("deletes the measurement and logs out", async () => {
    expect((await agent.delete(`/api/measurements/${measurementId}`)).status).toBe(204);
    expect((await agent.get(`/api/measurements/${measurementId}`)).status).toBe(404);
    expect((await agent.post("/api/auth/logout")).status).toBe(204);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("rate-limits repeated failed login attempts", async () => {
    for (let attempt = 0; attempt < config.LOGIN_RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ login: `missing-${suffix}`, password: "wrong" });
      expect(response.status).toBe(401);
    }

    const blocked = await request(app)
      .post("/api/auth/login")
      .send({ login: `missing-${suffix}`, password: "wrong" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("TOO_MANY_LOGIN_ATTEMPTS");
  });
});
