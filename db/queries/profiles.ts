import { supabase } from "@/db/client/supabase-browser";
import type { Database } from "@/db/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const profileQueries = {
  /* -------------------------------------------------------
     GET PROFILE BY INTERNAL PROFILE TABLE ID
  ------------------------------------------------------- */
  async getProfileById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      // If no row — safe, return null
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data;
  },

  /* -------------------------------------------------------
     GET PROFILE BY AUTH USER ID (Clerk userId)
  ------------------------------------------------------- */
  async getProfileByAuthUserId(authUserId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle(); // prevents throw on 0 rows

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data;
  },

  /* -------------------------------------------------------
     CREATE PROFILE (used when no profile exists yet)
  ------------------------------------------------------- */
  async createProfile(payload: ProfileInsert): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /* -------------------------------------------------------
     UPDATE PROFILE
  ------------------------------------------------------- */
  async updateProfile(id: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export default profileQueries;
