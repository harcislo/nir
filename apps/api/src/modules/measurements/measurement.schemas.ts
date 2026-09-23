import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(255)
  .nullable()
  .optional()
  .transform((value) => (value === "" ? null : value));

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ожидается дата в формате YYYY-MM-DD");
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Ожидается время в формате HH:MM")
  .nullable()
  .optional()
  .transform((value) => (value === "" ? null : value));

const measurementFields = {
  sampleName: z.string().trim().min(1).max(255),
  sampleNumber: z.string().trim().min(1).max(100),
  organization: optionalText,
  customer: optionalText,
  mode1: optionalText,
  mode2: optionalText,
  mode3: optionalText,
  measurementDate: date,
  measurementTime: time,
  isReference: z.boolean(),
  isRepair: z.boolean(),
};

export const measurementCreateSchema = z.object({
  ...measurementFields,
  isReference: measurementFields.isReference.default(false),
  isRepair: measurementFields.isRepair.default(false),
});

export const measurementUpdateSchema = z.object(measurementFields).partial().refine(
  (value) => Object.keys(value).length > 0,
  "Нужно передать хотя бы одно поле",
);

const queryBoolean = z.enum(["true", "false"]).transform((value) => value === "true");

export const measurementListQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().pipe(z.union([z.literal(20), z.literal(50), z.literal(100)])).default(20),
    dateFrom: date.optional(),
    dateTo: date.optional(),
    sampleName: z.string().trim().max(255).optional(),
    sampleNumber: z.string().trim().max(100).optional(),
    organization: z.string().trim().max(255).optional(),
    customer: z.string().trim().max(255).optional(),
    mode1: z.string().trim().max(255).optional(),
    mode2: z.string().trim().max(255).optional(),
    mode3: z.string().trim().max(255).optional(),
    isReference: queryBoolean.optional(),
    isRepair: queryBoolean.optional(),
    hasFile: queryBoolean.optional(),
  })
  .refine((value) => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo, {
    message: "Дата начала не может быть позже даты окончания",
    path: ["dateFrom"],
  });

export const idParameterSchema = z.object({ id: z.uuid() });

export type MeasurementCreateInput = z.infer<typeof measurementCreateSchema>;
export type MeasurementUpdateInput = z.infer<typeof measurementUpdateSchema>;
export type MeasurementListQuery = z.infer<typeof measurementListQuerySchema>;
