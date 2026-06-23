import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { refreshTokenApi } from '../api/auth';

// Module-scoped so React StrictMode's double-invoked effect (and any remount)
// reuses ONE in-flight bootstrap. Refresh tokens are single-use/rotated on the
// server, so firing /auth/refresh twice with the same cookie deletes the session
// on the first call and 401s the second — which would log the user straight out.
let bootstrapPromise: ReturnType<typeof refreshTokenApi> | null = null;

export function useRefreshToken() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    let cancelled = false;
    if (!bootstrapPromise) {
      bootstrapPromise = refreshTokenApi();
    }
    bootstrapPromise
      .then((result) => { if (!cancelled) setUser(result.user, result.accessToken); })
      .catch(() => { if (!cancelled) clearUser(); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
