/**
 * Exportaciones del módulo Security
 * Punto de entrada principal para el feature de Seguridad (Login y Recuperación)
 */

// Páginas
export { LoginPage } from './pages/LoginPage';
export { PasswordRecoveryPage } from './pages/PasswordRecoveryPage';
export { VerifyCodePage } from './pages/VerifyCodePage';
export { ResetPasswordPage } from './pages/ResetPasswordPage';

// Componentes
export { LoginCard } from './components/LoginCard';
export { PasswordRecoveryCard } from './components/PasswordRecoveryCard';
export { VerifyCodeCard } from './components/VerifyCodeCard';
export { ResetPasswordCard } from './components/ResetPasswordCard';
export { CodeInput } from './components/CodeInput';
export { InputField } from '../../shared/components/InputField';

// Hooks
export { useAuth } from './hooks/useAuth';
export { usePasswordRecovery } from './hooks/usePasswordRecovery';

// Context
export { PasswordRecoveryProvider, PasswordRecoveryContext } from './context/PasswordRecoveryContext';
export type { PasswordRecoveryContextType } from './context/PasswordRecoveryContext';

// Schemas
export type { ValidationResult, LoginFormData } from './schemas/loginSchema';
export type {
  User,
  LoginResponse,
  RecuperacionResponse,
  VerificarCodigoResponse,
  RestablecerContrasenaResponse,
} from './schemas/securityApiSchema';

// API
export {
  loginApi,
  solicitarRecuperacionApi,
  verificarCodigoRecuperacionApi,
  restablecerContrasenaApi,
} from './api/SecurityApi';

// Validaciones
export { LoginValidation } from './validations/loginValidation';
