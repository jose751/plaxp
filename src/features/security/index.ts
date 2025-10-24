/**
 * Exportaciones del módulo Login
 * Punto de entrada principal para el feature de Login
 */

// Páginas
export { LoginPage } from './pages/LoginPage';

// Componentes
export { LoginCard } from './components/LoginCard';
export { InputField } from '../../shared/components/InputField';

// Hooks
export { useAuth } from './hooks/useAuth';

// Schemas (Interfaces y Tipos)
export type { ValidationResult, LoginFormData } from './schemas/loginSchema';

// Validaciones
export { LoginValidation } from './validations/loginValidation';
