import { mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_INSTRUCTIONS = path.resolve(__dirname, '../templates/INSTRUCTIONS.md');

/** Turn a prompt into a short, filesystem-safe slug. */
export function slugify(text, maxLength = 48) {
  const slug = String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug || 'lockchime';
}

function todayStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

/** Create a collision-safe generation directory: YYYY-MM-DD_<slug>[-2]. */
export async function createGenerationDir({ outputDir, label }) {
  const base = `${todayStamp()}_${slugify(label)}`;
  const root = path.resolve(process.cwd(), outputDir);
  await mkdir(root, { recursive: true });

  let candidate = path.join(root, base);
  let counter = 2;
  while (await exists(candidate)) {
    candidate = path.join(root, `${base}-${counter++}`);
  }
  await mkdir(candidate, { recursive: true });
  return candidate;
}

export async function copyInstructions(dir) {
  const target = path.join(dir, 'INSTRUCTIONS.md');
  await copyFile(TEMPLATE_INSTRUCTIONS, target);
  return target;
}

/**
 * Write Prompt.md. Only whitelisted, non-secret values are serialized.
 */
export async function writePromptFile({
  dir,
  prompt,
  generation,
  conversion,
  mode,
  sourceFile,
  originalName = 'Original.mp3',
}) {
  const lines = ['# LockChime Generation', '', '## Prompt', ''];
  lines.push(prompt || '_(none — converted from an existing audio file)_', '');

  lines.push('## Generation', '');
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Mode: ${mode}`);
  if (generation) {
    lines.push(`- Provider: ${generation.provider}`);
    lines.push(`- Model: ${generation.model}`);
    lines.push(`- Duration: ${generation.durationSeconds} seconds`);
    lines.push(`- Prompt Influence: ${generation.promptInfluence}`);
    lines.push(`- Loop: ${generation.loop}`);
    lines.push(`- Original Format: ${generation.format}`);
  } else {
    lines.push('- Provider: none (local file)');
    lines.push(`- Source File: ${sourceFile ? path.basename(sourceFile) : 'unknown'}`);
  }
  lines.push('');

  lines.push('## Conversion', '');
  lines.push('- Output: LockChime.wav');
  lines.push('- Codec: PCM 16-bit');
  lines.push(`- Sample Rate: ${conversion.sampleRate} Hz`);
  lines.push(`- Channels: ${conversion.channels === 1 ? 'Mono' : 'Stereo'}`);
  lines.push(`- Size: ${(conversion.bytes / 1024).toFixed(1)} KB`);
  if (conversion.durationSeconds != null) {
    lines.push(`- Measured Duration: ${conversion.durationSeconds.toFixed(2)}s`);
  }
  lines.push('');

  lines.push('## Files', '');
  lines.push(`- \`${originalName}\` — Source audio`);
  lines.push('- `LockChime.wav` — Tesla-ready converted audio');
  lines.push('- `INSTRUCTIONS.md` — Tesla installation instructions');
  lines.push('');

  const target = path.join(dir, 'Prompt.md');
  await writeFile(target, lines.join('\n'), 'utf8');
  return target;
}
