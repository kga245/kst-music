"use client";

import { useActionState } from "react";

import {
  generateMusicAction,
  type GenerateFormState,
} from "./actions";

const initialState: GenerateFormState = { status: "idle" };

export default function GeneratePage() {
  const [state, formAction, pending] = useActionState(
    generateMusicAction,
    initialState,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-8 font-mono">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Generate a clip
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Prompt → audio via Replicate <code>meta/musicgen</code>. Internal
          alpha. Expect 20–40s per request.
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-neutral-500">
            Prompt
          </span>
          <textarea
            name="prompt"
            required
            minLength={3}
            maxLength={500}
            rows={4}
            defaultValue={lastPrompt(state) ?? ""}
            placeholder="lofi jazz guitar, mellow drums, dusty vinyl"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
            disabled={pending}
          />
          {fieldError(state, "prompt") && (
            <span className="text-xs text-red-600" aria-live="polite">
              {fieldError(state, "prompt")}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-neutral-500">
            Duration (seconds)
          </span>
          <input
            name="durationSeconds"
            type="number"
            min={5}
            max={30}
            step={1}
            defaultValue={lastDuration(state) ?? 15}
            required
            className="w-32 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
            disabled={pending}
          />
          {fieldError(state, "durationSeconds") && (
            <span className="text-xs text-red-600" aria-live="polite">
              {fieldError(state, "durationSeconds")}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Generating…" : "Generate"}
        </button>
      </form>

      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          <p className="font-semibold">Generation failed</p>
          <p className="mt-1 whitespace-pre-wrap">{state.message}</p>
        </div>
      )}

      {state.status === "success" && (
        <ResultPanel result={state.result} />
      )}
    </main>
  );
}

function ResultPanel({
  result,
}: {
  result: Extract<GenerateFormState, { status: "success" }>["result"];
}) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
      <audio
        controls
        src={result.blobUrl}
        className="w-full"
        preload="metadata"
      />
      <a
        href={result.downloadUrl}
        className="w-fit text-sm underline underline-offset-2"
      >
        Download mp3
      </a>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
        <dt>Model</dt>
        <dd className="font-mono">{result.model}</dd>
        <dt>Requested duration</dt>
        <dd>{result.durationSeconds}s</dd>
        <dt>Latency</dt>
        <dd>{(result.latencyMs / 1000).toFixed(1)}s</dd>
        <dt>Est. cost</dt>
        <dd>${(result.estCostCents / 100).toFixed(2)}</dd>
      </dl>
    </section>
  );
}

function fieldError(
  state: GenerateFormState,
  field: "prompt" | "durationSeconds",
): string | undefined {
  return state.status === "error" ? state.fields?.[field] : undefined;
}

function lastPrompt(state: GenerateFormState): string | undefined {
  return state.status === "success" ? state.result.promptPreview : undefined;
}

function lastDuration(state: GenerateFormState): number | undefined {
  return state.status === "success" ? state.result.durationSeconds : undefined;
}
