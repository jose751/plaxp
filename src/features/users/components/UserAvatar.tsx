import React, { useState } from 'react';

interface UserAvatarProps {
  nombre: string;
  pathFoto?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

// Colores de fondo para las iniciales (basados en la primera letra)
const bgColors = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
];

const getColorFromName = (nombre: string): string => {
  const firstChar = nombre.charAt(0).toUpperCase();
  const charCode = firstChar.charCodeAt(0);
  const index = charCode % bgColors.length;
  return bgColors[index];
};

const getInitial = (nombre: string): string => {
  return nombre.charAt(0).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  nombre,
  pathFoto,
  size = 'md',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold overflow-hidden flex-shrink-0`;
  const bgColor = getColorFromName(nombre);

  // Si hay foto y no ha fallado
  if (pathFoto && !hasError) {
    return (
      <div className={`${baseClasses} ${className} relative bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800`}>
        {/* Shimmer effect mientras carga */}
        {isLoading && (
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        )}
        <img
          src={pathFoto}
          alt={nombre}
          className={`w-full h-full object-cover transition-all duration-300 ${isLoading ? 'scale-105 blur-sm opacity-0' : 'scale-100 blur-0 opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>
    );
  }

  // Avatar con inicial (fallback o sin foto)
  return (
    <div className={`${baseClasses} ${bgColor} text-white shadow-sm ${className}`}>
      {getInitial(nombre)}
    </div>
  );
};

export default UserAvatar;
