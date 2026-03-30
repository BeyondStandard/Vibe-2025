import type {
  LearningSession,
  CreateLearningSessionRequest,
  LearningSessionResponse,
  MCQResponse,
  Document,
  ApiResponse,
} from "../types";
import { apiUrl } from "../config/apiBase";

export const createLearningSession = async (
  data: CreateLearningSessionRequest
): Promise<LearningSessionResponse> => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("description", data.description);
  formData.append("subject", data.subject);

  // Add documents to form data
  data.documents.forEach((file) => {
    formData.append("documents", file);
  });

  const response = await fetch(apiUrl("/api/learning-sessions"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create learning session");
  }

  return response.json();
};

export const getLearningSessions = async (
  subject?: string
): Promise<ApiResponse<{ sessions: LearningSession[] }>> => {
  const url = subject
    ? `${apiUrl("/api/learning-sessions")}?subject=${encodeURIComponent(subject)}`
    : apiUrl("/api/learning-sessions");

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch learning sessions");
  }

  return response.json();
};

export const getLearningSessionById = async (
  id: string
): Promise<
  ApiResponse<{ session: LearningSession; documents: Document[] }>
> => {
  const response = await fetch(apiUrl(`/api/learning-sessions/${id}`));

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch learning session");
  }

  return response.json();
};

export const generateMCQs = async (
  sessionId: string,
  maxQuestionsPerDocument: number = 5
): Promise<MCQResponse> => {
  const response = await fetch(
    apiUrl(`/api/learning-sessions/${sessionId}/mcqs`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxQuestionsPerDocument,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate MCQs");
  }

  return response.json();
};

export const deleteLearningSession = async (
  id: string
): Promise<ApiResponse> => {
  const response = await fetch(apiUrl(`/api/learning-sessions/${id}`), {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete learning session");
  }

  return response.json();
};
