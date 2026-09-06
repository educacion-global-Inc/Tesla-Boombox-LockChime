import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stat } from 'node:fs/promises';

const run = promisify(execFile);

export class ConversionError extends Error {}

export async function assertFfmpegAvailable() {
  try {
    await run('ffmpeg', ['-version']);
  } catch {
    throw new ConversionError(
      'FFmpeg was not found.\n  Install FFmpeg and ensure `ffmpeg` is available in PATH.'
    );
  }
}

/** Probe audio duration in seconds. Returns null if ffprobe is unavailable. */
export async function probeDurationSeconds(filePath) {
  try {
    const { stdout } = await run('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const value = Number(stdout.trim());
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Convert any input audio file into a Tesla-ready WAV.
 * @returns {Promise<{path: string, bytes: number, sampleRate: number, channels: number, codec: string, durationSeconds: number|null}>}
 */
export async function convertToLockChime({ inputPath, outputPath, sampleRate = 44100, channels = 1 }) {
  await assertFfmpegAvailable();

  try {
    await run('ffmpeg', [
      '-hide_banner',
      '-loglevel', 'error',
      '-y',
      '-i', inputPath,
      '-ac', String(channels),
      '-ar', String(sampleRate),
      '-c:a', 'pcm_s16le',
      outputPath,
    ]);
  } catch (error) {
    throw new ConversionError(`FFmpeg conversion failed.\n  ${(error.stderr || error.message).trim()}`);
  }

  let size;
  try {
    ({ size } = await stat(outputPath));
  } catch {
    throw new ConversionError('FFmpeg finished but LockChime.wav was not created.');
  }
  if (size === 0) throw new ConversionError('LockChime.wav was created but is empty.');

  return {
    path: outputPath,
    bytes: size,
    sampleRate,
    channels,
    codec: 'pcm_s16le',
    durationSeconds: await probeDurationSeconds(outputPath),
  };
}
