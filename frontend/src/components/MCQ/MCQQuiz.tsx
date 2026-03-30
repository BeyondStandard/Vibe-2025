import React from "react";
import type { MCQQuestion } from "../../types";

interface MCQQuizProps {
  questions: MCQQuestion[];
  userAnswers: number[];
  submitted: boolean;
  score: { correct: number; total: number };
  onAnswerSelect: (questionIndex: number, answerIndex: number) => void;
  onSubmit: () => void;
  onReset: () => void;
  onBackToSession: () => void;
  isAllAnswered: boolean;
}

export const MCQQuiz: React.FC<MCQQuizProps> = ({
  questions,
  userAnswers,
  submitted,
  score,
  onAnswerSelect,
  onSubmit,
  onReset,
  onBackToSession,
  isAllAnswered,
}) => {
  if (questions.length === 0) {
    return (
      <div className="mcq-container">
        <div className="no-questions">
          <p>No questions available. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mcq-container">
      <div className="mcq-header">
        <h2>Learning Session Quiz</h2>
        <div className="mcq-progress">
          {submitted ? (
            <div className="score-display">
              <span className="score-text">
                Score: {score.correct}/{score.total} (
                {Math.round((score.correct / score.total) * 100)}%)
              </span>
            </div>
          ) : (
            <span>
              Question {userAnswers.filter((a) => a !== -1).length + 1} of{" "}
              {questions.length}
            </span>
          )}
        </div>
      </div>

      <div className="mcq-questions">
        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="mcq-question">
            <h3 className="question-text">{question.question}</h3>
            <div className="options-container">
              {question.options && Array.isArray(question.options) ? (
                question.options.map((option: string, optionIndex: number) => {
                  const isSelected = userAnswers[questionIndex] === optionIndex;
                  const isCorrect = optionIndex === question.correct_index;
                  const isWrong = submitted && isSelected && !isCorrect;
                  const showCorrect = submitted && isCorrect;

                  return (
                    <label
                      key={optionIndex}
                      className={`option-label ${
                        isSelected ? "selected" : ""
                      } ${isWrong ? "wrong" : ""} ${
                        showCorrect ? "correct" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        value={optionIndex}
                        checked={isSelected}
                        onChange={() =>
                          onAnswerSelect(questionIndex, optionIndex)
                        }
                        disabled={submitted}
                      />
                      <span className="option-text">{option}</span>
                      {showCorrect && (
                        <span className="correct-indicator">✓</span>
                      )}
                      {isWrong && <span className="wrong-indicator">✗</span>}
                    </label>
                  );
                })
              ) : (
                <div className="no-options">
                  <p>No options available for this question</p>
                </div>
              )}
            </div>
            {submitted && question.explanation && (
              <div className="explanation">
                <strong>Explanation:</strong> {question.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mcq-actions">
        {!submitted ? (
          <button
            onClick={onSubmit}
            className="btn btn-primary"
            disabled={!isAllAnswered}
          >
            Submit Answers
          </button>
        ) : (
          <div className="mcq-results-actions">
            <button onClick={onReset} className="btn btn-outline">
              Try Again
            </button>
            <button onClick={onBackToSession} className="btn btn-primary">
              Back to Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
