import React from "react";
import type { SubjectType } from "../../types";
import { SUBJECTS } from "../../types";
import { commonRules } from "../../utils/validation";
import { useForm } from "../../hooks/useForm";
import { Button } from "../UI/Button";
import { LoadingSpinner } from "../UI/LoadingSpinner";

interface CreateSessionFormProps {
  onSubmit: (sessionData: {
    name: string;
    description: string;
    files: File[];
    subject: SubjectType;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const CreateSessionForm: React.FC<CreateSessionFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { values, errors, isSubmitting, setValue, handleSubmit } = useForm({
    initialValues: {
      name: "",
      description: "",
      files: [] as File[],
      subject: "Math" as SubjectType,
    },
    validationRules: {
      name: commonRules.required,
      subject: commonRules.required,
    },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setValue("files", [...values.files, ...files]);
  };

  return (
    <div className="create-session">
      {isLoading && (
        <div className="loading-overlay">
          <LoadingSpinner
            size="large"
            text="Creating your learning session..."
          />
        </div>
      )}

      <h2>Create New Learning Session</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Session Name</label>
          <input
            type="text"
            value={values.name}
            onChange={(e) => setValue("name", e.target.value)}
            className={`form-input ${errors.name ? "error" : ""}`}
            placeholder="Enter session name"
            disabled={isLoading || isSubmitting}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            value={values.description}
            onChange={(e) => setValue("description", e.target.value)}
            className="form-textarea"
            placeholder="Enter session description"
            rows={3}
            disabled={isLoading || isSubmitting}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Subject</label>
          <select
            value={values.subject}
            onChange={(e) => setValue("subject", e.target.value as SubjectType)}
            className={`form-select ${errors.subject ? "error" : ""}`}
            disabled={isLoading || isSubmitting}
          >
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          {errors.subject && (
            <span className="error-text">{errors.subject}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Upload Files</label>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="file-input"
            disabled={isLoading || isSubmitting}
          />
          <div className="file-list">
            {values.files.map((file, index) => (
              <div key={index} className="file-item">
                📄 {file.name}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading || isSubmitting}
            disabled={!values.name.trim()}
          >
            Create Session
          </Button>
        </div>
      </form>
    </div>
  );
};
