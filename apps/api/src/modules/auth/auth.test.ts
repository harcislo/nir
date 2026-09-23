import { describe, expect, it } from "vitest";
import { hashSessionToken } from "./auth.repository.js";
import { readCookie } from "./auth.middleware.js";

describe("authentication helpers", () => {
  it("reads only the requested cookie", () => {
    expect(readCookie("theme=dark; measurement_session=abc%20123", "measurement_session")).toBe(
      "abc 123",
    );
  });

  it("stores a deterministic hash instead of the raw session token", () => {
    const token = "secret-session-token";
    expect(hashSessionToken(token)).toHaveLength(64);
    expect(hashSessionToken(token)).not.toBe(token);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });
});

