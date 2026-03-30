import { useState, useCallback } from "react";
import type { MCQState } from "../types";
import { generateMCQs } from "../utils/learningSessionApi";

export const useMCQ = () => {
  const [mcqState, setMcqState] = useState<MCQState>({
    questions: [],
    userAnswers: [],
    submitted: false,
    score: { correct: 0, total: 0 },
    loading: false,
  });

  const generateQuestions = useCallback(async (
    sessionId: string,
    maxQuestionsPerDocument: number = 5
  ) => {
    setMcqState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await generateMCQs(sessionId, maxQuestionsPerDocument);

      if (response.success) {
        setMcqState({
          questions: response.questions,
          userAnswers: new Array(response.questions.length).fill(-1),
          submitted: false,
          score: { correct: 0, total: response.questions.length },
          loading: false,
        });
        return { success: true };
      } else {
        setMcqState((prev) => ({ ...prev, loading: false }));
        return {
          success: false,
          error: response.error || "Failed to generate MCQs",
        };
      }
    } catch (error) {
      setMcqState((prev) => ({ ...prev, loading: false }));
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate MCQs",
      };
    }
  }, []);

  const selectAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    setMcqState((prev) => {
      const newAnswers = [...prev.userAnswers];
      newAnswers[questionIndex] = answerIndex;
      return { ...prev, userAnswers: newAnswers };
    });
  }, []);

  const submitAnswers = useCallback(() => {
    setMcqState((prev) => {
      let correct = 0;
      prev.questions.forEach((question, index) => {
        if (prev.userAnswers[index] === question.correct_index) {
          correct++;
        }
      });

      return {
        ...prev,
        submitted: true,
        score: { correct, total: prev.questions.length },
      };
    });
  }, []);

  const resetMCQ = useCallback(() => {
    setMcqState({
      questions: [],
      userAnswers: [],
      submitted: false,
      score: { correct: 0, total: 0 },
      loading: false,
    });
  }, []);

  const resetMCQAnswers = useCallback(() => {
    setMcqState((prev) => ({
      ...prev,
      userAnswers: new Array(prev.questions.length).fill(-1),
      submitted: false,
      score: { correct: 0, total: prev.questions.length },
    }));
  }, []);

  const isAllAnswered = mcqState.userAnswers.every((answer) => answer !== -1);

  return {
    ...mcqState,
    generateQuestions,
    selectAnswer,
    submitAnswers,
    resetMCQ,
    resetMCQAnswers,
    isAllAnswered,
  };
};
