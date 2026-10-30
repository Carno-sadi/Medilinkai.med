/**
 * MediLink AI — Groq API Key Pool with rotation and health tracking.
 *
 * Powers ultra-fast Flash mode using openai/gpt-oss-120b on Groq LPU.
 * Manages multiple Groq keys to distribute load and automatically cool down
 * rate-limited keys (429) or temporary server errors (5xx).
 */

export interface GroqKeyConfig {
  key: string;
  label: string;
  inFlight: number;
  isHealthy: boolean;
  cooldownUntil: number;
  consecutiveFailures: number;
}

const COOLDOWN_MS = 60_000;
const MAX_CONSECUTIVE_FAILURES = 3;

let groqPool: GroqKeyConfig[] = [];
let initialized = false;

function createGroqKeyConfig(key: string, label: string): GroqKeyConfig {
  return {
    key,
    label,
    inFlight: 0,
    isHealthy: true,
    cooldownUntil: 0,
    consecutiveFailures: 0,
  };
}

export function initializeGroqPool(keys: string[]): void {
  if (initialized && groqPool.length > 0) return;

  groqPool = keys
    .filter((k): k is string => !!k && k.trim().length > 0)
    .map((key, index) => createGroqKeyConfig(key.trim(), `groq-key-${index + 1}`));

  if (groqPool.length === 0) {
    const single = process.env.GROQ_API_KEY;
    if (single && single.trim()) {
      groqPool = [createGroqKeyConfig(single.trim(), "groq-key-default")];
    } else {
      console.warn("[MediLink] No Groq API keys configured. Set GROQ_API_KEY_1..3 in environment.");
    }
  } else {
    console.log(`[MediLink] Initialized Groq API key pool with ${groqPool.length} key(s)`);
  }

  initialized = true;
}

export async function selectHealthyGroqKey(): Promise<GroqKeyConfig | null> {
  if (!initialized || groqPool.length === 0) {
    const envKeys = [
      process.env.GROQ_API_KEY_1,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
    ].filter(Boolean) as string[];
    initializeGroqPool(envKeys);
  }

  const now = Date.now();
  const available = groqPool
    .filter((k) => (k.isHealthy || k.cooldownUntil <= now))
    .sort((a, b) => a.inFlight - b.inFlight);

  const selected = available[0] ?? null;
  if (selected) {
    if (selected.cooldownUntil <= now && !selected.isHealthy) {
      selected.isHealthy = true;
      selected.consecutiveFailures = 0;
    }
    selected.inFlight++;
  }
  return selected;
}

export function releaseGroqKey(keyConfig: GroqKeyConfig | null): void {
  if (keyConfig) {
    keyConfig.inFlight = Math.max(0, keyConfig.inFlight - 1);
  }
}

export function markGroqKeySuccess(keyConfig: GroqKeyConfig): void {
  keyConfig.inFlight = Math.max(0, keyConfig.inFlight - 1);
  keyConfig.consecutiveFailures = 0;
  keyConfig.isHealthy = true;
  keyConfig.cooldownUntil = 0;
}

export function markGroqKeyFailed(keyConfig: GroqKeyConfig, status: number): void {
  keyConfig.inFlight = Math.max(0, keyConfig.inFlight - 1);
  keyConfig.consecutiveFailures++;

  if (status === 429) {
    keyConfig.cooldownUntil = Date.now() + COOLDOWN_MS;
    keyConfig.isHealthy = false;
    console.warn(`[MediLink] Groq Key ${keyConfig.label} rate limited. Cooling down for ${COOLDOWN_MS / 1000}s`);
  } else if (status === 401 || status === 403) {
    keyConfig.isHealthy = false;
    keyConfig.cooldownUntil = Date.now() + 300_000;
    console.warn(`[MediLink] Groq Key ${keyConfig.label} auth error (${status}). Cooling down for 300s.`);
  } else if (status >= 500) {
    keyConfig.cooldownUntil = Date.now() + 30_000;
    console.warn(`[MediLink] Groq Key ${keyConfig.label} server error (${status}). Short cooldown.`);
  }

  if (keyConfig.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    keyConfig.isHealthy = false;
    keyConfig.cooldownUntil = Date.now() + 300_000;
    console.error(`[MediLink] Groq Key ${keyConfig.label} marked unhealthy after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
  }
}
