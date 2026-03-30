import React from 'react';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  onLogout?: () => void;
  isLoading?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onRefresh,
  onLogout,
  isLoading = false,
  showAddButton = false,
  onAddClick,
}) => {
  return (
    <div className="dashboard-header">
      <div className="header-left">
        {showAddButton && (
          <button
            className="add-industry-btn"
            onClick={onAddClick}
            title="Add New Industry"
          >
            <span className="plus-icon">+</span>
          </button>
        )}
        <h1 className="dashboard-title">{title}</h1>
      </div>
      <div className="header-right">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="refresh-btn"
            title="Refresh Sessions"
            disabled={isLoading}
          >
            <span className="refresh-icon">↻</span>
          </button>
        )}
        {onLogout && (
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        )}
      </div>
    </div>
  );
};
