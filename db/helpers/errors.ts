// Custom error classes for database operations
export class DatabaseError extends Error {
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, code: string = 'DATABASE_ERROR', details?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends DatabaseError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(message, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

// Error mapping from Supabase errors to custom errors
export const mapSupabaseError = (error: any): DatabaseError => {
  if (!error) {
    return new DatabaseError('Unknown database error');
  }

  const { code, message, details } = error;

  switch (code) {
    case '23505': // Unique violation
      return new ConflictError('Resource already exists', details);
    
    case '23503': // Foreign key violation
      return new ValidationError('Referenced resource does not exist', details);
    
    case '23502': // Not null violation
      return new ValidationError('Required field is missing', details);
    
    case '42501': // Insufficient privilege
      return new UnauthorizedError('Insufficient permissions');
    
    case 'PGRST116': // Resource not found (PostgREST)
      return new NotFoundError('Resource');
    
    default:
      return new DatabaseError(message || 'Database operation failed', code, details);
  }
};

// Error handler utility
export const handleDatabaseError = (error: any): never => {
  if (error instanceof DatabaseError) {
    throw error;
  }
  
  const mappedError = mapSupabaseError(error);
  throw mappedError;
};

// Safe database operation wrapper
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  customErrorMessage?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    
    const mappedError = mapSupabaseError(error);
    
    if (customErrorMessage) {
      throw new DatabaseError(customErrorMessage, mappedError.code, mappedError.details);
    }
    
    throw mappedError;
  }
};

// Validation utilities
export const validateRequiredFields = (data: any, requiredFields: string[]): void => {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validatePaginationParams = (page: number, pageSize: number): void => {
  if (page < 1) {
    throw new ValidationError('Page must be greater than 0');
  }
  
  if (pageSize < 1 || pageSize > 100) {
    throw new ValidationError('Page size must be between 1 and 100');
  }
};