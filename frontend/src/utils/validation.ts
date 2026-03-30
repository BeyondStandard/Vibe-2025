export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateField = (value: unknown, rules: ValidationRule): string | null => {
  if (rules.required && (value === undefined || value === null || String(value).trim() === "")) {
    return "This field is required";
  }

  if (
    value != null &&
    rules.minLength &&
    typeof value === "string" &&
    value.length < rules.minLength
  ) {
    return `Must be at least ${rules.minLength} characters`;
  }

  if (
    value != null &&
    rules.maxLength &&
    typeof value === "string" &&
    value.length > rules.maxLength
  ) {
    return `Must be no more than ${rules.maxLength} characters`;
  }

  if (
    value != null &&
    rules.pattern &&
    typeof value === "string" &&
    !rules.pattern.test(value)
  ) {
    return 'Invalid format';
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const validateForm = (
  data: Record<string, unknown>,
  rules: Record<string, ValidationRule>
): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach(field => {
    const error = validateField(data[field], rules[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Common validation rules
export const commonRules = {
  required: { required: true },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  minLength: (min: number) => ({ minLength: min }),
  maxLength: (max: number) => ({ maxLength: max }),
  fileType: (allowedTypes: string[]) => ({
    custom: (file: File) => {
      if (!file) return null;
      const extension = file.name.split('.').pop()?.toUpperCase();
      return allowedTypes.includes(extension || '') 
        ? null 
        : `File type must be one of: ${allowedTypes.join(', ')}`;
    }
  }),
  fileSize: (maxSizeMB: number) => ({
    custom: (file: File) => {
      if (!file) return null;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      return file.size > maxSizeBytes 
        ? `File size must be less than ${maxSizeMB}MB`
        : null;
    }
  }),
};
