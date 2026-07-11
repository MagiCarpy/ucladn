import React from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({ children, className }) {
  return (
    <main className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
      {children}
    </main>
  );
}
