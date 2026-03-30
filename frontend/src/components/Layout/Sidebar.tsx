import React from "react";
import type { LearningSession, SubjectType } from "../../types";
import { SUBJECTS } from "../../types";
import { LoadingSpinner } from "../UI/LoadingSpinner";

interface SidebarProps {
  selectedSubject: SubjectType;
  onSubjectChange: (subject: SubjectType) => void;
  sessions: LearningSession[];
  onSessionClick: (session: LearningSession) => void;
  selectedSession: LearningSession | null;
  onCreateSession: () => void;
  isLoading: boolean;
  getSessionsForSubject: (subject: SubjectType) => LearningSession[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedSubject,
  onSubjectChange,
  onSessionClick,
  selectedSession,
  onCreateSession,
  isLoading,
  getSessionsForSubject,
}) => {
  // Debug logging
  console.log("Sidebar - selectedSubject:", selectedSubject);
  console.log("Sidebar - isLoading:", isLoading);
  const sessionsForSubject = getSessionsForSubject(selectedSubject);
  console.log("Sidebar - sessionsForSubject:", sessionsForSubject);
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <div className="logo-icon-inner">
              <div className="logo-icon-dot"></div>
            </div>
          </div>
          <span className="logo-text">SmartPanda</span>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="subjects-section">
          <h3 className="sidebar-title">Subjects</h3>
          {SUBJECTS.map((subject) => (
            <div
              key={subject}
              className={`subject-item ${
                selectedSubject === subject ? "active" : ""
              }`}
              onClick={() => onSubjectChange(subject)}
            >
              <span className="subject-name">{subject}</span>
              <span className="session-count">
                {getSessionsForSubject(subject).length}
              </span>
            </div>
          ))}
        </div>

        <div className="sessions-section">
          <div className="sessions-header">
            <h3 className="sidebar-title">Learning Sessions</h3>
            <button onClick={onCreateSession} className="add-session-btn">
              + New Session
            </button>
          </div>

          <div className="sessions-list">
            {isLoading ? (
              <div className="loading-sessions">
                <LoadingSpinner size="medium" text="Loading sessions..." />
              </div>
            ) : sessionsForSubject.length > 0 ? (
              sessionsForSubject.map((session) => (
                <div
                  key={session.id}
                  className={`session-item ${
                    selectedSession?.id === session.id ? "active" : ""
                  }`}
                  onClick={() => onSessionClick(session)}
                >
                  <div className="session-name">{session.name}</div>
                  <div className="session-description">
                    {session.description}
                  </div>
                  <div className="session-files">
                    {session.document_count || 0} files
                  </div>
                </div>
              ))
            ) : (
              <div className="no-sessions">
                No sessions found for {selectedSubject}. Create your first
                session!
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
