import type {
  Measurement,
  MeasurementFilters,
  MeasurementInput,
  PaginatedMeasurements,
} from "../../types";
import { ApiError, apiFetch } from "./client";

function compactText(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function normalizeMeasurementInput(input: Omit<MeasurementInput, "organization" | "customer" | "mode1" | "mode2" | "mode3" | "measurementTime"> & {
  organization: string | null;
  customer: string | null;
  mode1: string | null;
  mode2: string | null;
  mode3: string | null;
  measurementTime: string | null;
}): MeasurementInput {
  return {
    ...input,
    sampleName: input.sampleName.trim(),
    sampleNumber: input.sampleNumber.trim(),
    organization: compactText(input.organization ?? ""),
    customer: compactText(input.customer ?? ""),
    mode1: compactText(input.mode1 ?? ""),
    mode2: compactText(input.mode2 ?? ""),
    mode3: compactText(input.mode3 ?? ""),
    measurementTime: compactText(input.measurementTime ?? ""),
  };
}

export async function listMeasurements(input: {
  page: number;
  pageSize: 20 | 50 | 100;
  filters: MeasurementFilters;
}) {
  const parameters = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  for (const [key, value] of Object.entries(input.filters)) {
    if (value !== "") parameters.set(key, value.trim());
  }

  return apiFetch<PaginatedMeasurements>(`/api/measurements?${parameters.toString()}`);
}

export async function getMeasurement(id: string) {
  return apiFetch<{ data: Measurement }>(`/api/measurements/${id}`);
}

export async function createMeasurement(input: MeasurementInput) {
  return apiFetch<{ data: Measurement }>("/api/measurements", {
    method: "POST",
    body: JSON.stringify(normalizeMeasurementInput(input)),
  });
}

export async function updateMeasurement(id: string, input: MeasurementInput) {
  return apiFetch<{ data: Measurement }>(`/api/measurements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(normalizeMeasurementInput(input)),
  });
}

export async function deleteMeasurement(id: string) {
  return apiFetch<void>(`/api/measurements/${id}`, { method: "DELETE" });
}

export async function uploadMeasurementFile(id: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<{ data: Measurement["file"] }>(`/api/measurements/${id}/file`, {
    method: "POST",
    body,
  });
}

export async function deleteMeasurementFile(id: string) {
  return apiFetch<void>(`/api/measurements/${id}/file`, { method: "DELETE" });
}

export async function downloadMeasurementFile(id: string, fileName: string) {
  const response = await fetch(`/api/measurements/${id}/file`, { credentials: "include" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as
      | { error?: { code?: string; message?: string } }
      | undefined;
    throw new ApiError(
      response.status,
      payload?.error?.code ?? "DOWNLOAD_FAILED",
      payload?.error?.message ?? "Не удалось скачать файл",
    );
  }

  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

