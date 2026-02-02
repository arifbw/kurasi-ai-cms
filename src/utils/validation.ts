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

export interface SectorFormData {
  name: string;
  description: string;
  category: string;
}

export interface ClientFormData {
  name: string;
  project_id: number;
  category: string;
  sector_id?: string;
  logo?: string;
}

export interface EntityWithName {
  name: string;
  category?: string;
}

export const validateSectorForm = (
  data: SectorFormData,
  existingSectors: EntityWithName[],
  isEditing: boolean
): ValidationResult => {
  const name = data.name.trim();
  const description = data.description.trim();
  const category = data.category.trim();

  if (!name || name.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' };
  }

  if (!description || description.length < 3) {
    return { valid: false, error: 'Description must be at least 3 characters' };
  }

  if (!category) {
    return { valid: false, error: 'Please select a data source' };
  }

  if (!isEditing) {
    const isDuplicate = existingSectors.some(
      (s) => s.name.toLowerCase() === name.toLowerCase() && s.category === category
    );
    if (isDuplicate) {
      return { valid: false, error: 'A sector with this name and data source already exists' };
    }
  }

  return { valid: true };
};

export const validateClientForm = (
  data: ClientFormData,
  existingClients: EntityWithName[],
  isEditing: boolean
): ValidationResult => {
  const name = data.name.trim();
  const category = data.category.trim();

  if (!name || name.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' };
  }

  if (!category) {
    return { valid: false, error: 'Please select a data source' };
  }

  if (data.project_id <= 0) {
    return { valid: false, error: 'Project ID must be a positive number' };
  }

  if (!isEditing) {
    const isDuplicate = existingClients.some(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      return { valid: false, error: 'A client with this name already exists' };
    }
  }

  return { valid: true };
};
