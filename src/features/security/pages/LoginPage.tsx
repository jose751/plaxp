import React from 'react';
import { LoginCard } from '../components/LoginCard';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-neutral-100 flex justify-center items-center p-4 md:p-8">
      <LoginCard />
    </div>
  );
};
