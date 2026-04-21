"use server";

import { z } from "zod";

import { generateMusic } from "@/lib/music/generate";
import type { GenerationResult } from "@/lib/music/types";

const schema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, "Prompt must be at least 3 characters.")
    .max(500, "Prompt must be 500 characters or fewer."),
  durationSeconds: z.coerce
    .number()
    .int("Duration must be a whole number of seconds.")
    .min(5, "Duration must be at least 5 seconds.")
    .max(30, "Duration must be at most 30 seconds."),
});

export type GenerateFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fields?: Partial<Record<"prompt" | "durationSeconds", string>> }
  | { status: "success"; result: Extract<GenerationResult, { ok: true }> };

export async function generateMusicAction(
  _prev: GenerateFormState,
  formData: FormData,
): Promise<GenerateFormState> {
  const parsed = schema.safeParse({
    prompt: formData.get("prompt"),
    durationSeconds: formData.get("durationSeconds"),
  });

  if (!parsed.success) {
    const fields: Partial<Record<"prompt" | "durationSeconds", string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "prompt" || key === "durationSeconds") {
        fields[key] ??= issue.message;
      }
    }
    return {
      status: "error",
      message: "Fix the highlighted fields.",
      fields,
    };
  }

  const result = await generateMusic(parsed.data);

  if (!result.ok) {
    return {
      status: "error",
      message: configStageMessage(result.stage, result.message),
    };
  }

  return { status: "success", result };
}

function configStageMessage(stage: string, original: string): string {
  if (stage === "config") {
    return `Server not configured: ${original} Ask the platform owner to provision the required environment variable.`;
  }
  if (stage === "provider") {
    return `Model provider error: ${original}`;
  }
  if (stage === "download") {
    return `Could not download generated audio: ${original}`;
  }
  if (stage === "upload") {
    return `Could not store generated audio: ${original}`;
  }
  return original;
}
