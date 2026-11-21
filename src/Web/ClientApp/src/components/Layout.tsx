import type { ReactNode } from 'react';
import { NavMenu } from './NavMenu';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <NavMenu />
      <main>{children}</main>
    </>
  );
}
