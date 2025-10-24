import { useState } from 'react';

/**
 * Hook para manejar el formulario de login
 * Listo para integrar con la API real
 */
export const useAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Integrar con API de login
    console.log('Formulario enviado:', { email, password });
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    handleLogin,
  };
};
