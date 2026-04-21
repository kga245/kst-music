import { getServiceSupabase } from "@/lib/supabase/server";
import { generateInviteCode } from "./code";

export type IssuedInviteCode = {
  id: string;
  code: string;
  usesAllowed: number;
  usesRemaining: number;
  note: string | null;
  createdAt: string;
};

export async function issueInviteCodes(options: {
  count: number;
  usesAllowed?: number;
  note?: string | null;
  createdBy?: string | null;
}): Promise<IssuedInviteCode[]> {
  const count = Math.max(1, Math.min(100, Math.floor(options.count)));
  const usesAllowed = Math.max(1, Math.min(1000, options.usesAllowed ?? 10));
  const note = options.note?.trim() || null;
  const createdBy = options.createdBy?.trim() || null;

  const supabase = getServiceSupabase();
  const issued: IssuedInviteCode[] = [];
  const attempted = new Set<string>();

  // Insert one-by-one so a collision on the unique `code` column doesn't
  // kill the whole batch. 64 bits of entropy collides almost never at this
  // scale, but we retry per-row just in case.
  while (issued.length < count) {
    let code = generateInviteCode();
    let attempts = 0;
    while (attempted.has(code) && attempts < 5) {
      code = generateInviteCode();
      attempts += 1;
    }
    attempted.add(code);

    const { data, error } = await supabase
      .from("invite_codes")
      .insert({
        code,
        uses_allowed: usesAllowed,
        uses_remaining: usesAllowed,
        note,
        created_by: createdBy,
      })
      .select("id, code, uses_allowed, uses_remaining, note, created_at")
      .single();

    if (error) {
      if (error.code === "23505") continue;
      throw new Error(`Failed to issue invite code: ${error.message}`);
    }

    issued.push({
      id: data.id,
      code: data.code,
      usesAllowed: data.uses_allowed,
      usesRemaining: data.uses_remaining,
      note: data.note,
      createdAt: data.created_at,
    });
  }

  return issued;
}
