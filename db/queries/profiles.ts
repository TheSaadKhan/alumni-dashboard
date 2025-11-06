import { supabase } from "@/db/client/supabase-browser";
import type { Database } from "@/db/types/supabase";

/**
 * ✅ Type-safe mappings from your Supabase schema
 */
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

/**
 * 🔹 Centralized profile query methods
 * All functions return typed data or throw typed errors
 */
export const profileQueries = {
  /** 🔹 Get profile by database ID */
  async getProfileById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /** 🔹 Get profile by auth user ID */
  async getProfileByAuthUserId(authUserId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUserId)
      .single();

    if (error) throw error;
    return data;
  },

  /** 🔹 Create a new profile */
  async createProfile(profile: ProfileInsert): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** 🔹 Update an existing profile */
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

  /** 🔹 Search profiles with optional filters */
  async searchProfiles(
    query: string,
    filters?: {
      graduationYear?: number;
      industry?: string;
      location?: string;
      degree?: string;
    }
  ): Promise<Profile[]> {
    let queryBuilder = supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true);

    // 🔍 Text search
    if (query) {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${query}%,headline.ilike.%${query}%,bio.ilike.%${query}%,degree.ilike.%${query}%`
      );
    }

    // 🎓 Graduation year filter
    if (filters?.graduationYear) {
      queryBuilder = queryBuilder.eq("graduation_year", filters.graduationYear);
    }

    // 🏢 Industry filter (assuming industry is stored inside metadata JSON)
    if (filters?.industry) {
      queryBuilder = queryBuilder.ilike(
        "metadata->>industry",
        `%${filters.industry}%`
      );
    }

    // 📍 Location filter
    if (filters?.location) {
      queryBuilder = queryBuilder.ilike("location", `%${filters.location}%`);
    }

    // 🎓 Degree filter
    if (filters?.degree) {
      queryBuilder = queryBuilder.ilike("degree", `%${filters.degree}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return data ?? [];
  },

  /** 🔹 Get alumni by graduation year */
  async getAlumniByGraduationYear(year: number): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("graduation_year", year)
      .eq("is_active", true);

    if (error) throw error;
    return data ?? [];
  },
};

export default profileQueries;
