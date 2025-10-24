import React from 'react';
import { PasswordRecoveryCard } from '../components/PasswordRecoveryCard';

export const PasswordRecoveryPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-neutral-100 flex justify-center items-center p-4 md:p-8">
      <PasswordRecoveryCard />
    </div>
  );
};
