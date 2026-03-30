import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLearningSessions,
  createLearningSession,
  getLearningSessionById,
  deleteLearningSession,
} from "../../utils/learningSessionApi";
import type { CreateLearningSessionRequest } from "../../types";

// Query keys
export const learningSessionKeys = {
  all: ["learningSessions"] as const,
  lists: () => [...learningSessionKeys.all, "list"] as const,
  list: (subject?: string) =>
    [...learningSessionKeys.lists(), { subject }] as const,
  details: () => [...learningSessionKeys.all, "detail"] as const,
  detail: (id: string) => [...learningSessionKeys.details(), id] as const,
};

// Get all learning sessions
export const useLearningSessions = (subject?: string) => {
  return useQuery({
    queryKey: learningSessionKeys.list(subject),
    queryFn: () => getLearningSessions(subject),
    select: (data) => {
      // The API returns {success: true, data: {sessions: [...]}}
      return data.data?.sessions || [];
    },
  });
};

// Get learning session by ID
export const useLearningSession = (id: string, enabled = true) => {
  return useQuery({
    queryKey: learningSessionKeys.detail(id),
    queryFn: () => getLearningSessionById(id),
    enabled: enabled && !!id,
    select: (data) => data.data,
  });
};

// Create learning session mutation
export const useCreateLearningSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLearningSessionRequest) =>
      createLearningSession(data),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate and refetch learning sessions
        queryClient.invalidateQueries({
          queryKey: learningSessionKeys.lists(),
        });
      }
    },
  });
};

// Delete learning session mutation
export const useDeleteLearningSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLearningSession(id),
    onSuccess: (response, id) => {
      if (response.success) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: learningSessionKeys.detail(id) });
        // Invalidate lists
        queryClient.invalidateQueries({
          queryKey: learningSessionKeys.lists(),
        });
      }
    },
  });
};
