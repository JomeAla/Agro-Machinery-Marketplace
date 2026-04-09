'use client';

import { useNavigationStart } from '@/app/hooks/useNavigationStart';

export default function Template({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useNavigationStart();

  return (
    <>
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-dark-100 overflow-hidden">
          <div className="h-full bg-accent animate-progress" />
        </div>
      )}
      {children}
    </>
  );
}