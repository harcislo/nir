import { deleteExpiredSessions } from "./auth.repository.js";

const CLEANUP_INTERVAL_MS = 60 * 60 * 1_000;

export function startSessionCleanup() {
  const cleanup = () => {
    deleteExpiredSessions().catch((error: unknown) => {
      console.error("Failed to clean expired sessions", error);
    });
  };

  cleanup();
  const timer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  timer.unref();
  return timer;
}

