import { Router } from "express";
import { pool } from "../../db/pool.js";
import { checkObjectStorageConnection } from "../files/object-storage.js";

export const healthRouter = Router();

healthRouter.get("/live", (_request, response) => {
  response.json({ status: "ok" });
});

healthRouter.get("/ready", async (_request, response) => {
  const [database, objectStorage] = await Promise.allSettled([
    pool.query("SELECT 1"),
    checkObjectStorageConnection(),
  ]);
  const ready = database.status === "fulfilled" && objectStorage.status === "fulfilled";

  response.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    checks: {
      database: database.status === "fulfilled" ? "ok" : "error",
      objectStorage: objectStorage.status === "fulfilled" ? "ok" : "error",
    },
  });
});

