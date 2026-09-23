import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../errors.js";

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, "NOT_FOUND", "Маршрут не найден"));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    response.status(400).json({
      error: { code: "INVALID_JSON", message: "Тело запроса содержит некорректный JSON" },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === "LIMIT_FILE_SIZE";
    response.status(400).json({
      error: {
        code: isTooLarge ? "FILE_TOO_LARGE" : "FILE_UPLOAD_ERROR",
        message: isTooLarge
          ? "Файл превышает максимальный размер 10 МБ"
          : "Не удалось загрузить файл",
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Переданы некорректные данные",
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code);
    if (["ECONNREFUSED", "57P01", "57P03"].includes(code)) {
      response.status(503).json({
        error: { code: "DATABASE_UNAVAILABLE", message: "База данных временно недоступна" },
      });
      return;
    }
    if (["23503", "23505"].includes(code)) {
      response.status(409).json({
        error: { code: "DATABASE_CONFLICT", message: "Конфликт данных" },
      });
      return;
    }
    if (code === "22001") {
      response.status(400).json({
        error: { code: "VALUE_TOO_LONG", message: "Одно из значений слишком длинное" },
      });
      return;
    }
  }

  console.error(error);
  response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера" },
  });
};
