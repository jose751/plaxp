import React, { useRef, useState, useEffect, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  loading?: boolean;
}

/**
 * Componente de input para código de verificación
 * - Soporta 6 dígitos por defecto
 * - Navegación automática entre inputs
 * - Soporte para pegar código completo
 * - Responsive y accesible
 */
export const CodeInput: React.FC<CodeInputProps> = ({
  length = 6,
  onComplete,
  disabled = false,
  error = false,
  loading = false,
}) => {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const previousCodeRef = useRef<string>('');

  // Enfocar el primer input al montar
  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  // Verificar si el código está completo (usando useCallback para estabilizar)
  const checkCompletion = useCallback(() => {
    const isComplete = code.every(digit => digit !== '');
    const currentCode = code.join('');

    if (isComplete && currentCode !== previousCodeRef.current) {
      previousCodeRef.current = currentCode;
      onComplete(currentCode);
    }
  }, [code, onComplete]);

  useEffect(() => {
    checkCompletion();
  }, [checkCompletion]);

  /**
   * Manejar cambio en input individual
   */
  const handleChange = (index: number, value: string) => {
    // Solo aceptar números
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newCode = [...code];

    // Si se pega más de un dígito
    if (value.length > 1) {
      const digits = value.slice(0, length).split('');
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);

      // Enfocar el siguiente input disponible o el último
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Actualizar el dígito actual
      newCode[index] = value;
      setCode(newCode);

      // Mover al siguiente input si hay un valor
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  /**
   * Manejar teclas especiales
   */
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newCode = [...code];

      if (code[index]) {
        // Si hay valor, borrarlo
        newCode[index] = '';
        setCode(newCode);
      } else if (index > 0) {
        // Si no hay valor, ir al anterior y borrarlo
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Manejar pegado de código completo
   */
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();

    // Validar que solo contenga números
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const digits = pastedData.slice(0, length).split('');
    const newCode = [...code];

    digits.forEach((digit, i) => {
      newCode[i] = digit;
    });

    setCode(newCode);

    // Enfocar el último input o el siguiente disponible
    const nextIndex = Math.min(digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  /**
   * Manejar focus - seleccionar todo el contenido
   */
  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-2 sm:gap-3 justify-center w-full max-w-md">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled || loading}
            className={`
              w-12 h-14 sm:w-14 sm:h-16
              text-center text-2xl sm:text-3xl font-bold
              border-2 rounded-xl
              transition-all duration-200
              focus:outline-none focus:ring-4
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                error
                  ? 'border-danger bg-danger/5 text-danger focus:border-danger focus:ring-danger/20'
                  : digit
                  ? 'border-primary bg-primary/5 text-primary focus:border-primary focus:ring-primary/20'
                  : 'border-neutral-300 bg-white text-neutral-900 focus:border-primary focus:ring-primary/20 hover:border-neutral-400'
              }
              ${loading ? 'animate-pulse' : ''}
            `}
            aria-label={`Dígito ${index + 1} del código`}
          />
        ))}
      </div>

      {/* Indicador de progreso */}
      <div className="mt-4 flex gap-1.5">
        {code.map((digit, index) => (
          <div
            key={index}
            className={`
              w-2 h-2 rounded-full transition-all duration-200
              ${
                digit
                  ? error
                    ? 'bg-danger'
                    : 'bg-primary'
                  : 'bg-neutral-300'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
};
