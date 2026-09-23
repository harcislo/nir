import { describe, expect, it } from "vitest";
import type { MeasurementRow } from "./measurement.repository.js";
import { presentMeasurement } from "./measurement.presenter.js";

function measurementRow(measurementDate: string | Date): MeasurementRow {
  return {
    id: "3b4f3106-753d-4638-b5ac-3863b465fb76",
    sample_name: "Образец",
    sample_number: "1",
    organization: null,
    customer: null,
    mode1: null,
    mode2: null,
    mode3: null,
    measurement_date: measurementDate,
    measurement_time: null,
    is_reference: false,
    is_repair: false,
    created_at: new Date("2026-09-23T12:00:00.000Z"),
    updated_at: new Date("2026-09-23T12:00:00.000Z"),
    file_id: null,
    file_original_name: null,
    file_size: null,
  };
}

describe("measurement presenter", () => {
  it("serializes a PostgreSQL date as YYYY-MM-DD", () => {
    const databaseDate = new Date(2026, 8, 23);

    expect(presentMeasurement(measurementRow(databaseDate)).measurementDate).toBe("2026-09-23");
  });

  it("keeps an already serialized date in YYYY-MM-DD format", () => {
    expect(presentMeasurement(measurementRow("2026-09-23")).measurementDate).toBe("2026-09-23");
  });
});
