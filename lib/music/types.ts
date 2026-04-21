export type GenerationInput = {
  prompt: string;
  durationSeconds: number;
};

export type GenerationSuccess = {
  ok: true;
  blobUrl: string;
  downloadUrl: string;
  provider: "replicate";
  model: string;
  durationSeconds: number;
  latencyMs: number;
  estCostCents: number;
  promptPreview: string;
};

export type GenerationFailure = {
  ok: false;
  stage: "config" | "provider" | "download" | "upload" | "unknown";
  message: string;
  latencyMs: number;
};

export type GenerationResult = GenerationSuccess | GenerationFailure;
