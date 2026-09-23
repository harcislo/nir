import { z } from "zod";

export const loginSchema = z.object({
  login: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const createAdminEnvironmentSchema = z.object({
  ADMIN_LOGIN: z.string().trim().min(1).max(100),
  ADMIN_PASSWORD: z.string().min(1).max(200),
});
