'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  nickname: string;
  ageRange: string;
  gender: string;
  interest: string;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoggedIn: false,
  loading: true,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <UserContext.Provider value={{ user, isLoggedIn: !!user, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
