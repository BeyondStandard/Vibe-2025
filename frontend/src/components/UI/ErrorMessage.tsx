import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`error-message ${className}`}>
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <p className="error-title">Something went wrong</p>
          <p className="error-description">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline btn-sm">
          Try Again
        </button>
      )}
    </div>
  );
};
