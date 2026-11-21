import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export interface LoginState {
  returnUrl?: string;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) {
    const state: LoginState = { returnUrl: location.pathname };
    return <Navigate to="/login" state={state} replace />;
  }
  return children;
}
