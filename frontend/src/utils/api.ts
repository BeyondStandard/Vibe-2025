import type { Document, ApiResponse } from "../types";
import { apiUrl } from "../config/apiBase";

export type DocumentUploadResponse = ApiResponse<{ document: Document }>;

export const uploadDocument = async (
  file: File,
  subject: string,
  learningSessionId: string
): Promise<DocumentUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject);
  formData.append("learning_session_id", learningSessionId);

  const response = await fetch(apiUrl("/api/documents/upload"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Upload failed");
  }

  return response.json();
};

export const getDocumentsBySession = async (
  learningSessionId: string
): Promise<ApiResponse<{ documents: Document[] }>> => {
  const response = await fetch(
    apiUrl(`/api/documents/session/${learningSessionId}`)
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch documents");
  }

  return response.json();
};

export const deleteDocument = async (
  documentId: number
): Promise<ApiResponse> => {
  const response = await fetch(apiUrl(`/api/documents/${documentId}`), {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Delete failed");
  }

  return response.json();
};
