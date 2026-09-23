import type { QueryResultRow } from "pg";
import { pool } from "../../db/pool.js";
import type {
  MeasurementCreateInput,
  MeasurementListQuery,
  MeasurementUpdateInput,
} from "./measurement.schemas.js";

export interface MeasurementRow extends QueryResultRow {
  id: string;
  sample_name: string;
  sample_number: string;
  organization: string | null;
  customer: string | null;
  mode1: string | null;
  mode2: string | null;
  mode3: string | null;
  measurement_date: string;
  measurement_time: string | null;
  is_reference: boolean;
  is_repair: boolean;
  created_at: Date;
  updated_at: Date;
  file_id: string | null;
  file_original_name: string | null;
  file_size: number | null;
}

const selectColumns = `
  m.id, m.sample_name, m.sample_number, m.organization, m.customer,
  m.mode1, m.mode2, m.mode3, m.measurement_date, m.measurement_time,
  m.is_reference, m.is_repair, m.created_at, m.updated_at,
  f.id AS file_id, f.original_name AS file_original_name, f.size AS file_size
`;

export async function listMeasurements(query: MeasurementListQuery) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  const add = (condition: string, value: unknown) => {
    values.push(value);
    conditions.push(condition.replace("?", `$${values.length}`));
  };

  if (query.dateFrom) add("m.measurement_date >= ?", query.dateFrom);
  if (query.dateTo) add("m.measurement_date <= ?", query.dateTo);
  if (query.sampleName) add("m.sample_name ILIKE '%' || ? || '%'", query.sampleName);
  if (query.sampleNumber) add("m.sample_number ILIKE '%' || ? || '%'", query.sampleNumber);
  if (query.organization) add("m.organization ILIKE '%' || ? || '%'", query.organization);
  if (query.customer) add("m.customer ILIKE '%' || ? || '%'", query.customer);
  if (query.mode1) add("m.mode1 ILIKE '%' || ? || '%'", query.mode1);
  if (query.mode2) add("m.mode2 ILIKE '%' || ? || '%'", query.mode2);
  if (query.mode3) add("m.mode3 ILIKE '%' || ? || '%'", query.mode3);
  if (query.isReference !== undefined) add("m.is_reference = ?", query.isReference);
  if (query.isRepair !== undefined) add("m.is_repair = ?", query.isRepair);
  if (query.hasFile !== undefined) {
    conditions.push(query.hasFile ? "f.id IS NOT NULL" : "f.id IS NULL");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const filterValues = [...values];
  values.push(query.pageSize, (query.page - 1) * query.pageSize);
  const limitParameter = `$${values.length - 1}`;
  const offsetParameter = `$${values.length}`;

  const [rowsResult, countResult] = await Promise.all([
    pool.query<MeasurementRow>(
      `SELECT ${selectColumns}
       FROM measurements m
       LEFT JOIN files f ON f.measurement_id = m.id
       ${where}
       ORDER BY m.measurement_date DESC, m.measurement_time DESC NULLS LAST, m.created_at DESC
       LIMIT ${limitParameter} OFFSET ${offsetParameter}`,
      values,
    ),
    pool.query<{ total: string }>(
      `SELECT count(*) AS total
       FROM measurements m
       LEFT JOIN files f ON f.measurement_id = m.id
       ${where}`,
      filterValues,
    ),
  ]);

  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.total ?? 0),
  };
}

export async function findMeasurementById(id: string) {
  const result = await pool.query<MeasurementRow>(
    `SELECT ${selectColumns}
     FROM measurements m
     LEFT JOIN files f ON f.measurement_id = m.id
     WHERE m.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createMeasurement(input: MeasurementCreateInput) {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO measurements (
       sample_name, sample_number, organization, customer, mode1, mode2, mode3,
       measurement_date, measurement_time, is_reference, is_repair
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      input.sampleName,
      input.sampleNumber,
      input.organization ?? null,
      input.customer ?? null,
      input.mode1 ?? null,
      input.mode2 ?? null,
      input.mode3 ?? null,
      input.measurementDate,
      input.measurementTime ?? null,
      input.isReference,
      input.isRepair,
    ],
  );
  return findMeasurementById(result.rows[0]!.id);
}

const updateColumnByField: Record<keyof MeasurementUpdateInput, string> = {
  sampleName: "sample_name",
  sampleNumber: "sample_number",
  organization: "organization",
  customer: "customer",
  mode1: "mode1",
  mode2: "mode2",
  mode3: "mode3",
  measurementDate: "measurement_date",
  measurementTime: "measurement_time",
  isReference: "is_reference",
  isRepair: "is_repair",
};

export async function updateMeasurement(id: string, input: MeasurementUpdateInput) {
  const entries = Object.entries(input) as [keyof MeasurementUpdateInput, unknown][];
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(
    ([field], index) => `${updateColumnByField[field]} = $${index + 1}`,
  );
  values.push(id);

  const result = await pool.query<{ id: string }>(
    `UPDATE measurements SET ${assignments.join(", ")} WHERE id = $${values.length} RETURNING id`,
    values,
  );
  if (result.rowCount === 0) return null;
  return findMeasurementById(id);
}

export async function deleteMeasurement(id: string) {
  const result = await pool.query("DELETE FROM measurements WHERE id = $1", [id]);
  return result.rowCount === 1;
}
