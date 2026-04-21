import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim() || "kga245@gmail.com";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export async function getSupabaseSSRClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(items: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of items) {
            cookieStore.set({ name, value, ...options });
          }
        } catch {
          // In read-only contexts (server components), cookie writes are a no-op.
          // The middleware / route handler path will re-issue them when needed.
        }
      },
    },
  });
}

export async function getAuthedAdminEmail(): Promise<string | null> {
  try {
    const supabase = await getSupabaseSSRClient();
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email ?? null;
    return isAdminEmail(email) ? email : null;
  } catch {
    return null;
  }
}
