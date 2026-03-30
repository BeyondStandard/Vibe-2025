import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./hooks/useAuth";
import {
  useLearningSessions,
  useCreateLearningSession,
  useLearningSession,
  learningSessionKeys,
} from "./hooks/queries/useLearningSessionsQuery";
import {
  useUploadDocument,
  useDeleteDocument,
  documentKeys,
} from "./hooks/queries/useDocumentsQuery";
import { useMCQ } from "./hooks/useMCQ";
import { HomePage } from "./components/Home/HomePage";
import { LoginForm } from "./components/Auth/LoginForm";
import { Onboarding } from "./components/Auth/Onboarding";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { ErrorBoundary } from "./components/UI/ErrorBoundary";
import { LoadingSpinner } from "./components/UI/LoadingSpinner";
import type { LearningSession, SubjectType } from "./types";
import { SUBJECT_MAP } from "./types";

function AppContent() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get subject from URL or default to Math
  const getSubjectFromPath = (): SubjectType => {
    const path = location.pathname;
    if (path.includes("/medicine")) return "Medicine";
    if (path.includes("/computer-science")) return "Computer Science";
    return "Math";
  };

  const [selectedSubject, setSelectedSubject] = useState<SubjectType>(
    getSubjectFromPath()
  );
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(
    null
  );
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: sessions = [], isLoading: sessionsLoading } =
    useLearningSessions();

  // React Query mutations
  const createSessionMutation = useCreateLearningSession();
  const uploadDocumentMutation = useUploadDocument();
  const deleteDocumentMutation = useDeleteDocument();

  // Get session details with React Query
  const { data: sessionDetails } = useLearningSession(
    selectedSession?.id?.toString() || "",
    !!selectedSession
  );

  // Helper function to get sessions for selected subject
  const getSessionsForSubject = (subject: SubjectType) => {
    const subjectMap = {
      Math: "MATH",
      Medicine: "MEDICINE",
      "Computer Science": "COMPUTER_SCIENCE",
    };
    return sessions.filter(
      (session) => session.subject === subjectMap[subject]
    );
  };

  const {
    questions: mcqQuestions,
    userAnswers: mcqUserAnswers,
    submitted: mcqSubmitted,
    score: mcqScore,
    loading: mcqLoading,
    generateQuestions,
    selectAnswer: onMCQAnswerSelect,
    submitAnswers: onMCQSubmit,
    resetMCQ,
    resetMCQAnswers,
    isAllAnswered,
  } = useMCQ();

  // Simple authentication redirect - only redirect if not authenticated and trying to access protected routes
  useEffect(() => {
    if (!authLoading && !isAuthenticated && location.pathname.startsWith("/dashboard")) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, location.pathname, navigate]);

  // Sync subject with URL - only when path changes
  useEffect(() => {
    const newSubject = getSubjectFromPath();
    if (newSubject !== selectedSubject) {
      setSelectedSubject(newSubject);
    }
  }, [location.pathname, selectedSubject]);

  const handleSubjectChange = (subject: SubjectType) => {
    setSelectedSubject(subject);
    // Clear session state when switching subjects
    setSelectedSession(null);
    setShowSessionDetails(false);
    resetMCQ();

    // Navigate to the subject route
    const subjectRoutes = {
      Math: "/math",
      Medicine: "/medicine",
      "Computer Science": "/computer-science",
    };
    navigate(subjectRoutes[subject]);
  };

  const handleLogin = (email: string, password: string): boolean => {
    const success = login(email, password);
    if (success) {
      navigate("/dashboard");
    }
    return success;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setSelectedSession(null);
    setShowSessionDetails(false);
    setShowCreateSession(false);
    resetMCQ();
  };

  const handleCreateSession = async (sessionData: {
    name: string;
    description: string;
    files: File[];
    subject: SubjectType;
  }) => {
    try {
      const response = await createSessionMutation.mutateAsync({
        name: sessionData.name,
        description: sessionData.description,
        subject: SUBJECT_MAP[sessionData.subject] as
          | "MATH"
          | "MEDICINE"
          | "COMPUTER_SCIENCE",
        documents: sessionData.files,
      });

      if (response.success) {
        setShowCreateSession(false);
      } else {
        alert(response.error || "Failed to create session");
      }
    } catch {
      alert("Failed to create session. Please try again.");
    }
  };

  const handleSessionClick = async (session: LearningSession) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
    setShowCreateSession(false);
    // React Query will handle loading state and data fetching
  };

  const handleSessionClose = () => {
    setShowSessionDetails(false);
    setSelectedSession(null);
    resetMCQ();
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!selectedSession) return;

    setUploading(true);
    try {
      for (const file of files) {
        await uploadDocumentMutation.mutateAsync({
          file,
          subject: selectedSession.subject,
          learningSessionId: selectedSession.id.toString(),
        });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await deleteDocumentMutation.mutateAsync(documentId);
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Error deleting document. Please try again.");
    }
  };

  const handleStartSession = async () => {
    const docs = sessionDetails?.documents ?? [];
    if (!selectedSession || docs.length === 0) return;

    const result = await generateQuestions(selectedSession.id.toString(), 5);
    if (result.success) {
      setShowSessionDetails(false);
      } else {
      alert(result.error || "Failed to generate questions");
    }
  };

  const handleMCQBackToSession = () => {
    setShowSessionDetails(true);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: learningSessionKeys.all });
    if (selectedSession) {
      await queryClient.invalidateQueries({
        queryKey: learningSessionKeys.detail(selectedSession.id.toString()),
      });
      await queryClient.invalidateQueries({
        queryKey: documentKeys.bySession(selectedSession.id.toString()),
      });
    }
  };

  if (authLoading) {
    return (
      <div className="app loading-view">
        <div className="loading-container">
          <LoadingSpinner size="large" text="Loading..." />
        </div>
      </div>
    );
  }

    return (
    <Routes>
      <Route
        path="/"
        element={<HomePage onGetStarted={() => navigate("/login")} />}
      />
      <Route
        path="/login"
        element={
          <LoginForm onLogin={handleLogin} onBack={() => navigate("/")} />
        }
      />
      <Route
        path="/onboarding"
        element={<Onboarding onComplete={() => navigate("/dashboard")} />}
      />
      <Route
        path="/dashboard"
        element={
          !isAuthenticated ? (
            <HomePage onGetStarted={() => navigate("/login")} />
          ) : (
            <Dashboard
            selectedSubject={selectedSubject}
            onSubjectChange={handleSubjectChange}
            sessions={sessions}
            selectedSession={selectedSession}
            documents={sessionDetails?.documents || []}
            onSessionClick={handleSessionClick}
            onSessionClose={handleSessionClose}
            onSessionEdit={() => setShowCreateSession(true)}
            onCreateSession={() => setShowCreateSession(true)}
            onCreateSessionSubmit={handleCreateSession}
            onCreateSessionCancel={() => setShowCreateSession(false)}
            onAddFiles={handleAddFiles}
            onDeleteDocument={handleDeleteDocument}
            onStartSession={handleStartSession}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            getSessionsForSubject={getSessionsForSubject}
            mcqQuestions={mcqQuestions}
            mcqUserAnswers={mcqUserAnswers}
            mcqSubmitted={mcqSubmitted}
            mcqScore={mcqScore}
            mcqLoading={mcqLoading}
            onMCQAnswerSelect={onMCQAnswerSelect}
            onMCQSubmit={onMCQSubmit}
            onMCQReset={resetMCQAnswers}
            onMCQBackToSession={handleMCQBackToSession}
            isMCQAllAnswered={isAllAnswered}
            showCreateSession={showCreateSession}
            showSessionDetails={showSessionDetails}
            showMCQ={mcqQuestions.length > 0}
            isLoading={sessionsLoading}
            isCreatingSession={createSessionMutation.isPending}
            isUploading={uploading || uploadDocumentMutation.isPending}
            isStartingSession={mcqLoading}
          />
          )
        }
      />
      <Route
        path="/math"
        element={
          !isAuthenticated ? (
            <HomePage onGetStarted={() => navigate("/login")} />
          ) : (
            <Dashboard
            selectedSubject="Math"
            onSubjectChange={handleSubjectChange}
            sessions={sessions}
            selectedSession={selectedSession}
            documents={sessionDetails?.documents || []}
            onSessionClick={handleSessionClick}
            onSessionClose={handleSessionClose}
            onSessionEdit={() => setShowCreateSession(true)}
            onCreateSession={() => setShowCreateSession(true)}
            onCreateSessionSubmit={handleCreateSession}
            onCreateSessionCancel={() => setShowCreateSession(false)}
            onAddFiles={handleAddFiles}
            onDeleteDocument={handleDeleteDocument}
            onStartSession={handleStartSession}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            getSessionsForSubject={getSessionsForSubject}
            mcqQuestions={mcqQuestions}
            mcqUserAnswers={mcqUserAnswers}
            mcqSubmitted={mcqSubmitted}
            mcqScore={mcqScore}
            mcqLoading={mcqLoading}
            onMCQAnswerSelect={onMCQAnswerSelect}
            onMCQSubmit={onMCQSubmit}
            onMCQReset={resetMCQAnswers}
            onMCQBackToSession={handleMCQBackToSession}
            isMCQAllAnswered={isAllAnswered}
            showCreateSession={showCreateSession}
            showSessionDetails={showSessionDetails}
            showMCQ={mcqQuestions.length > 0}
            isLoading={sessionsLoading}
            isCreatingSession={createSessionMutation.isPending}
            isUploading={uploading || uploadDocumentMutation.isPending}
            isStartingSession={mcqLoading}
          />
          )
        }
      />
      <Route
        path="/medicine"
        element={
          !isAuthenticated ? (
            <HomePage onGetStarted={() => navigate("/login")} />
          ) : (
            <Dashboard
            selectedSubject="Medicine"
            onSubjectChange={handleSubjectChange}
            sessions={sessions}
            selectedSession={selectedSession}
            documents={sessionDetails?.documents || []}
            onSessionClick={handleSessionClick}
            onSessionClose={handleSessionClose}
            onSessionEdit={() => setShowCreateSession(true)}
            onCreateSession={() => setShowCreateSession(true)}
            onCreateSessionSubmit={handleCreateSession}
            onCreateSessionCancel={() => setShowCreateSession(false)}
            onAddFiles={handleAddFiles}
            onDeleteDocument={handleDeleteDocument}
            onStartSession={handleStartSession}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            getSessionsForSubject={getSessionsForSubject}
            mcqQuestions={mcqQuestions}
            mcqUserAnswers={mcqUserAnswers}
            mcqSubmitted={mcqSubmitted}
            mcqScore={mcqScore}
            mcqLoading={mcqLoading}
            onMCQAnswerSelect={onMCQAnswerSelect}
            onMCQSubmit={onMCQSubmit}
            onMCQReset={resetMCQAnswers}
            onMCQBackToSession={handleMCQBackToSession}
            isMCQAllAnswered={isAllAnswered}
            showCreateSession={showCreateSession}
            showSessionDetails={showSessionDetails}
            showMCQ={mcqQuestions.length > 0}
            isLoading={sessionsLoading}
            isCreatingSession={createSessionMutation.isPending}
            isUploading={uploading || uploadDocumentMutation.isPending}
            isStartingSession={mcqLoading}
          />
          )
        }
      />
      <Route
        path="/computer-science"
        element={
          !isAuthenticated ? (
            <HomePage onGetStarted={() => navigate("/login")} />
          ) : (
            <Dashboard
            selectedSubject="Computer Science"
            onSubjectChange={handleSubjectChange}
            sessions={sessions}
            selectedSession={selectedSession}
            documents={sessionDetails?.documents || []}
            onSessionClick={handleSessionClick}
            onSessionClose={handleSessionClose}
            onSessionEdit={() => setShowCreateSession(true)}
            onCreateSession={() => setShowCreateSession(true)}
            onCreateSessionSubmit={handleCreateSession}
            onCreateSessionCancel={() => setShowCreateSession(false)}
            onAddFiles={handleAddFiles}
            onDeleteDocument={handleDeleteDocument}
            onStartSession={handleStartSession}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            getSessionsForSubject={getSessionsForSubject}
            mcqQuestions={mcqQuestions}
            mcqUserAnswers={mcqUserAnswers}
            mcqSubmitted={mcqSubmitted}
            mcqScore={mcqScore}
            mcqLoading={mcqLoading}
            onMCQAnswerSelect={onMCQAnswerSelect}
            onMCQSubmit={onMCQSubmit}
            onMCQReset={resetMCQAnswers}
            onMCQBackToSession={handleMCQBackToSession}
            isMCQAllAnswered={isAllAnswered}
            showCreateSession={showCreateSession}
            showSessionDetails={showSessionDetails}
            showMCQ={mcqQuestions.length > 0}
            isLoading={sessionsLoading}
            isCreatingSession={createSessionMutation.isPending}
            isUploading={uploading || uploadDocumentMutation.isPending}
            isStartingSession={mcqLoading}
          />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
