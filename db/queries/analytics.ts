import { supabase } from "@/db/client/supabase-browser";
import type { Database } from "@/db/types/supabase";

/**
 * Use generated types where available.
 * If you regenerate types via `npx supabase gen types ...` and those views/tables
 * are included in the generated file, you can remove the `(supabase.from as any)` casts.
 */
type AnalyticsEvent = Database["public"]["Tables"]["analytics_events"]["Row"];
type PlatformMetric = Database["public"]["Tables"]["platform_metrics"]["Row"];

// Local/temporary types for things not present in Database type
type DashboardStats = { [key: string]: any } | null;
type JobPostingEmployment = { employment_type?: string | null };

/**
 * Analytics queries / service
 */
export const analyticsQueries = {
  /** Track a user analytics event */
  async trackEvent(event: {
    profile_id?: string;
    event_type: string;
    event_data?: any;
    page_url?: string;
    referrer?: string;
    ip_address?: string;
    user_agent?: string;
    device_type?: string;
  }): Promise<void> {
    const { error } = await supabase.from("analytics_events").insert(event);
    if (error) {
      console.error("Analytics tracking error:", error);
    }
  },

  /** Get dashboard stats (materialized view). 
   *  NOTE: if `mv_dashboard_stats` is not present in your generated Database types,
   *  we use a temporary cast to avoid TypeScript overload errors. Regenerate types to remove cast.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const { data, error } = await (supabase.from as any)("mv_dashboard_stats")
      .select("*")
      .single();

    if (error) {
      console.error("Error fetching dashboard stats:", error);
      return null;
    }
    return data as DashboardStats;
  },

  /** Get recent user activity */
  async getUserActivity(profileId: string, limit = 50): Promise<AnalyticsEvent[]> {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching user activity:", error);
      return [];
    }
    return (data ?? []) as AnalyticsEvent[];
  },

  /** Get platform metrics for a specific date */
  async getPlatformMetrics(date: Date): Promise<PlatformMetric[]> {
    const day = date.toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("platform_metrics")
      .select("*")
      .eq("metric_date", day)
      .order("metric_name");

    if (error) {
      console.error("Error fetching platform metrics:", error);
      return [];
    }
    return (data ?? []) as PlatformMetric[];
  },

  /** Get the most popular published events */
  async getPopularEvents(limit = 5): Promise<any[]> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching popular events:", error);
      return [];
    }
    return data ?? [];
  },

  /**
   * Get job stats grouped by employment_type.
   * NOTE: If `job_postings` is missing from your generated Database types,
   * we use a cast to avoid overload/type errors. Regenerate types to remove cast.
   */
  async getJobStats(): Promise<{ total: number; byType: Record<string, number> }> {
    // Use cast to any for the query to avoid TypeScript overload problems when `job_postings` is missing.
    const { data, error } = await (supabase.from as any)("job_postings")
      .select("employment_type")
      .eq("is_active", true)
      .gte("expiry_date", new Date().toISOString());

    if (error) {
      console.error("Error fetching job stats:", error);
      return { total: 0, byType: {} };
    }

    const rows = (data ?? []) as JobPostingEmployment[];

    const byType = rows.reduce<Record<string, number>>((acc, job) => {
      const type = job.employment_type ?? "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return { total: rows.length, byType };
  },
};
