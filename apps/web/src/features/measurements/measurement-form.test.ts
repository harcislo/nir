import { describe, expect, it } from "vitest";
import type { Measurement } from "../../types";
import {
  formToMeasurementInput,
  measurementFormSchema,
  measurementToForm,
} from "./measurement-form";

describe("measurement form", () => {
  it("converts empty optional fields to null for the API", () => {
    expect(
      formToMeasurementInput({
        sampleName: "Образец",
        sampleNumber: "42",
        organization: "",
        customer: "",
        mode1: "",
        mode2: "",
        mode3: "",
        measurementDate: "2026-09-21",
        measurementTime: "",
        isReference: false,
        isRepair: true,
      }),
    ).toEqual({
      sampleName: "Образец",
      sampleNumber: "42",
      organization: null,
      customer: null,
      mode1: null,
      mode2: null,
      mode3: null,
      measurementDate: "2026-09-21",
      measurementTime: null,
      isReference: false,
      isRepair: true,
    });
  });

  it("maps an API measurement into editable values", () => {
    const measurement: Measurement = {
      id: "measurement-id",
      sampleName: "A",
      sampleNumber: "001",
      organization: null,
      customer: "Заказчик",
      mode1: null,
      mode2: "M2",
      mode3: null,
      measurementDate: "2026-09-20",
      measurementTime: "13:45:00",
      isReference: true,
      isRepair: false,
      file: null,
      createdAt: "2026-09-20T10:00:00.000Z",
      updatedAt: "2026-09-20T10:00:00.000Z",
    };

    expect(measurementToForm(measurement)).toMatchObject({
      organization: "",
      customer: "Заказчик",
      mode2: "M2",
      measurementTime: "13:45",
    });
  });

  it("rejects missing required fields and invalid time", () => {
    const result = measurementFormSchema.safeParse({
      sampleName: "",
      sampleNumber: "",
      organization: "",
      customer: "",
      mode1: "",
      mode2: "",
      mode3: "",
      measurementDate: "",
      measurementTime: "25:90",
      isReference: false,
      isRepair: false,
    });

    expect(result.success).toBe(false);
  });
});
