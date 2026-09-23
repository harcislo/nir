import { hash } from "bcryptjs";
import { pool } from "../db/pool.js";
import { upsertAdmin } from "../modules/auth/auth.repository.js";
import { createAdminEnvironmentSchema } from "../modules/auth/auth.schemas.js";

async function createAdmin() {
  const input = createAdminEnvironmentSchema.parse(process.env);
  const passwordHash = await hash(input.ADMIN_PASSWORD, 12);
  const user = await upsertAdmin(input.ADMIN_LOGIN, passwordHash);
  console.info(`Administrator ready: ${user.login}`);
}

createAdmin()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

