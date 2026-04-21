import type { GenerationResult } from "./types";

type LogPayload = {
  event: "music.generate";
  provider: string;
  model: string;
  promptPreview: string;
  durationSeconds: number;
  latencyMs: number;
  ok: boolean;
  stage?: string;
  estCostCents?: number;
  blobUrl?: string;
  error?: string;
};

export function logGeneration(
  input: { prompt: string; durationSeconds: number; model: string },
  result: GenerationResult,
): void {
  const payload: LogPayload = {
    event: "music.generate",
    provider: result.ok ? result.provider : "replicate",
    model: input.model,
    promptPreview: previewPrompt(input.prompt),
    durationSeconds: input.durationSeconds,
    latencyMs: result.latencyMs,
    ok: result.ok,
  };

  if (result.ok) {
    payload.estCostCents = result.estCostCents;
    payload.blobUrl = result.blobUrl;
  } else {
    payload.stage = result.stage;
    payload.error = result.message;
  }

  console.log(JSON.stringify(payload));
}

export function previewPrompt(prompt: string): string {
  const trimmed = prompt.replace(/\s+/g, " ").trim();
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
}
