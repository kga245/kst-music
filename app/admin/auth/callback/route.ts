import { NextResponse } from "next/server";

import { getSupabaseSSRClient, isAdminEmail } from "@/lib/admin/auth";

// Supabase auth magic-link redirect lands here with a `code` query param.
// Exchange it for a session, then route to /admin on success.
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login", url));
  }

  const supabase = await getSupabaseSSRClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !isAdminEmail(data?.user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", url));
  }

  return NextResponse.redirect(new URL(next, url));
}
