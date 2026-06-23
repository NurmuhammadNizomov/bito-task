import { useCallback } from 'react';
import { useAuthStore } from '../stores/auth';
import { loginUser, logoutUser } from '../api/auth';

export function useAuth() {
  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser({ email, password });
    setUser(result.user, result.accessToken);
    return result.user;
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      clearUser();
    }
  }, [clearUser]);

  return { user, isAuthenticated, login, logout };
}
