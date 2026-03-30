import { useState, useCallback } from "react";
import { validateForm } from "../utils/validation";
import type { ValidationRule, ValidationErrors } from "../utils/validation";

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule>>;
  onSubmit: (values: T) => void | Promise<void>;
}

export const useForm = <T extends Record<string, unknown>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(
    (field: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field as string]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const validate = useCallback((): boolean => {
    const validationErrors = validateForm(
      values,
      validationRules as Record<string, ValidationRule>
    );
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [values, validationRules]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!validate()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field] || "",
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => {
        setValue(field, e.target.value);
      },
      error: errors[field as string],
    }),
    [values, errors, setValue]
  );

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    setError,
    clearErrors,
    reset,
    validate,
    handleSubmit,
    getFieldProps,
  };
};
