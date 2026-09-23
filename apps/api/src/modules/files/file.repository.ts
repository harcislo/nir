import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "../../db/pool.js";

export interface FileRow extends QueryResultRow {
  id: string;
  measurement_id: string;
  original_name: string;
  object_key: string;
  size: number;
  mime_type: string;
  created_at: Date;
}

export async function findFileByMeasurementId(measurementId: string, client?: PoolClient) {
  const executor = client ?? pool;
  const result = await executor.query<FileRow>(
    `SELECT id, measurement_id, original_name, object_key, size, mime_type, created_at
     FROM files WHERE measurement_id = $1`,
    [measurementId],
  );
  return result.rows[0] ?? null;
}

export async function replaceFileMetadata(input: {
  measurementId: string;
  originalName: string;
  objectKey: string;
  size: number;
  mimeType: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const previous = await findFileByMeasurementId(input.measurementId, client);
    if (previous) {
      await client.query("SELECT id FROM files WHERE id = $1 FOR UPDATE", [previous.id]);
    }

    const result = await client.query<FileRow>(
      `INSERT INTO files (measurement_id, original_name, object_key, size, mime_type)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (measurement_id) DO UPDATE SET
         original_name = EXCLUDED.original_name,
         object_key = EXCLUDED.object_key,
         size = EXCLUDED.size,
         mime_type = EXCLUDED.mime_type,
         created_at = now()
       RETURNING id, measurement_id, original_name, object_key, size, mime_type, created_at`,
      [input.measurementId, input.originalName, input.objectKey, input.size, input.mimeType],
    );
    await client.query("COMMIT");
    return { file: result.rows[0]!, previous };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteFileMetadata(measurementId: string) {
  const result = await pool.query("DELETE FROM files WHERE measurement_id = $1", [measurementId]);
  return result.rowCount === 1;
}

