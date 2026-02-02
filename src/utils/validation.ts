export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationResult => {
  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  return { valid: true };
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): ValidationResult => {
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }
  return { valid: true };
};

export const validatePositiveNumber = (value: number, fieldName: string): ValidationResult => {
  if (value <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number` };
  }
  return { valid: true };
};

export const validateNoDuplicate = <T>(
  items: T[],
  getValue: (item: T) => string,
  newValue: string,
  fieldName: string
): ValidationResult => {
  const isDuplicate = items.some(
    (item) => getValue(item).toLowerCase() === newValue.toLowerCase()
  );
  if (isDuplicate) {
    return { valid: false, error: `A ${fieldName} with this value already exists` };
  }
  return { valid: true };
};

export const validate = (...results: ValidationResult[]): ValidationResult => {
  for (const result of results) {
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
};
