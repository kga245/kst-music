"use server";

import { z } from "zod";

import { getServiceSupabase } from "@/lib/supabase/server";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Enter a valid email.")
    .max(254, "Email is too long.")
    .email("Enter a valid email."),
  source: z.string().trim().max(64).optional(),
});

export type WaitlistState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; alreadyJoined: boolean };

export async function joinWaitlistAction(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid email.",
    };
  }

  let supabase;
  try {
    supabase = getServiceSupabase();
  } catch (err) {
    return {
      status: "error",
      message:
        err instanceof Error
          ? err.message
          : "Waitlist is not configured on the server.",
    };
  }

  const emailLower = parsed.data.email.toLowerCase();

  // Insert; if the email already exists (unique on email_lower) we treat
  // it as an idempotent success so a user double-submitting doesn't see
  // an error.
  const { error } = await supabase
    .from("waitlist_signups")
    .insert({
      email: parsed.data.email,
      source: parsed.data.source ?? "landing",
    });

  if (error) {
    const alreadyJoined = error.code === "23505";
    if (alreadyJoined) {
      return { status: "success", alreadyJoined: true };
    }
    console.error(
      JSON.stringify({
        event: "waitlist.insert_failed",
        emailLower,
        code: error.code,
        message: error.message,
      }),
    );
    return {
      status: "error",
      message: "Could not save your signup. Try again in a minute.",
    };
  }

  console.log(
    JSON.stringify({
      event: "waitlist.joined",
      emailLower,
      source: parsed.data.source ?? "landing",
    }),
  );
  return { status: "success", alreadyJoined: false };
}
