export interface User {
  id: string;
  login: string;
}

export interface MeasurementFile {
  id: string;
  originalName: string;
  size: number;
  createdAt?: string;
}

export interface Measurement {
  id: string;
  sampleName: string;
  sampleNumber: string;
  organization: string | null;
  customer: string | null;
  mode1: string | null;
  mode2: string | null;
  mode3: string | null;
  measurementDate: string;
  measurementTime: string | null;
  isReference: boolean;
  isRepair: boolean;
  file: MeasurementFile | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementInput {
  sampleName: string;
  sampleNumber: string;
  organization: string | null;
  customer: string | null;
  mode1: string | null;
  mode2: string | null;
  mode3: string | null;
  measurementDate: string;
  measurementTime: string | null;
  isReference: boolean;
  isRepair: boolean;
}

export interface MeasurementFilters {
  dateFrom: string;
  dateTo: string;
  sampleName: string;
  sampleNumber: string;
  organization: string;
  customer: string;
  mode1: string;
  mode2: string;
  mode3: string;
  isReference: "" | "true" | "false";
  isRepair: "" | "true" | "false";
  hasFile: "" | "true" | "false";
}

export interface PaginatedMeasurements {
  data: Measurement[];
  pagination: {
    page: number;
    pageSize: 20 | 50 | 100;
    total: number;
    totalPages: number;
  };
}

export type PanelState =
  | { mode: "create" }
  | { mode: "view" | "edit"; measurementId: string }
  | null;

