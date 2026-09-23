import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnvironment } from "dotenv";
import { z } from "zod";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
loadEnvironment({ path: resolve(projectRoot, ".env") });

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const environmentBoolean = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(4_000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().max(24 * 365).default(168),
  SESSION_COOKIE_NAME: z.string().min(1).default("measurement_session"),
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().max(24 * 60).default(15),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().max(1_000).default(10),
  TRUST_PROXY: environmentBoolean.default(false),
  YANDEX_STORAGE_ENDPOINT: z.url().default("https://storage.yandexcloud.net"),
  YANDEX_STORAGE_REGION: z.string().min(1).default("ru-central1"),
  YANDEX_STORAGE_BUCKET: optionalNonEmptyString,
  YANDEX_STORAGE_ACCESS_KEY_ID: optionalNonEmptyString,
  YANDEX_STORAGE_SECRET_ACCESS_KEY: optionalNonEmptyString,
});

export const config = environmentSchema.parse(process.env);
