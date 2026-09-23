import { randomUUID } from "node:crypto";
import { Router } from "express";
import { AppError } from "../../errors.js";
import { findMeasurementById } from "../measurements/measurement.repository.js";
import {
  deleteFileMetadata,
  findFileByMeasurementId,
  replaceFileMetadata,
} from "./file.repository.js";
import { deleteObject, downloadObject, uploadObject } from "./object-storage.js";
import { uploadFile, validateFile } from "./file.upload.js";
import { idParameterSchema } from "../measurements/measurement.schemas.js";

export const fileRouter = Router({ mergeParams: true });

fileRouter.post("/", uploadFile.single("file"), async (request, response) => {
  const { id } = idParameterSchema.parse(request.params);
  const measurement = await findMeasurementById(id);
  if (!measurement) throw new AppError(404, "MEASUREMENT_NOT_FOUND", "Запись не найдена");
  if (!request.file) throw new AppError(400, "FILE_REQUIRED", "Выберите файл");

  validateFile(request.file);
  const objectKey = `measurements/${id}/${randomUUID()}`;
  await uploadObject(objectKey, request.file.buffer, request.file.mimetype);

  try {
    const result = await replaceFileMetadata({
      measurementId: id,
      originalName: request.file.originalname,
      objectKey,
      size: request.file.size,
      mimeType: request.file.mimetype,
    });

    if (result.previous) {
      await deleteObject(result.previous.object_key).catch((error: unknown) => console.error(error));
    }

    response.status(result.previous ? 200 : 201).json({
      data: {
        id: result.file.id,
        originalName: result.file.original_name,
        size: result.file.size,
        createdAt: result.file.created_at,
      },
    });
  } catch (error) {
    await deleteObject(objectKey).catch((cleanupError: unknown) => console.error(cleanupError));
    throw error;
  }
});

fileRouter.get("/", async (request, response) => {
  const { id } = idParameterSchema.parse(request.params);
  const file = await findFileByMeasurementId(id);
  if (!file) throw new AppError(404, "FILE_NOT_FOUND", "Файл не найден");

  const stream = await downloadObject(file.object_key);
  response.attachment(file.original_name);
  response.type(file.mime_type);
  response.setHeader("Content-Length", file.size);
  stream.on("error", (error) => {
    console.error(error);
    response.destroy(error);
  });
  stream.pipe(response);
});

fileRouter.delete("/", async (request, response) => {
  const { id } = idParameterSchema.parse(request.params);
  const file = await findFileByMeasurementId(id);
  if (!file) throw new AppError(404, "FILE_NOT_FOUND", "Файл не найден");

  await deleteFileMetadata(id);
  await deleteObject(file.object_key).catch((error: unknown) => {
    // The bucket is private; an unreferenced object is safer than metadata
    // pointing to an object that was already removed.
    console.error("Failed to remove orphaned object", error);
  });
  response.status(204).send();
});
