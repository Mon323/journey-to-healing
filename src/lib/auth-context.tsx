import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, onLocalChange, profiles, type Profile, type User } from "./api";

type AuthCtx = {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => void;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    const u = auth.getUser();
    setUser(u);
    setProfile(u ? profiles.get(u.id) : null);
    setIsAdmin(u ? auth.isAdmin(u.id) : false);
  };

  useEffect(() => {
    refresh();
    setLoading(false);
    const off = onLocalChange(refresh);
    return off;
  }, []);

  const signOut = () => {
    auth.signOut();
    window.location.href = "/";
  };

  return (
    <Ctx.Provider value={{ user, profile, isAdmin, loading, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
