import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    title: "Welcome to SmartPanda!",
    description:
      "Your AI-powered learning companion that helps you learn from mistakes and improve your understanding.",
    icon: "🐼",
  },
  {
    title: "Organize by Subjects",
    description:
      "Create learning sessions for different subjects like Math, Medicine, and Computer Science.",
    icon: "📚",
  },
  {
    title: "Upload & Learn",
    description:
      "Upload your course materials and let AI help you understand what went wrong in your exams.",
    icon: "📄",
  },
  {
    title: "Track Progress",
    description:
      "Monitor your learning progress and identify areas that need more attention.",
    icon: "📊",
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="app onboarding-view">
      <div className="onboarding-container">
        <div className="onboarding-content">
          <div className="onboarding-icon">
            {onboardingSteps[currentStep].icon}
          </div>
          <h1 className="onboarding-title">
            {onboardingSteps[currentStep].title}
          </h1>
          <p className="onboarding-description">
            {onboardingSteps[currentStep].description}
          </p>

          <div className="onboarding-progress">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${
                  index <= currentStep ? "active" : ""
                }`}
              />
            ))}
          </div>

          <div className="onboarding-buttons">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="btn btn-outline"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="btn btn-primary"
            >
              {currentStep < onboardingSteps.length - 1 ? "Next" : "Get Started"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
