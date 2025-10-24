export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

