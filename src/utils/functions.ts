import { DEFAULT_MAX_REPLACEMENTS } from "../config/config";

export function parseMaxReplacements(value: string | null): number {
  if (!value) {
    return DEFAULT_MAX_REPLACEMENTS;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error("maxReplacements must be a non-negative integer");
  }

  return parsed;
}
