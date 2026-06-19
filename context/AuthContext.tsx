"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { sessionGet, sessionSet } from "@/lib/cache";

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

  const loadProfile = useCallback(async (useCache = true) => {
    if (!user) {
      setProfile(null);
      setOrganization(null);
      setLoading(false);
      return;
    }

    if (useCache) {
      const cachedProfile = sessionGet<Profile>("auth_profile");
      const cachedOrg = sessionGet<Organization>("auth_org");
      if (cachedProfile) {
        setProfile(cachedProfile);
        if (cachedOrg) setOrganization(cachedOrg);
        setLoading(false);
      }
    }

    try {
      const [syncRes, orgRes] = await Promise.all([
        fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          }),
        }),
        fetch("/api/organizations", { cache: "no-store" }),
      ]);

      if (syncRes.ok) {
        const data = await syncRes.json();
        setProfile(data.profile);
        sessionSet("auth_profile", data.profile, 3 * 60 * 1000);
      }

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        let org: Organization | null = null;
        if (orgData.organizations && Array.isArray(orgData.organizations)) {
          org = orgData.organizations[0] ?? null;
        } else {
          org = orgData.organization ?? null;
        }
        setOrganization(org);
        if (org) sessionSet("auth_org", org, 3 * 60 * 1000);
      }
    } catch (err) {
      console.error("Profile load/sync failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded) {
      loadProfile();
    }
  }, [isLoaded, loadProfile]);

  const refreshProfile = async () => {
    setLoading(true);
    await loadProfile(false);
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
