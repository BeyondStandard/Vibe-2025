import React from 'react';

interface HomePageProps {
  onGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="app home-view">
      <div className="home-container">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">
              <div className="logo-icon-inner">
                <div className="logo-icon-dot"></div>
              </div>
            </div>
            <span className="logo-text">SmartPanda</span>
          </div>

          <button onClick={onGetStarted} className="btn btn-primary">
            Get Started
          </button>
        </header>

        {/* Main Content */}
        <main className="main-content">
          <div className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">Learn from Your Mistakes</h1>
              <p className="hero-description">
                Upload your course materials, take practice exams, and get
                AI-powered feedback to understand what went wrong and improve
                your learning.
              </p>

              <div className="features-preview">
                <div className="feature-item">
                  <div className="feature-icon-small">📚</div>
                  <span>Practice Exams</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-small">🔍</div>
                  <span>Mistake Analysis</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-small">🤖</div>
                  <span>AI Feedback</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-small">📊</div>
                  <span>Progress Tracking</span>
                </div>
              </div>
            </div>

            <div className="panda-section">
              <div className="panda-container">
                <div className="panda-bg-1"></div>
                <div className="panda-bg-2"></div>
                <div className="panda-character"></div>
                <div className="floating-icon floating-icon-1">📚</div>
                <div className="floating-icon floating-icon-2">💡</div>
                <div className="floating-icon floating-icon-3">✅</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
