// Hospital configuration for Colmeia API
export interface HospitalConfig {
  id: string;
  name: string;
  socialNetworkId: string;
  tokenId: string; // Each hospital needs its own token ID for authentication
}

export const HOSPITALS: HospitalConfig[] = [
  {
    id: "hecad",
    name: "HECAD",
    socialNetworkId: "oFzvyMeL6e8ALfPc4DPQlCNTwWhuU9",
    tokenId: import.meta.env.VITE_COLMEIA_TOKEN_ID || "",
  },
  {
    id: "crer",
    name: "CRER",
    socialNetworkId: "K36LwFWX0tIrMjmRm643PqLSziJ9pU",
    tokenId: "HuHSUEXA6s24wtzkuniHFjVgJNrLAaZa",
  },
  {
    id: "hds",
    name: "HDS",
    socialNetworkId: "SHieySEXmlspZdFQ31Dd7bEuqkSUHr",
    tokenId: "TcGDVi4oLY3PkCZEK80XM2FUTsdmzQUZ",
  },
  {
    id: "hugol",
    name: "HUGOL",
    socialNetworkId: "riOMRFeqi2QEwz3QT0PVQEK8YbtTle",
    tokenId: "Y55ws6KLk9IAPxNR2vBfyXvEni4S8aVl",
  },
];

// Template Types
export interface Template {
  id: string;
  name: string;
  hospital_id?: string | null;
  campaign_action_id?: string | null;
  parameter_1?: string | null;
  parameter_2?: string | null;
  parameter_3?: string | null;
  parameter_4?: string | null;
  parameter_5?: string | null;
  parameter_6?: string | null;
  parameter_7?: string | null;
  parameter_8?: string | null;
  parameter_9?: string | null;
  parameter_10?: string | null;
  parameter_11?: string | null;
  parameter_12?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateFormData {
  name: string;
  hospital_id?: string;
  campaign_action_id?: string;
  parameter_1?: string;
  parameter_2?: string;
  parameter_3?: string;
  parameter_4?: string;
  parameter_5?: string;
  parameter_6?: string;
  parameter_7?: string;
  parameter_8?: string;
  parameter_9?: string;
  parameter_10?: string;
  parameter_11?: string;
  parameter_12?: string;
  image?: File | string | null;
}

// Sending History Types
export type SendingStatus = "success" | "failed" | "pending";
export type SendingType = "individual" | "bulk";

export interface SendingHistory {
  id: string;
  template_id?: string;
  template_name: string;
  description?: string;
  phone?: string;
  phone_list?: string; // JSON array of phone numbers for bulk sends
  sending_type: SendingType;
  status: SendingStatus;
  error_message?: string;
  total_sent?: number;
  created_at: string;
}

// Individual Sending Types
export interface IndividualSendingData {
  template_id: string;
  phone: string;
  parameters: Record<string, string>;
}

// Bulk Sending Types
export interface BulkSendingRow {
  phone: string;
  param1?: string;
  param2?: string;
  param3?: string;
  param4?: string;
  param5?: string;
  param6?: string;
  param7?: string;
  param8?: string;
  param9?: string;
  param10?: string;
  param11?: string;
  param12?: string;
}

export interface BulkSendingData {
  description: string;
  template_id: string;
  rows: BulkSendingRow[];
}

// CSV Row Type (used in bulk sending page)
export interface CSVRow {
  phone: string;
  param_1?: string;
  param_2?: string;
  param_3?: string;
  param_4?: string;
  param_5?: string;
  param_6?: string;
  param_7?: string;
  param_8?: string;
  param_9?: string;
  param_10?: string;
  param_11?: string;
  param_12?: string;
}

// CSV Validation
export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  data: CSVRow[];
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
