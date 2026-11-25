import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type AuthUser } from './api';
import type { Company, Profile } from './types';
import { identifyPurchaser } from './purchases';

type SessionState = {
  loading: boolean;
  user: AuthUser | null;
  profile: Profile | null;
  company: Company | null;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionState>({
  loading: true,
  user: null,
  profile: null,
  company: null,
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  const load = useCallback(async (u: AuthUser | null) => {
    setUser(u);
    if (!u) {
      setProfile(null);
      setCompany(null);
      return;
    }
    const p = await api.getMyProfile().catch(() => null);
    setProfile(p);
    setCompany(p?.role === 'employer' ? await api.getMyCompany().catch(() => null) : null);
    identifyPurchaser(u.id);
  }, []);

  const refresh = useCallback(async () => {
    await load(await api.getUser());
  }, [load]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    return api.onAuthChange((u) => {
      load(u);
    });
  }, [refresh, load]);

  return (
    <SessionContext.Provider value={{ loading, user, profile, company, refresh }}>{children}</SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
