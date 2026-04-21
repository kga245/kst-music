"use client";

import { useActionState } from "react";

import { sendMagicLinkAction, type MagicLinkState } from "../actions";

const initial: MagicLinkState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    sendMagicLinkAction,
    initial,
  );

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900/40">
        <p>
          If <strong>{state.email}</strong> is on the admin allowlist, we just
          sent a magic link. Check your inbox.
        </p>
        <p className="text-xs text-neutral-500">
          Non-allowlisted emails will never receive a link. This page never
          reveals which.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-neutral-500">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "Sending…" : "Send magic link"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
    </form>
  );
}
