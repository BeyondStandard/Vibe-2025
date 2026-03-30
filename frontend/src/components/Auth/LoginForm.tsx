import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => boolean;
  onBack: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted with:', { email, password: '***' });
    const success = onLogin(email, password);
    console.log('Login result:', success);
    if (!success) {
      setError('Invalid email or password. Please try again.');
    } else {
      setError('');
      setEmail('');
      setPassword('');
      console.log('Login successful, form cleared');
    }
  };

  return (
    <div className="app login-view">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">
              <div className="logo-icon-inner">
                <div className="logo-icon-dot"></div>
              </div>
            </div>
            <span className="logo-text">SmartPanda</span>
          </div>
        </div>

        <div className="login-form-container">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn">
              Sign In
            </button>
          </form>

          <button onClick={onBack} className="back-btn">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
