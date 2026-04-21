"use client";

import { useActionState } from "react";

import {
  joinWaitlistAction,
  type WaitlistState,
} from "@/lib/waitlist/actions";

const initial: WaitlistState = { status: "idle" };

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(
    joinWaitlistAction,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="source" value="landing" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@studio.fm"
          disabled={pending || state.status === "success"}
          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={pending || state.status === "success"}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {pending
            ? "Saving…"
            : state.status === "success"
              ? "Joined"
              : "Join waitlist"}
        </button>
      </div>

      {state.status === "error" && (
        <p
          role="alert"
          aria-live="polite"
          className="text-xs text-red-600 dark:text-red-400"
        >
          {state.message}
        </p>
      )}

      {state.status === "success" && (
        <p
          aria-live="polite"
          className="text-xs text-neutral-600 dark:text-neutral-300"
        >
          {state.alreadyJoined
            ? "You're already on the list. We'll be in touch."
            : "You're in. We'll send invite codes as we seat the alpha."}
        </p>
      )}
    </form>
  );
}
