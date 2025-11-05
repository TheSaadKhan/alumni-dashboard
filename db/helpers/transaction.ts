import { supabaseAdmin } from '../client/supabase-server';

// Supabase doesn't support multi-statement transactions over the REST SQL API easily.
// If using pg client or Edge runtime, implement transactions there.
// Placeholder wrapper for consistent API.
export async function withTransaction(fn: Function) {
  // Implement transaction pattern if using a direct pg client.
  return await fn();
}
