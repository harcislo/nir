import type { RequestHandler } from "express";
import { config } from "../../config.js";
import { AppError } from "../../errors.js";
import { findUserBySessionToken } from "./auth.repository.js";

export function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export const requireAuth: RequestHandler = async (request, response, next) => {
  const token = readCookie(request.headers.cookie, config.SESSION_COOKIE_NAME);
  if (!token) {
    next(new AppError(401, "UNAUTHORIZED", "Требуется авторизация"));
    return;
  }

  const user = await findUserBySessionToken(token);
  if (!user) {
    next(new AppError(401, "UNAUTHORIZED", "Сессия недействительна или истекла"));
    return;
  }

  response.locals.user = user;
  next();
};

