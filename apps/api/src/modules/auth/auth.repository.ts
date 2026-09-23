import { createHash } from "node:crypto";
import { pool } from "../../db/pool.js";

export interface UserRow {
  id: string;
  login: string;
  password_hash: string;
}

export interface AuthenticatedUser {
  id: string;
  login: string;
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function findUserByLogin(login: string) {
  const result = await pool.query<UserRow>(
    "SELECT id, login, password_hash FROM users WHERE login = $1",
    [login],
  );
  return result.rows[0] ?? null;
}

export async function upsertAdmin(login: string, passwordHash: string) {
  const result = await pool.query<AuthenticatedUser>(
    `INSERT INTO users (login, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (login) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, login`,
    [login, passwordHash],
  );
  return result.rows[0]!;
}

export async function createSession(userId: string, token: string, expiresAt: Date) {
  await pool.query("DELETE FROM sessions WHERE expires_at <= now()");
  await pool.query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, hashSessionToken(token), expiresAt],
  );
}

export async function findUserBySessionToken(token: string) {
  const result = await pool.query<AuthenticatedUser>(
    `SELECT u.id, u.login
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashSessionToken(token)],
  );
  return result.rows[0] ?? null;
}

export async function deleteSession(token: string) {
  await pool.query("DELETE FROM sessions WHERE token_hash = $1", [hashSessionToken(token)]);
}

export async function deleteExpiredSessions() {
  const result = await pool.query("DELETE FROM sessions WHERE expires_at <= now()");
  return result.rowCount ?? 0;
}
