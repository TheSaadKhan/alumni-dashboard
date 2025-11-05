import { supabase } from '@/db/client/supabase-browser';
import { Database } from '@/db/types/supabase';

type Job = Database['public']['Tables']['jobs']['Row'];
type JobApplication = Database['public']['Tables']['job_applications']['Row'];

export const jobQueries = {
  /**
   * Get all active (open) job listings
   */
  async getActiveJobs(limit = 20): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Search jobs with filters
   */
  async searchJobs(query: string, filters?: {
    employmentType?: string[];
    location?: string;
    tags?: string[];
  }): Promise<Job[]> {
    let queryBuilder = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open');

    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,company_name.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    if (filters?.employmentType?.length) {
      queryBuilder = queryBuilder.in('employment_type', filters.employmentType);
    }

    if (filters?.location) {
      queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`);
    }

    if (filters?.tags?.length) {
      queryBuilder = queryBuilder.contains('tags', filters.tags);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Submit a job application
   */
  async applyForJob(application: {
    job_id: string;
    applicant_id: string;
    cover_letter?: string;
    resume_url?: string;
  }): Promise<JobApplication> {
    const { data, error } = await supabase
      .from('job_applications')
      .insert(application)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all job applications submitted by a specific user
   */
  async getUserApplications(applicantId: string): Promise<JobApplication[]> {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job:job_id (*)
      `)
      .eq('applicant_id', applicantId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
};
