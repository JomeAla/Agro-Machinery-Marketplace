'use client';

import { Suspense } from 'react';
import NavbarContent from './NavbarContent';

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarContent>{children}</NavbarContent>
    </>
  );
}