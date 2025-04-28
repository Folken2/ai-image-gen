import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

// Create a Supabase client configured for server-side operations (Server Components, Route Handlers, Server Actions)
export function createClient() {
  const cookieStore = cookies();

  // Fetch Supabase URL and Anon Key from environment variables
  // The exclamation mark asserts that these variables are defined
  // (we throw an error if they are not, ensuring type safety)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseKey) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        // A more robust way to handle cookies using the provided store interface
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Pass the cookie operations to the underlying cookie store
          // The `try...catch` is recommended for environments where direct
          // cookie modification might fail (like Server Components during read)
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.warn(`Server Component: Failed to set cookie ${name}`, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          // Pass the cookie operations to the underlying cookie store
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.warn(`Server Component: Failed to remove cookie ${name}`, error);
          }
        },
      },
    }
  );
} 