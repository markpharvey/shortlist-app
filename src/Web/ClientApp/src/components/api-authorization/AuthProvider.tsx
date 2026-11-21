import { useEffect, useState, type ReactNode } from 'react';
import { UsersClient, LoginRequest, RegisterRequest } from '../../web-api-client';
import { AuthContext } from './AuthContext';

const client = new UsersClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    client.infoGET()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await client.login(true, undefined, new LoginRequest({ email, password }));
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string) => {
    await client.register(new RegisterRequest({ email, password }));
  };

  const logout = async () => {
    await client.logout({});
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
