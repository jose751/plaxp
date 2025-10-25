import React from 'react';
import { VerifyCodeCard } from '../components/VerifyCodeCard';

export const VerifyCodePage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-neutral-100 flex justify-center items-center p-4 md:p-8">
      <VerifyCodeCard />
    </div>
  );
};
