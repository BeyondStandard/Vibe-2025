import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateMCQs } from "../../utils/learningSessionApi";

// Query keys
export const mcqKeys = {
  all: ["mcqs"] as const,
  bySession: (sessionId: string) =>
    [...mcqKeys.all, "session", sessionId] as const,
};

// Generate MCQs query
export const useMCQGeneration = (
  sessionId: string,
  maxQuestionsPerDocument = 5,
  enabled = true
) => {
  return useQuery({
    queryKey: mcqKeys.bySession(sessionId),
    queryFn: () => generateMCQs(sessionId, maxQuestionsPerDocument),
    enabled: enabled && !!sessionId,
    staleTime: Infinity, // MCQs don't change, so cache forever
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    select: (data) => data.questions || [],
  });
};

// Generate MCQs mutation (for manual trigger)
export const useGenerateMCQs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      maxQuestionsPerDocument = 5,
    }: {
      sessionId: string;
      maxQuestionsPerDocument?: number;
    }) => generateMCQs(sessionId, maxQuestionsPerDocument),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Set the data in cache
        queryClient.setQueryData(
          mcqKeys.bySession(variables.sessionId),
          response
        );
      }
    },
  });
};
