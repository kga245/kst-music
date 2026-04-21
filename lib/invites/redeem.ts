import { getServiceSupabase } from "@/lib/supabase/server";
import { isInviteCodeLike, normalizeInviteCode } from "./code";

export type RedeemResult =
  | { ok: true; codeId: string; usesRemaining: number }
  | { ok: false; reason: "invalid_format" | "not_found_or_exhausted" | "error"; message?: string };

export async function redeemInviteCode(
  rawCode: string,
  context?: Record<string, unknown>,
): Promise<RedeemResult> {
  const code = normalizeInviteCode(rawCode);
  if (!isInviteCodeLike(code)) {
    return { ok: false, reason: "invalid_format" };
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.rpc("redeem_invite_code", {
    p_code: code,
    p_context: context ?? null,
  });

  if (error) {
    return { ok: false, reason: "error", message: error.message };
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { ok: false, reason: "not_found_or_exhausted" };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    codeId: row.code_id as string,
    usesRemaining: row.uses_remaining as number,
  };
}
