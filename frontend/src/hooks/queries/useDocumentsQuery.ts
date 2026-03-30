import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadDocument,
  deleteDocument,
  getDocumentsBySession,
} from "../../utils/api";

// Query keys
export const documentKeys = {
  all: ["documents"] as const,
  bySession: (sessionId: string) =>
    [...documentKeys.all, "session", sessionId] as const,
};

// Get documents by session
export const useDocumentsBySession = (sessionId: string, enabled = true) => {
  return useQuery({
    queryKey: documentKeys.bySession(sessionId),
    queryFn: () => getDocumentsBySession(sessionId),
    enabled: enabled && !!sessionId,
    select: (data) => data.data?.documents || [],
  });
};

// Upload document mutation
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      subject,
      learningSessionId,
    }: {
      file: File;
      subject: string;
      learningSessionId: string;
    }) => uploadDocument(file, subject, learningSessionId),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Invalidate documents for this session
        queryClient.invalidateQueries({
          queryKey: documentKeys.bySession(variables.learningSessionId),
        });
      }
    },
  });
};

// Delete document mutation
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) => deleteDocument(documentId),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate all document queries to update lists
        queryClient.invalidateQueries({ queryKey: documentKeys.all });
      }
    },
  });
};
