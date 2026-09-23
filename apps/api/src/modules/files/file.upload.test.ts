import { describe, expect, it } from "vitest";
import { AppError } from "../../errors.js";
import { MAX_FILE_SIZE, validateFile } from "./file.upload.js";

describe("file upload validation", () => {
  it("accepts any file type up to and including 10 MiB", () => {
    expect(() => validateFile({ size: MAX_FILE_SIZE })).not.toThrow();
  });

  it("rejects a file over 10 MiB", () => {
    expect(() => validateFile({ size: MAX_FILE_SIZE + 1 })).toThrowError(
      new AppError(400, "FILE_TOO_LARGE", "Файл превышает максимальный размер 10 МБ"),
    );
  });
});
