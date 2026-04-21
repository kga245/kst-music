import { put } from "@vercel/blob";
import Replicate from "replicate";

import { logGeneration } from "./log";
import type {
  GenerationFailure,
  GenerationInput,
  GenerationResult,
} from "./types";

const REPLICATE_MODEL = "meta/musicgen" as const;
const DEFAULT_VARIANT = "stereo-melody-large";

// Replicate musicgen runs ~2x realtime on their GPU tier.
// ~$0.0055/sec of GPU time (source: Replicate per-second billing for
// A40 / L40s). Rough sticker price for the dashboard, not an invoice.
const COST_PER_SECOND_USD = 0.0055;
const GPU_TIME_MULTIPLIER = 2;

export async function generateMusic(
  input: GenerationInput,
): Promise<GenerationResult> {
  const startedAt = Date.now();
  const variant = process.env.MUSICGEN_VARIANT?.trim() || DEFAULT_VARIANT;
  const modelId = `${REPLICATE_MODEL} (${variant})`;

  const replicateToken = process.env.REPLICATE_API_TOKEN?.trim();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (!replicateToken) {
    return finish(input, modelId, {
      ok: false,
      stage: "config",
      message: "REPLICATE_API_TOKEN is not set.",
      latencyMs: 0,
    });
  }
  if (!blobToken) {
    return finish(input, modelId, {
      ok: false,
      stage: "config",
      message: "BLOB_READ_WRITE_TOKEN is not set.",
      latencyMs: 0,
    });
  }

  const replicate = new Replicate({
    auth: replicateToken,
    useFileOutput: false,
  });

  let providerOutputUrl: string;
  try {
    const output = await replicate.run(REPLICATE_MODEL, {
      input: {
        prompt: input.prompt,
        duration: input.durationSeconds,
        model_version: variant,
        output_format: "mp3",
        normalization_strategy: "loudness",
      },
      wait: { mode: "block", timeout: 120 },
    });
    providerOutputUrl = extractFirstUrl(output);
  } catch (err) {
    return finish(input, modelId, {
      ok: false,
      stage: "provider",
      message: messageFrom(err),
      latencyMs: Date.now() - startedAt,
    });
  }

  let audioBytes: ArrayBuffer;
  try {
    const res = await fetch(providerOutputUrl);
    if (!res.ok) {
      throw new Error(`Provider output returned HTTP ${res.status}.`);
    }
    audioBytes = await res.arrayBuffer();
  } catch (err) {
    return finish(input, modelId, {
      ok: false,
      stage: "download",
      message: messageFrom(err),
      latencyMs: Date.now() - startedAt,
    });
  }

  let blob: { url: string; downloadUrl: string };
  try {
    const pathname = `music/${Date.now()}-${randomSlug()}.mp3`;
    const uploaded = await put(pathname, audioBytes, {
      access: "public",
      contentType: "audio/mpeg",
      token: blobToken,
      addRandomSuffix: false,
    });
    blob = { url: uploaded.url, downloadUrl: uploaded.downloadUrl };
  } catch (err) {
    return finish(input, modelId, {
      ok: false,
      stage: "upload",
      message: messageFrom(err),
      latencyMs: Date.now() - startedAt,
    });
  }

  const latencyMs = Date.now() - startedAt;
  const estCostCents = Math.ceil(
    input.durationSeconds * COST_PER_SECOND_USD * GPU_TIME_MULTIPLIER * 100,
  );

  return finish(input, modelId, {
    ok: true,
    blobUrl: blob.url,
    downloadUrl: blob.downloadUrl,
    provider: "replicate",
    model: modelId,
    durationSeconds: input.durationSeconds,
    latencyMs,
    estCostCents,
    promptPreview: input.prompt,
  });
}

function finish(
  input: GenerationInput,
  modelId: string,
  result: GenerationResult,
): GenerationResult {
  logGeneration(
    {
      prompt: input.prompt,
      durationSeconds: input.durationSeconds,
      model: modelId,
    },
    result,
  );
  return result;
}

function extractFirstUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  throw new Error(
    `Unexpected provider output shape: ${
      typeof output === "object" ? JSON.stringify(output) : String(output)
    }`,
  );
}

function messageFrom(err: unknown): string {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : JSON.stringify(err);
}

function randomSlug(): string {
  return Math.random().toString(36).slice(2, 10);
}

export type { GenerationFailure };
