"use client";

import { useActionState } from "react";

import { issueCodesAction, type IssueCodesState } from "../actions";

const initial: IssueCodesState = { status: "idle" };

export function IssueCodesCard() {
  const [state, formAction, pending] = useActionState(
    issueCodesAction,
    initial,
  );

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/40">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
        Issue invite codes
      </h2>

      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-neutral-500">
            Count
          </span>
          <input
            name="count"
            type="number"
            min={1}
            max={50}
            defaultValue={10}
            required
            className="w-24 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-neutral-500">
            Uses per code
          </span>
          <input
            name="usesAllowed"
            type="number"
            min={1}
            max={1000}
            defaultValue={10}
            required
            className="w-24 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-neutral-500">
            Note (optional)
          </span>
          <input
            name="note"
            type="text"
            maxLength={200}
            placeholder="batch-1 producers"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-md bg-neutral-900 px-4 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Issuing…" : "Issue codes"}
        </button>
      </form>

      {state.status === "error" && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}

      {state.status === "success" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            Issued {state.codes.length} code{state.codes.length === 1 ? "" : "s"}. Copy them now; the full
            list also appears in the table below.
          </p>
          <pre className="max-h-64 overflow-auto rounded-md bg-neutral-900 p-3 text-xs text-neutral-100 dark:bg-black">
{state.codes
              .map((c) => `${c.code}  ·  ${c.usesAllowed} uses${c.note ? `  ·  ${c.note}` : ""}`)
              .join("\n")}
          </pre>
        </div>
      )}
    </section>
  );
}
