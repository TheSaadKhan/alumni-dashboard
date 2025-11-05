"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/db/client/supabase-browser";
import { profileQueries } from "@/db/queries/profiles";
import type { User as SupabaseUser } from "@supabase/auth-js";

// 🧩 Internal user type (safe app-facing shape)
interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

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
  skills: any | null;
  metadata: any;
  is_active: boolean | null;
  is_verified: boolean | null;
  tenant_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// 🔹 Context type
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Helper: safely convert Supabase user → App user
  const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email ?? "", // fallback for undefined
    user_metadata: {
      full_name: supabaseUser.user_metadata?.full_name,
      avatar_url: supabaseUser.user_metadata?.avatar_url,
    },
  });

  const clearError = () => setError(null);

  // 🔹 Load user profile
  const loadProfile = async (userId: string) => {
    try {
      const userProfile = await profileQueries.getProfileByAuthUserId(userId);
      setProfile(userProfile);
      setError(null);
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfile(null);
      setError("Failed to load profile data");
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const supabaseUser = data.session?.user ?? null;
        if (supabaseUser) {
          const appUser = mapSupabaseUserToAppUser(supabaseUser);
          setUser(appUser);
          await loadProfile(appUser.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        setError("Failed to initialize authentication");
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 🔹 Auth state change listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const supabaseUser = session?.user ?? null;

        if (supabaseUser) {
          const appUser = mapSupabaseUserToAppUser(supabaseUser);
          setUser(appUser);
          await loadProfile(appUser.id);
        } else {
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔹 Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setProfile(null);
      setUser(null);
      setError(null);
    } catch (error: any) {
      console.error("Error signing out:", error);
      setError(error.message || "Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Manually refresh profile
  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// ✅ Custom hook for easy access
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
