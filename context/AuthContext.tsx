"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { profileQueries } from "@/db/queries/profiles";

interface Profile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  graduation_year: number | null;
  headline: string | null;
  location: string | null;
  skills: any;
  metadata: any;
  tenant_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  degree: string | null; // ✔ FIX: Add degree from DB
  user_type?: string | null;
}

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { isLoaded } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load or auto-create profile
  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const existing = await profileQueries.getProfileByAuthUserId(user.id);

      if (existing) {
        setProfile(existing);
        return;
      }

      // CREATE profile on first login
      const created = await profileQueries.createProfile({
        auth_user_id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        full_name: user.fullName ?? null,
        avatar_url: user.imageUrl ?? null,
        metadata: {},
        skills: [],
      });

      setProfile(created);
    } catch (err) {
      console.error("Profile load/create failed", err);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      loadProfile().finally(() => setLoading(false));
    }
  }, [isLoaded, user]);

  const refreshProfile = async () => {
    if (!user) return;
    const updated = await profileQueries.getProfileByAuthUserId(user.id);
    setProfile(updated);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthProfile = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthProfile must be used inside AuthProvider");
  return ctx;
};
