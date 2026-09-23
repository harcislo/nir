import type { MeasurementRow } from "./measurement.repository.js";

function presentDateOnly(value: string | Date) {
  if (typeof value === "string") return value.slice(0, 10);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function presentMeasurement(row: MeasurementRow) {
  return {
    id: row.id,
    sampleName: row.sample_name,
    sampleNumber: row.sample_number,
    organization: row.organization,
    customer: row.customer,
    mode1: row.mode1,
    mode2: row.mode2,
    mode3: row.mode3,
    measurementDate: presentDateOnly(row.measurement_date),
    measurementTime: row.measurement_time,
    isReference: row.is_reference,
    isRepair: row.is_repair,
    file: row.file_id
      ? {
          id: row.file_id,
          originalName: row.file_original_name,
          size: row.file_size,
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
