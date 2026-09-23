import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db/pool.js";
import { startSessionCleanup } from "./modules/auth/auth.maintenance.js";

const server = app.listen(config.PORT, () => {
  console.info(`API listening on http://localhost:${config.PORT}`);
});
const sessionCleanupTimer = startSessionCleanup();

async function shutdown(signal: string) {
  console.info(`${signal} received, shutting down`);
  clearInterval(sessionCleanupTimer);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
