# Tesla-Boombox-LockChime — Product Requirements Document

**Status:** v0.1 Draft  
**Owner:** Educación Global  
**Repository:** Public  
**Runtime:** Node.js CLI  
**Primary provider:** ElevenLabs Sound Effects API

## 1. Product Summary

Tesla-Boombox-LockChime is a small open-source Node.js CLI that generates custom Tesla lock sounds from natural-language prompts using ElevenLabs, saves the original MP3, converts it to a Tesla-ready `LockChime.wav`, and creates a self-contained generation folder with reproducibility metadata and installation instructions.

The project should optimize for simplicity: one prompt in, one generation folder out.

## 2. Goals

- Generate a sound effect from a short natural-language prompt.
- Use ElevenLabs Sound Effects API.
- Save the original provider output as `Original.mp3`.
- Convert the result to `LockChime.wav` using FFmpeg.
- Produce one folder per generation.
- Record the prompt and non-secret generation/conversion configuration.
- Copy installation instructions into every generation folder.
- Keep API keys and secrets out of generated metadata and Git history.
- Make the repository easy to clone, configure, and run locally.

## 3. Non-Goals — v0.1

- Web UI or Express server.
- User accounts or authentication.
- Cloud storage.
- Generation history database.
- Multiple variants per invocation.
- Audio editor or waveform UI.
- Automatic USB discovery/copying.
- Tesla API integration.
- Packaging as a desktop app.
- Hosting generated audio in the public repository.

## 4. User Story

As a Tesla owner, I want to describe a custom lock sound in plain English, have the tool generate and convert it automatically, and receive a ready-to-copy `LockChime.wav` with clear installation instructions.

## 5. Primary UX

### Interactive

```bash
npm install
cp .env.example .env
npm run generate
```

Example:

```text
🎵 Tesla Boombox LockChime Generator

Describe your lock sound:
> futuristic spaceship powering down with a tiny happy chirp

Generating with ElevenLabs...
✓ Original.mp3
✓ Converting to Tesla-compatible WAV...
✓ LockChime.wav
✓ Prompt.md
✓ INSTRUCTIONS.md

Created:
generations/2026-09-05_futuristic-spaceship-powering-down/
```

### Direct prompt

The same CLI should optionally accept a prompt argument:

```bash
npm run generate -- "futuristic spaceship powering down with a tiny happy chirp"
```

If no prompt argument is provided, the CLI enters interactive mode.

## 6. Output Structure

Each invocation creates exactly one generation directory:

```text
generations/
└── 2026-09-05_futuristic-spaceship-powering-down/
    ├── Prompt.md
    ├── Original.mp3
    ├── LockChime.wav
    └── INSTRUCTIONS.md
```

### Folder naming

Format:

```text
YYYY-MM-DD_<prompt-slug>
```

Rules:

- Lowercase slug.
- Replace whitespace with hyphens.
- Remove unsafe filesystem characters.
- Keep the slug reasonably short.
- If the folder already exists, append `-2`, `-3`, etc.

## 7. Files

### `Original.mp3`

The unmodified audio returned by ElevenLabs.

### `LockChime.wav`

The FFmpeg-converted Tesla lock sound.

Target conversion defaults:

- Container: WAV
- Codec: PCM signed 16-bit little-endian (`pcm_s16le`)
- Sample rate: 44.1 kHz
- Channels: mono
- Filename: exactly `LockChime.wav`

The CLI must validate the final file exists and report its size.

### `Prompt.md`

Contains enough non-secret metadata to understand and reproduce the generation.

Example:

```markdown
# LockChime Generation

## Prompt

Futuristic spaceship powering down with a tiny happy chirp.

## Generation

- Generated: 2026-09-05T22:03:41-06:00
- Provider: ElevenLabs
- Model: eleven_text_to_sound_v2
- Duration: 4 seconds
- Prompt Influence: 0.3
- Loop: false
- Original Format: MP3

## Conversion

- Output: LockChime.wav
- Codec: PCM 16-bit
- Sample Rate: 44.1 kHz
- Channels: Mono

## Files

- `Original.mp3` — Original ElevenLabs generation
- `LockChime.wav` — Tesla-ready converted audio
- `INSTRUCTIONS.md` — Tesla installation instructions
```

Hard rule: `Prompt.md` must never include the ElevenLabs API key or dump the complete `.env` file.

### `INSTRUCTIONS.md`

This is a static template stored at:

```text
templates/INSTRUCTIONS.md
```

The file is copied unchanged into every generated directory.

Initial content:

```markdown
# Install Your Tesla LockChime

## Step 1: Plug the Tesla USB into your computer

Remove the Tesla USB drive from the glovebox and plug it into your computer.

## Step 2: Copy `LockChime.wav`

Open the USB drive.

If you use this drive for Dashcam/Sentry, you will normally see a `TeslaCam` folder.

Do **not** put `LockChime.wav` inside `TeslaCam`.

Copy `LockChime.wav` to the USB drive's root directory, next to `TeslaCam`.

Example:

```text
TESLA_USB/
├── TeslaCam/
└── LockChime.wav
```

## Step 3: Reconnect the USB drive

Safely eject the USB drive from your computer and reconnect it to the Tesla's data-capable USB port.

On newer Model Y vehicles, the glovebox USB port is the normal data port used for Dashcam/Sentry storage.

## Step 4: Enable the custom lock sound

On the Tesla touchscreen:

1. Open the app launcher.
2. Open **Toybox**.
3. Select **Boombox**.
4. Find **Lock Sound**.
5. Select **USB**.

Lock the vehicle to test the sound.

## Troubleshooting

- Confirm the file is named exactly `LockChime.wav`.
- Confirm it is a real WAV file, not an MP3 renamed to `.wav`.
- Confirm the USB drive is connected to a data-capable USB port.
- Confirm the vehicle supports Boombox/custom lock sounds.
- If the sound does not appear, unplug and reconnect the USB drive and try again.
```

> Note: Tesla's official Boombox documentation confirms supported USB/audio behavior but does not currently publish a detailed `LockChime.wav` specification. The project should keep the installation template easy to update if Tesla changes behavior.

## 8. Configuration

`.env.example`:

```dotenv
ELEVENLABS_API_KEY=

# ElevenLabs Sound Effects
ELEVENLABS_MODEL=eleven_text_to_sound_v2
SFX_DURATION_SECONDS=4
PROMPT_INFLUENCE=0.3
SFX_LOOP=false

# WAV conversion
WAV_SAMPLE_RATE=44100
WAV_CHANNELS=1

# Output
OUTPUT_DIR=./generations
```

### Config behavior

- `ELEVENLABS_API_KEY` is required.
- All other values have defaults.
- Configuration must be parsed and validated on startup.
- Fail fast with a human-readable error if required configuration is missing or invalid.
- Only a whitelist of safe values may be written into `Prompt.md`.

## 9. ElevenLabs Integration

Use the ElevenLabs Sound Effects API.

Current API endpoint:

```text
POST /v1/sound-generation
```

Relevant request values:

- `text`
- `duration_seconds`
- `prompt_influence`
- `model_id`
- `loop`

Default model:

```text
eleven_text_to_sound_v2
```

The current ElevenLabs API supports sound-effect durations up to 30 seconds and `prompt_influence` values from 0 to 1. The v0.1 default should remain short because a Tesla lock sound is intended to be a brief one-shot effect.

The API response should be streamed or written directly to:

```text
Original.mp3
```

The API key must be passed securely and never logged.

## 10. FFmpeg Conversion

FFmpeg is an external runtime dependency.

At startup or before conversion, verify availability with:

```bash
ffmpeg -version
```

If unavailable, stop with a clear message explaining that FFmpeg must be installed.

Conceptual conversion:

```bash
ffmpeg \
  -i Original.mp3 \
  -ac 1 \
  -ar 44100 \
  -c:a pcm_s16le \
  LockChime.wav
```

The Node process should invoke FFmpeg directly rather than shell-interpolating arbitrary user input.

## 11. Validation

Before reporting success, verify:

1. ElevenLabs returned audio.
2. `Original.mp3` exists and is non-empty.
3. FFmpeg exited successfully.
4. `LockChime.wav` exists and is non-empty.
5. `Prompt.md` exists.
6. `INSTRUCTIONS.md` exists.

### Recommended Tesla-oriented validation

Warn if:

- final WAV is larger than 1 MB;
- generated duration is longer than 5 seconds.

These should initially be warnings rather than hard failures because Tesla does not publish a complete formal LockChime encoding specification in its current owner documentation.

## 12. Error Handling

Errors should be concise and actionable.

Examples:

```text
✗ ELEVENLABS_API_KEY is missing.
  Copy .env.example to .env and add your API key.
```

```text
✗ FFmpeg was not found.
  Install FFmpeg and ensure `ffmpeg` is available in PATH.
```

```text
✗ ElevenLabs generation failed: 401 Unauthorized
  Check ELEVENLABS_API_KEY.
```

If generation fails, do not create a misleading completed folder. A partially created folder may be removed automatically or clearly marked incomplete.

## 13. Suggested Repository Structure

```text
Tesla-Boombox-LockChime/
├── README.md
├── PRD.md
├── LICENSE
├── package.json
├── package-lock.json
├── .gitignore
├── .env.example
│
├── src/
│   ├── cli.js
│   ├── config.js
│   ├── generate.js
│   ├── convert.js
│   └── output.js
│
├── templates/
│   └── INSTRUCTIONS.md
│
└── generations/
    └── .gitkeep
```

## 14. Module Responsibilities

### `src/cli.js`

- Parse direct prompt argument.
- Fall back to interactive prompt.
- Coordinate the generation workflow.
- Display progress and final paths.

### `src/config.js`

- Load `.env`.
- Apply defaults.
- Validate values.
- Return a typed/normalized config object.

### `src/generate.js`

- Call ElevenLabs.
- Save response to `Original.mp3`.
- Return provider metadata needed by `Prompt.md`.

### `src/convert.js`

- Verify FFmpeg exists.
- Convert MP3 to WAV.
- Return output metadata/file size.

### `src/output.js`

- Create generation directory.
- Sanitize prompt slug.
- Write `Prompt.md`.
- Copy `INSTRUCTIONS.md`.
- Manage collision-safe folder naming.

## 15. Security & Public Repo Requirements

`.gitignore` must include at minimum:

```gitignore
.env
node_modules/
generations/*
!generations/.gitkeep
```

Requirements:

- Never commit `.env`.
- Never log API keys.
- Never serialize all environment variables.
- Never include secrets in `Prompt.md`.
- Do not commit generated MP3/WAV files by default.
- Provide `.env.example` containing names and safe defaults only.

## 16. Dependencies

Keep dependencies minimal.

Suggested:

- `@elevenlabs/elevenlabs-js` or the current official ElevenLabs JavaScript SDK
- `dotenv`
- a small interactive prompt library if needed

External:

- FFmpeg

Prefer built-in Node APIs for filesystem, subprocesses, paths, and argument handling.

## 17. README Requirements

README should contain:

- What the project does.
- Example prompt.
- Requirements: Node.js, FFmpeg, ElevenLabs API key.
- Installation.
- `.env` setup.
- Interactive usage.
- Direct-prompt usage.
- Example output structure.
- Tesla installation summary.
- Security warning about API keys.
- Disclaimer that Tesla is a trademark of Tesla, Inc. and the project is not affiliated with or endorsed by Tesla or ElevenLabs.

## 18. Acceptance Criteria — v0.1

v0.1 is complete when a fresh user can:

1. Clone the public repository.
2. Run `npm install`.
3. Create `.env` from `.env.example`.
4. Add an ElevenLabs API key.
5. Run `npm run generate`.
6. Enter a natural-language SFX prompt.
7. Receive one new generation directory.
8. Find a valid `Original.mp3` inside it.
9. Find a converted `LockChime.wav` inside it.
10. Find a `Prompt.md` containing the prompt and non-secret config used.
11. Find a copied `INSTRUCTIONS.md`.
12. Copy the generated `LockChime.wav` to a Tesla USB drive and follow the included instructions.

## 19. Future Ideas — Explicitly Out of v0.1

Possible later iterations:

- `--duration` and `--influence` CLI overrides.
- Multiple variants per prompt.
- Audio preview from CLI.
- Automatic normalization/fade-out.
- Automatic trim to Tesla-safe duration/file size.
- USB drive detection and one-command installation.
- Local mini web UI.
- Prompt presets/gallery.
- Shareable generation manifests.

Do not build these until the basic prompt → MP3 → WAV → generation-folder workflow is stable.

## 20. Product Principle

**One prompt in. One Tesla-ready sound out.**

The repository should remain understandable in minutes, runnable in one command, and small enough that a contributor can trace the entire generation pipeline without learning a framework.
