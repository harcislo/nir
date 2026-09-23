import { rateLimit } from "express-rate-limit";
import { config } from "../../config.js";

export const loginRateLimiter = rateLimit({
  windowMs: config.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1_000,
  limit: config.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: {
      code: "TOO_MANY_LOGIN_ATTEMPTS",
      message: "Слишком много попыток входа. Повторите позже",
    },
  },
});

