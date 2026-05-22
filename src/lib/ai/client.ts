import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';

let client: Anthropic | null = null;
let cachedKey: string | null = null;

/**
 * Reads ANTHROPIC_API_KEY from process.env if present and non-empty,
 * otherwise falls back to reading .env.local from the project root.
 *
 * This handles a common case where a parent shell exports the variable
 * as an empty string, which Next.js treats as "already set" and refuses
 * to overwrite from .env.local.
 */
function loadApiKey(): string {
  if (cachedKey) return cachedKey;

  const fromEnv = process.env.ANTHROPIC_API_KEY?.trim();
  if (fromEnv) {
    cachedKey = fromEnv;
    return cachedKey;
  }

  const envPath = path.join(process.cwd(), '.env.local');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      const key = line.slice(0, eq).trim();
      if (key !== 'ANTHROPIC_API_KEY') continue;
      const value = line.slice(eq + 1).trim();
      if (value) {
        cachedKey = value;
        return cachedKey;
      }
    }
  } catch {
    // Fall through to error below.
  }

  throw new Error(
    'ANTHROPIC_API_KEY is not set. Add it to .env.local in the project root.'
  );
}

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: loadApiKey(),
    });
  }
  return client;
}
