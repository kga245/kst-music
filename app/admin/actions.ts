"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAuthedAdminEmail, getSupabaseSSRClient, isAdminEmail } from "@/lib/admin/auth";
import { issueInviteCodes } from "@/lib/invites/issue";
import { getServiceSupabase } from "@/lib/supabase/server";

const issueSchema = z.object({
  count: z.coerce.number().int().min(1).max(50),
  usesAllowed: z.coerce.number().int().min(1).max(1000).default(10),
  note: z.string().trim().max(200).optional(),
});

export type IssueCodesState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      codes: Array<{
        code: string;
        usesAllowed: number;
        note: string | null;
      }>;
    };

export async function issueCodesAction(
  _prev: IssueCodesState,
  formData: FormData,
): Promise<IssueCodesState> {
  const adminEmail = await getAuthedAdminEmail();
  if (!adminEmail) {
    return { status: "error", message: "Not signed in as an admin." };
  }

  const parsed = issueSchema.safeParse({
    count: formData.get("count"),
    usesAllowed: formData.get("usesAllowed"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const codes = await issueInviteCodes({
      count: parsed.data.count,
      usesAllowed: parsed.data.usesAllowed,
      note: parsed.data.note ?? null,
      createdBy: adminEmail,
    });
    revalidatePath("/admin");
    return {
      status: "success",
      codes: codes.map((c) => ({
        code: c.code,
        usesAllowed: c.usesAllowed,
        note: c.note,
      })),
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Could not issue codes.",
    };
  }
}

const magicLinkSchema = z.object({
  email: z.string().trim().email().max(254),
});

export type MagicLinkState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; email: string };

export async function sendMagicLinkAction(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email." };
  }

  if (!isAdminEmail(parsed.data.email)) {
    // Intentionally don't leak that the email isn't on the allowlist — but
    // don't send a real magic link either. Return the same shape.
    return { status: "sent", email: parsed.data.email };
  }

  const supabase = await getSupabaseSSRClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: origin ? `${origin}/admin/auth/callback` : undefined,
    },
  });
  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "sent", email: parsed.data.email };
}

export async function signOutAdminAction(): Promise<void> {
  const supabase = await getSupabaseSSRClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function fetchAdminOverview(): Promise<{
  signups: Array<{ email: string; source: string | null; createdAt: string }>;
  recentCodes: Array<{
    code: string;
    usesAllowed: number;
    usesRemaining: number;
    note: string | null;
    createdAt: string;
  }>;
  totals: { signups: number; codes: number; redemptions: number };
}> {
  const supabase = getServiceSupabase();

  const [{ data: signups }, { data: codes }, { count: redemptions }] =
    await Promise.all([
      supabase
        .from("waitlist_signups")
        .select("email, source, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("invite_codes")
        .select("code, uses_allowed, uses_remaining, note, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("invite_redemptions")
        .select("id", { count: "exact", head: true }),
    ]);

  const { count: signupTotal } = await supabase
    .from("waitlist_signups")
    .select("id", { count: "exact", head: true });

  const { count: codeTotal } = await supabase
    .from("invite_codes")
    .select("id", { count: "exact", head: true });

  return {
    signups: (signups ?? []).map((row) => ({
      email: row.email,
      source: row.source,
      createdAt: row.created_at,
    })),
    recentCodes: (codes ?? []).map((row) => ({
      code: row.code,
      usesAllowed: row.uses_allowed,
      usesRemaining: row.uses_remaining,
      note: row.note,
      createdAt: row.created_at,
    })),
    totals: {
      signups: signupTotal ?? 0,
      codes: codeTotal ?? 0,
      redemptions: redemptions ?? 0,
    },
  };
}
