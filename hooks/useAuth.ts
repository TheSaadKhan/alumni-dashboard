import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/db/client/supabase-browser';
import { profileQueries } from '@/db/helpers/queries/profiles';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: any;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const mapSupabaseUser = (user: User | null): AuthUser | null =>
  user
    ? {
        id: user.id,
        email: user.email ?? '',
        user_metadata: user.user_metadata,
      }
    : null;

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(mapSupabaseUser(session?.user ?? null));

      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(mapSupabaseUser(currentSession?.user ?? null));

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const userProfile = await profileQueries.getProfileByAuthUserId(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    refreshProfile,
  };
};
