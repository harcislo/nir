import { describe, expect, it } from "vitest";
import { openApiDocument } from "./openapi.js";

describe("OpenAPI document", () => {
  it("describes authentication, measurements and file uploads", () => {
    expect(openApiDocument.openapi).toBe("3.1.0");
    expect(openApiDocument.paths["/api/auth/login"]).toBeDefined();
    expect(openApiDocument.paths["/api/measurements"]).toBeDefined();
    expect(openApiDocument.paths["/api/measurements/{id}/file"]).toBeDefined();
  });
});
