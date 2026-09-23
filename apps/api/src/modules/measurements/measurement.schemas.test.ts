import { describe, expect, it } from "vitest";
import {
  measurementCreateSchema,
  measurementListQuerySchema,
  measurementUpdateSchema,
} from "./measurement.schemas.js";

describe("measurement schemas", () => {
  it("normalizes optional empty text", () => {
    const result = measurementCreateSchema.parse({
      sampleName: " Образец А ",
      sampleNumber: "00125",
      organization: "",
      measurementDate: "2026-09-21",
    });

    expect(result.sampleName).toBe("Образец А");
    expect(result.organization).toBeNull();
    expect(result.isReference).toBe(false);
  });

  it("accepts only supported page sizes", () => {
    expect(measurementListQuerySchema.parse({ pageSize: "50" }).pageSize).toBe(50);
    expect(() => measurementListQuerySchema.parse({ pageSize: "25" })).toThrow();
  });

  it("does not inject defaults into a partial update", () => {
    expect(measurementUpdateSchema.parse({ sampleName: "Новое имя" })).toEqual({
      sampleName: "Новое имя",
    });
  });

  it("rejects an inverted date range", () => {
    expect(() =>
      measurementListQuerySchema.parse({ dateFrom: "2026-09-22", dateTo: "2026-09-21" }),
    ).toThrow();
  });
});
