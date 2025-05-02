import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Fetch the Supabase URL and Service Role Key from environment variables.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// IMPORTANT: Use the Service Role Key here! Ensure it's set in your .env.local or environment.
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if the environment variables are set.
if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined in environment variables. Please set NEXT_PUBLIC_SUPABASE_URL.")
}
if (!supabaseServiceRoleKey) {
  throw new Error("Supabase Service Role Key is not defined in environment variables. Please set SUPABASE_SERVICE_ROLE_KEY.")
}

// Create and export the Supabase server client instance, typed with the Database schema.
// This instance should ONLY be used in server-side code (API routes, server components with Route Handlers, etc.).
// It bypasses RLS by default.
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Recommended options for server-side clients
    autoRefreshToken: false,
    persistSession: false
  }
}) 