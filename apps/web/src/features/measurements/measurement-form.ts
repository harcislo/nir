import { z } from "zod";
import type { Measurement, MeasurementInput } from "../../types";

export const measurementFormSchema = z.object({
  sampleName: z.string().trim().min(1, "Укажите название образца").max(255),
  sampleNumber: z.string().trim().min(1, "Укажите номер образца").max(100),
  organization: z.string().max(255),
  customer: z.string().max(255),
  mode1: z.string().max(255),
  mode2: z.string().max(255),
  mode3: z.string().max(255),
  measurementDate: z.string().min(1, "Укажите дату измерения"),
  measurementTime: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "Некорректное время"),
  isReference: z.boolean(),
  isRepair: z.boolean(),
});

export type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

export const emptyMeasurementForm: MeasurementFormValues = {
  sampleName: "",
  sampleNumber: "",
  organization: "",
  customer: "",
  mode1: "",
  mode2: "",
  mode3: "",
  measurementDate: "",
  measurementTime: "",
  isReference: false,
  isRepair: false,
};

export function measurementToForm(measurement: Measurement): MeasurementFormValues {
  return {
    sampleName: measurement.sampleName,
    sampleNumber: measurement.sampleNumber,
    organization: measurement.organization ?? "",
    customer: measurement.customer ?? "",
    mode1: measurement.mode1 ?? "",
    mode2: measurement.mode2 ?? "",
    mode3: measurement.mode3 ?? "",
    measurementDate: measurement.measurementDate,
    measurementTime: measurement.measurementTime?.slice(0, 5) ?? "",
    isReference: measurement.isReference,
    isRepair: measurement.isRepair,
  };
}

export function formToMeasurementInput(values: MeasurementFormValues): MeasurementInput {
  return {
    ...values,
    organization: values.organization || null,
    customer: values.customer || null,
    mode1: values.mode1 || null,
    mode2: values.mode2 || null,
    mode3: values.mode3 || null,
    measurementTime: values.measurementTime || null,
  };
}

