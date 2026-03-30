import React from "react";
import type {
  Document,
  LearningSession,
  MCQQuestion,
  SubjectType,
} from "../../types";
import { Header } from "../Layout/Header";
import { Sidebar } from "../Layout/Sidebar";
import { CreateSessionForm } from "../LearningSession/CreateSessionForm";
import { SessionDetails } from "../LearningSession/SessionDetails";
import { MCQQuiz } from "../MCQ/MCQQuiz";

interface DashboardProps {
  selectedSubject: SubjectType;
  onSubjectChange: (subject: SubjectType) => void;
  sessions: LearningSession[];
  selectedSession: LearningSession | null;
  documents: Document[];
  onSessionClick: (session: LearningSession) => void;
  onSessionClose: () => void;
  onSessionEdit: () => void;
  onCreateSession: () => void;
  onCreateSessionSubmit: (data: {
    name: string;
    description: string;
    files: File[];
    subject: SubjectType;
  }) => Promise<void>;
  onCreateSessionCancel: () => void;
  onAddFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDocument: (documentId: number) => void;
  onStartSession: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  getSessionsForSubject: (subject: SubjectType) => LearningSession[];
  // MCQ props
  mcqQuestions: MCQQuestion[];
  mcqUserAnswers: number[];
  mcqSubmitted: boolean;
  mcqScore: { correct: number; total: number };
  mcqLoading: boolean;
  onMCQAnswerSelect: (questionIndex: number, answerIndex: number) => void;
  onMCQSubmit: () => void;
  onMCQReset: () => void;
  onMCQBackToSession: () => void;
  isMCQAllAnswered: boolean;
  // UI state
  showCreateSession: boolean;
  showSessionDetails: boolean;
  showMCQ: boolean;
  isLoading: boolean;
  isCreatingSession: boolean;
  isUploading: boolean;
  isStartingSession: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedSubject,
  onSubjectChange,
  sessions,
  selectedSession,
  documents,
  onSessionClick,
  onSessionClose,
  onSessionEdit,
  onCreateSession,
  onCreateSessionSubmit,
  onCreateSessionCancel,
  onAddFiles,
  onDeleteDocument,
  onStartSession,
  onRefresh,
  onLogout,
  getSessionsForSubject,
  mcqQuestions,
  mcqUserAnswers,
  mcqSubmitted,
  mcqScore,
  onMCQAnswerSelect,
  onMCQSubmit,
  onMCQReset,
  onMCQBackToSession,
  isMCQAllAnswered,
  showCreateSession,
  showSessionDetails,
  showMCQ,
  isLoading,
  isCreatingSession,
  isUploading,
  isStartingSession,
}) => {
  const sessionsForSubject = getSessionsForSubject(selectedSubject);

  const renderMainContent = () => {
    if (showMCQ && mcqQuestions.length > 0) {
      return (
        <MCQQuiz
          questions={mcqQuestions}
          userAnswers={mcqUserAnswers}
          submitted={mcqSubmitted}
          score={mcqScore}
          onAnswerSelect={onMCQAnswerSelect}
          onSubmit={onMCQSubmit}
          onReset={onMCQReset}
          onBackToSession={onMCQBackToSession}
          isAllAnswered={isMCQAllAnswered}
        />
      );
    }

    if (showCreateSession) {
      return (
        <CreateSessionForm
          onSubmit={onCreateSessionSubmit}
          onCancel={onCreateSessionCancel}
          isLoading={isCreatingSession}
        />
      );
    }

    if (
      showSessionDetails &&
      selectedSession &&
      sessionsForSubject.length > 0
    ) {
      return (
        <SessionDetails
          session={selectedSession}
          documents={documents}
          onClose={onSessionClose}
          onEdit={onSessionEdit}
          onStartSession={onStartSession}
          onAddFiles={onAddFiles}
          onDeleteDocument={onDeleteDocument}
          isLoading={isLoading}
          isUploading={isUploading}
          isStartingSession={isStartingSession}
        />
      );
    }

    // Default welcome content
    return (
      <div className="welcome-content">
        {sessionsForSubject.length > 0 ? (
          <div className="subject-overview">
            <div className="subject-header">
              <div className="subject-icon">📚</div>
              <h2>{selectedSubject} Learning Overview</h2>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{sessionsForSubject.length}</div>
                <div className="stat-label">Learning Sessions</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {sessionsForSubject.reduce(
                    (total, session) => total + (session.document_count || 0),
                    0
                  )}
                </div>
                <div className="stat-label">Total Documents</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {
                    sessionsForSubject.filter(
                      (session) => (session.document_count || 0) > 0
                    ).length
                  }
                </div>
                <div className="stat-label">Sessions with Files</div>
              </div>
            </div>

            <div className="recent-sessions">
              <h3>Recent Sessions</h3>
              <div className="sessions-preview">
                {sessionsForSubject.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="session-preview-card"
                    onClick={() => onSessionClick(session)}
                  >
                    <div className="session-preview-name">{session.name}</div>
                    <div className="session-preview-meta">
                      <span className="session-preview-files">
                        {session.document_count || 0} files
                      </span>
                      <span className="session-preview-date">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button onClick={onCreateSession} className="btn btn-primary">
                + New Session
              </button>
              <button
                onClick={() => {
                  if (sessionsForSubject.length > 0) {
                    onSessionClick(sessionsForSubject[0]);
                  }
                }}
                className="btn btn-outline"
              >
                View All Sessions
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="welcome-icon">📚</div>
            <h2>Welcome to {selectedSubject} Learning!</h2>
            <p>
              Create a new learning session to get started with uploading your
              course materials.
            </p>
            <button onClick={onCreateSession} className="btn btn-primary">
              Create Your First Session
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app dashboard-view">
      <div className="dashboard-container">
        <Sidebar
          selectedSubject={selectedSubject}
          onSubjectChange={onSubjectChange}
          sessions={sessions}
          onSessionClick={onSessionClick}
          selectedSession={selectedSession}
          onCreateSession={onCreateSession}
          isLoading={isLoading}
          getSessionsForSubject={getSessionsForSubject}
        />

        <main className="main-dashboard">
          <Header
            title={`${selectedSubject} Learning Sessions`}
            onRefresh={onRefresh}
            onLogout={onLogout}
            isLoading={isLoading}
            showAddButton={true}
            onAddClick={() => alert("Add New Industry feature coming soon!")}
          />

          <div className="dashboard-content">{renderMainContent()}</div>
        </main>
      </div>
    </div>
  );
};
