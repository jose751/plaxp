import React from 'react';
import { ResetPasswordCard } from '../components/ResetPasswordCard';

export const ResetPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-neutral-100 flex justify-center items-center p-4 md:p-8">
      <ResetPasswordCard />
    </div>
  );
};
