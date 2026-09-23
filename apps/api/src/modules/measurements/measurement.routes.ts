import { Router } from "express";
import { AppError } from "../../errors.js";
import { findFileByMeasurementId } from "../files/file.repository.js";
import { deleteObject } from "../files/object-storage.js";
import { presentMeasurement } from "./measurement.presenter.js";
import {
  createMeasurement,
  deleteMeasurement,
  findMeasurementById,
  listMeasurements,
  updateMeasurement,
} from "./measurement.repository.js";
import {
  idParameterSchema,
  measurementCreateSchema,
  measurementListQuerySchema,
  measurementUpdateSchema,
} from "./measurement.schemas.js";

export const measurementRouter = Router();

measurementRouter.get("/", async (request, response) => {
  const query = measurementListQuerySchema.parse(request.query);
  const result = await listMeasurements(query);
  response.json({
    data: result.rows.map(presentMeasurement),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / query.pageSize),
    },
  });
});

measurementRouter.post("/", async (request, response) => {
  const input = measurementCreateSchema.parse(request.body);
  const measurement = await createMeasurement(input);
  response.status(201).json({ data: presentMeasurement(measurement!) });
});

measurementRouter.get("/:id", async (request, response) => {
  const { id } = idParameterSchema.parse(request.params);
  const measurement = await findMeasurementById(id);
  if (!measurement) throw new AppError(404, "MEASUREMENT_NOT_FOUND", "Запись не найдена");
  response.json({ data: presentMeasurement(measurement) });
});

measurementRouter.patch("/:id", async (request, response) => {
  const { id } = idParameterSchema.parse(request.params);
  const input = measurementUpdateSchema.parse(request.body);
  const measurement = await updateMeasurement(id, input);
  if (!measurement) throw new AppError(404, "MEASUREMENT_NOT_FOUND", "Запись не найдена");
  response.json({ data: presentMeasurement(measurement) });
});

measurementRouter.delete("/:id", async (request, response) => {
  const { id } = idParameterSchema.parse(request.params);
  const file = await findFileByMeasurementId(id);
  const deleted = await deleteMeasurement(id);
  if (!deleted) throw new AppError(404, "MEASUREMENT_NOT_FOUND", "Запись не найдена");

  if (file) {
    await deleteObject(file.object_key).catch((error: unknown) => {
      // The database remains the source of truth. A private orphaned object can be
      // cleaned up safely, while restoring a cascaded database record is not safe.
      console.error("Failed to remove orphaned object", error);
    });
  }
  response.status(204).send();
});
