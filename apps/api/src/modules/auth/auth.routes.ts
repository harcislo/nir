import { randomBytes } from "node:crypto";
import { compare } from "bcryptjs";
import { Router } from "express";
import { config } from "../../config.js";
import { AppError } from "../../errors.js";
import {
  createSession,
  deleteSession,
  findUserByLogin,
} from "./auth.repository.js";
import { readCookie, requireAuth } from "./auth.middleware.js";
import { loginRateLimiter } from "./auth.rate-limit.js";
import { loginSchema } from "./auth.schemas.js";

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: config.NODE_ENV === "production",
  path: "/",
};

authRouter.post("/login", loginRateLimiter, async (request, response) => {
  const input = loginSchema.parse(request.body);
  const user = await findUserByLogin(input.login);
  const passwordMatches = user ? await compare(input.password, user.password_hash) : false;

  if (!user || !passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Неверный логин или пароль");
  }

  const token = randomBytes(32).toString("base64url");
  const maxAge = config.SESSION_TTL_HOURS * 60 * 60 * 1_000;
  await createSession(user.id, token, new Date(Date.now() + maxAge));

  response.cookie(config.SESSION_COOKIE_NAME, token, { ...cookieOptions, maxAge });
  response.json({ data: { id: user.id, login: user.login } });
});

authRouter.post("/logout", async (request, response) => {
  const token = readCookie(request.headers.cookie, config.SESSION_COOKIE_NAME);
  if (token) await deleteSession(token);
  response.clearCookie(config.SESSION_COOKIE_NAME, cookieOptions);
  response.status(204).send();
});

authRouter.get("/me", requireAuth, (_request, response) => {
  response.json({ data: response.locals.user });
});
