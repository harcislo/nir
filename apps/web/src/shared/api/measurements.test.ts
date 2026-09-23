import { afterEach, describe, expect, it, vi } from "vitest";
import type { MeasurementFilters } from "../../types";
import { listMeasurements, normalizeMeasurementInput } from "./measurements";

afterEach(() => vi.restoreAllMocks());

describe("measurements API client", () => {
  it("trims input and converts blank optional values to null", () => {
    expect(
      normalizeMeasurementInput({
        sampleName: "  Проба  ",
        sampleNumber: "  7 ",
        organization: "  Лаборатория ",
        customer: "   ",
        mode1: null,
        mode2: " M2 ",
        mode3: "",
        measurementDate: "2026-09-21",
        measurementTime: null,
        isReference: false,
        isRepair: false,
      }),
    ).toMatchObject({
      sampleName: "Проба",
      sampleNumber: "7",
      organization: "Лаборатория",
      customer: null,
      mode1: null,
      mode2: "M2",
      mode3: null,
      measurementTime: null,
    });
  });

  it("sends only active filters", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [], pagination: { page: 2, pageSize: 20, total: 0, totalPages: 0 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const filters: MeasurementFilters = {
      dateFrom: "",
      dateTo: "",
      sampleName: "  сталь  ",
      sampleNumber: "",
      organization: "",
      customer: "",
      mode1: "",
      mode2: "",
      mode3: "",
      isReference: "true",
      isRepair: "",
      hasFile: "false",
    };

    await listMeasurements({ page: 2, pageSize: 20, filters });

    const requestedUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(requestedUrl).toContain("page=2&pageSize=20");
    expect(requestedUrl).toContain("sampleName=%D1%81%D1%82%D0%B0%D0%BB%D1%8C");
    expect(requestedUrl).toContain("isReference=true");
    expect(requestedUrl).toContain("hasFile=false");
    expect(requestedUrl).not.toContain("organization=");
  });
});
