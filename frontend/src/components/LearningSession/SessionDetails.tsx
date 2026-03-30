import React from "react";
import type { LearningSession, Document } from "../../types";
import { REVERSE_SUBJECT_MAP } from "../../types";

interface SessionDetailsProps {
  session: LearningSession;
  documents: Document[];
  onClose: () => void;
  onEdit: () => void;
  onStartSession: () => void;
  onAddFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDocument: (documentId: number) => void;
  isLoading: boolean;
  isUploading: boolean;
  isStartingSession: boolean;
}

export const SessionDetails: React.FC<SessionDetailsProps> = ({
  session,
  documents,
  onClose,
  onEdit,
  onStartSession,
  onAddFiles,
  onDeleteDocument,
  isLoading,
  isUploading,
  isStartingSession,
}) => {
  return (
    <div className="session-details">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner large"></div>
            <p>Loading session details...</p>
          </div>
        </div>
      )}

      <div className="session-details-header">
        <h2>{session.name}</h2>
        <button onClick={onClose} className="close-btn">
          ✕
        </button>
      </div>

      <div className="session-info">
        <p className="session-description-text">{session.description}</p>
        <div className="session-meta">
          <span className="session-subject">
            Subject: {REVERSE_SUBJECT_MAP[session.subject] || session.subject}
          </span>
          <span className="session-date">
            Created: {new Date(session.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="files-section">
        <div className="files-header">
          <h3>Uploaded Documents ({documents.length})</h3>
          <label className="add-files-btn">
            {isUploading ? "Uploading..." : "+ Add More Files"}
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
              onChange={onAddFiles}
              style={{ display: "none" }}
              disabled={isUploading}
            />
          </label>
        </div>

        {documents.length > 0 ? (
          <div className="files-list">
            {documents.map((document) => (
              <div key={document.id} className="file-item-detailed">
                <div className="file-info">
                  <span className="file-icon">📄</span>
                  <span className="file-name">
                    {document.original_filename}
                  </span>
                  <span className="file-size">
                    {(document.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span className="file-type">{document.file_type}</span>
                </div>
                <button
                  onClick={() => onDeleteDocument(document.id)}
                  className="remove-file-btn"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-files">
            <div className="no-files-icon">📁</div>
            <p>No documents uploaded yet</p>
            <p className="no-files-subtitle">
              Click "Add More Files" to upload documents
            </p>
          </div>
        )}
      </div>

      <div className="session-actions">
        <button onClick={onClose} className="btn btn-outline">
          Close
        </button>
        {documents.length > 0 && (
          <button
            onClick={onStartSession}
            className="btn btn-success"
            disabled={isStartingSession}
          >
            {isStartingSession ? (
              <div className="loading-spinner">
                <span className="spinner"></span>
                Generating Questions...
              </div>
            ) : (
              "Start Session"
            )}
          </button>
        )}
        <button onClick={onEdit} className="btn btn-primary">
          Edit Session
        </button>
      </div>
    </div>
  );
};
