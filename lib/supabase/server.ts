import { createServerClient } from "@supabase/ssr";

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return undefined;
        },
        getAll() {
          return [];
        },
        set(name: string, value: string, options: any) {
          // No-op in API routes
        },
        setAll(cookies: any[]) {
          // No-op in API routes
        },
        remove(name: string, options: any) {
          // No-op in API routes
        },
      },
    }
  );
}
