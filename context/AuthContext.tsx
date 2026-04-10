"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";

interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  userType?: string | null;
  organizationId: string | null;
  onboardingCompleted: boolean;
  metadata?: any;
  [key: string]: any;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  [key: string]: any;
}

interface AuthContextType {
  profile: Profile | null;
  organization: Organization | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { isLoaded } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user and load profile
  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setOrganization(null);
      setLoading(false);
      return;
    }

    try {
      // Logic to sync user from Clerk to Prisma
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);

        // Load organization details (best-effort) so pages can render immediately.
        // This is intentionally tolerant of users without an org yet.
        try {
          const orgRes = await fetch("/api/organizations", { cache: "no-store" });
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            setOrganization(orgData.organization ?? null);
          } else {
            setOrganization(null);
          }
        } catch {
          setOrganization(null);
        }
      }
    } catch (err) {
      console.error("Profile load/sync failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      loadProfile();
    }
  }, [isLoaded, user]);

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider value={{ profile, organization, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthProfile = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthProfile must be used inside AuthProvider");
  return ctx;
};
