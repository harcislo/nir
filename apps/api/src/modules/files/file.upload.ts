import multer from "multer";
import { AppError } from "../../errors.js";

export const MAX_FILE_SIZE = 10 * 1_024 * 1_024;

export function validateFile(file: { size: number }) {
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(400, "FILE_TOO_LARGE", "Файл превышает максимальный размер 10 МБ");
  }
}

export const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});
