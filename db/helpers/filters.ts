import { Database } from '@/db/types/supabase';

// Generic filter types
export interface BaseFilter {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Profile filters
export interface ProfileFilters extends BaseFilter {
  graduationYear?: number;
  industry?: string;
  location?: string;
  skills?: string[];
  isActive?: boolean;
}

// Event filters
export interface EventFilters extends BaseFilter {
  eventType?: string[];
  status?: string[];
  startDate?: Date;
  endDate?: Date;
  locationType?: string[];
  isPublic?: boolean;
}

// Job filters
export interface JobFilters extends BaseFilter {
  employmentType?: string[];
  remotePolicy?: string[];
  location?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  company?: string;
}

// Build Supabase query from filters
export const buildFilterQuery = (query: any, filters: BaseFilter) => {
  let filteredQuery = query;

  // Search filter
  if (filters.search) {
    // This would be table-specific, so we'll handle it in individual query functions
  }

  // Sorting
  if (filters.sortBy) {
    filteredQuery = filteredQuery.order(filters.sortBy, { 
      ascending: filters.sortOrder === 'asc' 
    });
  }

  return filteredQuery;
};

// Build profile-specific filters
export const buildProfileFilters = (query: any, filters: ProfileFilters) => {
  let filteredQuery = query;

  if (filters.graduationYear) {
    filteredQuery = filteredQuery.eq('graduation_year', filters.graduationYear);
  }

  if (filters.industry) {
    filteredQuery = filteredQuery.eq('industry', filters.industry);
  }

  if (filters.location) {
    filteredQuery = filteredQuery.ilike('location', `%${filters.location}%`);
  }

  if (filters.isActive !== undefined) {
    filteredQuery = filteredQuery.eq('is_active', filters.isActive);
  }

  return filteredQuery;
};

// Build event-specific filters
export const buildEventFilters = (query: any, filters: EventFilters) => {
  let filteredQuery = query;

  if (filters.eventType?.length) {
    filteredQuery = filteredQuery.in('event_type', filters.eventType);
  }

  if (filters.status?.length) {
    filteredQuery = filteredQuery.in('status', filters.status);
  }

  if (filters.startDate) {
    filteredQuery = filteredQuery.gte('start_date', filters.startDate.toISOString());
  }

  if (filters.endDate) {
    filteredQuery = filteredQuery.lte('end_date', filters.endDate.toISOString());
  }

  if (filters.locationType?.length) {
    filteredQuery = filteredQuery.in('location_type', filters.locationType);
  }

  if (filters.isPublic !== undefined) {
    filteredQuery = filteredQuery.eq('is_public', filters.isPublic);
  }

  return filteredQuery;
};

// Build job-specific filters
export const buildJobFilters = (query: any, filters: JobFilters) => {
  let filteredQuery = query;

  if (filters.employmentType?.length) {
    filteredQuery = filteredQuery.in('employment_type', filters.employmentType);
  }

  if (filters.remotePolicy?.length) {
    filteredQuery = filteredQuery.in('remote_policy', filters.remotePolicy);
  }

  if (filters.location) {
    filteredQuery = filteredQuery.ilike('location', `%${filters.location}%`);
  }

  if (filters.company) {
    filteredQuery = filteredQuery.ilike('company', `%${filters.company}%`);
  }

  if (filters.salaryRange) {
    filteredQuery = filteredQuery.gte('salary_range_min', filters.salaryRange.min);
    filteredQuery = filteredQuery.lte('salary_range_max', filters.salaryRange.max);
  }

  return filteredQuery;
};

// Search utilities
export const createSearchFilter = (searchTerm: string, searchableFields: string[]) => {
  if (!searchTerm) return '';
  
  const conditions = searchableFields.map(field => 
    `${field}.ilike.%${searchTerm}%`
  );
  
  return conditions.join(',');
};

// Date range utilities
export const createDateRangeFilter = (startDate?: Date, endDate?: Date) => {
  const filters = [];
  
  if (startDate) {
    filters.push(`created_at.gte.${startDate.toISOString()}`);
  }
  
  if (endDate) {
    filters.push(`created_at.lte.${endDate.toISOString()}`);
  }
  
  return filters.join(',');
};