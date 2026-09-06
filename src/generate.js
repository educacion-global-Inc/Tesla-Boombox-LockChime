import { writeFile, stat } from 'node:fs/promises';

const ENDPOINT = 'https://api.elevenlabs.io/v1/sound-generation';

export class GenerationError extends Error {}

/**
 * Generate a sound effect with ElevenLabs and write it to disk.
 * @returns {Promise<{path: string, bytes: number, provider: string, model: string,
 *  durationSeconds: number, promptInfluence: number, loop: boolean, format: string}>}
 */
export async function generateSoundEffect({ prompt, config, outputPath }) {
  const body = {
    text: prompt,
    model_id: config.model,
    duration_seconds: config.durationSeconds,
    prompt_influence: config.promptInfluence,
    loop: config.loop,
  };

  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'xi-api-key': config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new GenerationError(`ElevenLabs request failed: ${error.message}`);
  }

  if (!response.ok) {
    let detail = '';
    try {
      detail = (await response.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    const hint = response.status === 401 ? '\n  Check ELEVENLABS_API_KEY.' : '';
    throw new GenerationError(
      `ElevenLabs generation failed: ${response.status} ${response.statusText}${detail ? `\n  ${detail}` : ''}${hint}`
    );
  }

  const audio = Buffer.from(await response.arrayBuffer());
  if (audio.length === 0) throw new GenerationError('ElevenLabs returned an empty audio response.');

  await writeFile(outputPath, audio);
  const { size } = await stat(outputPath);
  if (size === 0) throw new GenerationError('Original.mp3 was written but is empty.');

  return {
    path: outputPath,
    bytes: size,
    provider: 'ElevenLabs',
    model: config.model,
    durationSeconds: config.durationSeconds,
    promptInfluence: config.promptInfluence,
    loop: config.loop,
    format: 'MP3',
  };
}
