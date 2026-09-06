import 'dotenv/config';

class ConfigError extends Error {}

function num(name, raw, fallback, { min, max, integer = false } = {}) {
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new ConfigError(`${name} must be a number. Got: ${raw}`);
  if (integer && !Number.isInteger(value)) throw new ConfigError(`${name} must be an integer. Got: ${raw}`);
  if (min !== undefined && value < min) throw new ConfigError(`${name} must be >= ${min}. Got: ${raw}`);
  if (max !== undefined && value > max) throw new ConfigError(`${name} must be <= ${max}. Got: ${raw}`);
  return value;
}

function bool(name, raw, fallback) {
  if (raw === undefined || raw === '') return fallback;
  if (['true', '1', 'yes'].includes(raw.toLowerCase())) return true;
  if (['false', '0', 'no'].includes(raw.toLowerCase())) return false;
  throw new ConfigError(`${name} must be true or false. Got: ${raw}`);
}

/**
 * Load and validate configuration.
 * @param {{requireApiKey?: boolean}} options
 */
export function loadConfig({ requireApiKey = true } = {}) {
  const env = process.env;
  const apiKey = (env.ELEVENLABS_API_KEY || '').trim();

  if (requireApiKey && !apiKey) {
    throw new ConfigError(
      'ELEVENLABS_API_KEY is missing.\n  Copy .env.example to .env and add your API key.'
    );
  }

  return {
    apiKey,
    model: env.ELEVENLABS_MODEL?.trim() || 'eleven_text_to_sound_v2',
    durationSeconds: num('SFX_DURATION_SECONDS', env.SFX_DURATION_SECONDS, 4, { min: 0.5, max: 30 }),
    promptInfluence: num('PROMPT_INFLUENCE', env.PROMPT_INFLUENCE, 0.3, { min: 0, max: 1 }),
    loop: bool('SFX_LOOP', env.SFX_LOOP, false),
    sampleRate: num('WAV_SAMPLE_RATE', env.WAV_SAMPLE_RATE, 44100, { min: 8000, max: 192000, integer: true }),
    channels: num('WAV_CHANNELS', env.WAV_CHANNELS, 1, { min: 1, max: 2, integer: true }),
    outputDir: env.OUTPUT_DIR?.trim() || './generations',
  };
}

export { ConfigError };
