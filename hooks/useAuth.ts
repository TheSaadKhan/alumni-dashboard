import { useMemo } from "react";
import { useClerk } from "@clerk/nextjs";
import { useAuthProfile } from "@/context/AuthContext";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  session: null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { profile, loading, refreshProfile } = useAuthProfile();
  const { signOut } = useClerk();

  const user = useMemo<AuthUser | null>(
    () =>
      profile
        ? {
            id: profile.id,
            email: profile.email,
            user_metadata: profile.metadata ?? {},
          }
        : null,
    [profile]
  );

  return {
    user,
    session: null,
    profile,
    loading,
    signOut: async () => signOut(),
    refreshProfile,
  };
};
