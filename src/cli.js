#!/usr/bin/env node
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { rm, stat, copyFile } from 'node:fs/promises';

import { loadConfig, ConfigError } from './config.js';
import { generateSoundEffect } from './generate.js';
import { convertToLockChime, assertFfmpegAvailable } from './convert.js';
import { createGenerationDir, copyInstructions, writePromptFile } from './output.js';

const WARN_MAX_BYTES = 1024 * 1024; // 1 MB
const WARN_MAX_SECONDS = 5;

const ok = (msg) => console.log(`✓ ${msg}`);
const info = (msg) => console.log(msg);
const warn = (msg) => console.log(`⚠ ${msg}`);

function usage() {
  return `Tesla Boombox LockChime Generator

Usage:
  npm run generate                        Interactive prompt → ElevenLabs → LockChime.wav
  npm run generate -- "<prompt>"          Generate directly from a prompt
  npm run convert -- <path/to/audio.mp3>  Convert an existing file, no ElevenLabs
  npm run generate -- --help              Show this help
`;
}

async function ask(question) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) return { mode: 'help' };

  if (args[0] === 'convert' || args.includes('--input') || args.includes('-i')) {
    const rest = args[0] === 'convert' ? args.slice(1) : args;
    const flagIndex = rest.findIndex((a) => a === '--input' || a === '-i');
    const input = flagIndex >= 0 ? rest[flagIndex + 1] : rest.find((a) => !a.startsWith('-'));
    return { mode: 'convert', input };
  }

  return { mode: 'generate', prompt: args.filter((a) => !a.startsWith('-')).join(' ').trim() };
}

function reportWarnings(conversion) {
  if (conversion.bytes > WARN_MAX_BYTES) {
    warn(`LockChime.wav is ${(conversion.bytes / 1024 / 1024).toFixed(2)} MB (over 1 MB). Tesla may prefer smaller files.`);
  }
  if (conversion.durationSeconds != null && conversion.durationSeconds > WARN_MAX_SECONDS) {
    warn(`Duration is ${conversion.durationSeconds.toFixed(1)}s (over ${WARN_MAX_SECONDS}s). Lock sounds should be short.`);
  }
}

async function finish({ dir, prompt, generation, conversion, mode, sourceFile, originalName }) {
  await writePromptFile({ dir, prompt, generation, conversion, mode, sourceFile, originalName });
  ok('Prompt.md');
  await copyInstructions(dir);
  ok('INSTRUCTIONS.md');
  reportWarnings(conversion);
  info('');
  info('Created:');
  info(`${path.relative(process.cwd(), dir)}/`);
}

async function runGenerate(promptArg) {
  const config = loadConfig({ requireApiKey: true });
  await assertFfmpegAvailable();

  let prompt = promptArg;
  if (!prompt) {
    info('🎵 Tesla Boombox LockChime Generator\n');
    prompt = await ask('Describe your lock sound:\n> ');
  }
  if (!prompt) throw new ConfigError('No prompt provided.');

  info('');
  info('Generating with ElevenLabs...');

  const dir = await createGenerationDir({ outputDir: config.outputDir, label: prompt });
  try {
    const generation = await generateSoundEffect({
      prompt,
      config,
      outputPath: path.join(dir, 'Original.mp3'),
    });
    ok('Original.mp3');

    info('✓ Converting to Tesla-compatible WAV...');
    const conversion = await convertToLockChime({
      inputPath: generation.path,
      outputPath: path.join(dir, 'LockChime.wav'),
      sampleRate: config.sampleRate,
      channels: config.channels,
    });
    ok(`LockChime.wav (${(conversion.bytes / 1024).toFixed(1)} KB)`);

    await finish({ dir, prompt, generation, conversion, mode: 'elevenlabs' });
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

async function runConvert(inputArg) {
  const config = loadConfig({ requireApiKey: false });
  await assertFfmpegAvailable();

  let input = inputArg;
  if (!input) {
    info('🎵 Tesla LockChime Converter\n');
    input = await ask('Path to your audio file:\n> ');
  }
  if (!input) throw new ConfigError('No input file provided.');

  const inputPath = path.resolve(process.cwd(), input.replace(/^['"]|['"]$/g, ''));
  try {
    const { size } = await stat(inputPath);
    if (size === 0) throw new ConfigError(`Input file is empty: ${inputPath}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`Input file not found: ${inputPath}`);
  }

  const label = path.basename(inputPath, path.extname(inputPath));
  const dir = await createGenerationDir({ outputDir: config.outputDir, label });

  try {
    const originalName = `Original${path.extname(inputPath) || '.mp3'}`;
    await copyFile(inputPath, path.join(dir, originalName));
    ok(originalName);

    info('✓ Converting to Tesla-compatible WAV...');
    const conversion = await convertToLockChime({
      inputPath,
      outputPath: path.join(dir, 'LockChime.wav'),
      sampleRate: config.sampleRate,
      channels: config.channels,
    });
    ok(`LockChime.wav (${(conversion.bytes / 1024).toFixed(1)} KB)`);

    await finish({
      dir,
      prompt: null,
      generation: null,
      conversion,
      mode: 'convert-only',
      sourceFile: inputPath,
      originalName,
    });
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.mode === 'help') {
    info(usage());
    return;
  }
  if (args.mode === 'convert') return runConvert(args.input);
  return runGenerate(args.prompt);
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exitCode = 1;
});
