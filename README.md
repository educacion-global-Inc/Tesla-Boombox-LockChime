# Tesla-Boombox-LockChime

Generate a custom Tesla lock sound from a plain-English prompt — or convert an MP3 you already have — into a Tesla-ready `LockChime.wav`.

**One prompt in. One Tesla-ready sound out.**

---

## What it does

- Takes a natural-language sound-effect prompt.
- Generates audio with the ElevenLabs Sound Effects API.
- Saves the untouched provider output as `Original.mp3`.
- Converts it with FFmpeg to `LockChime.wav` (PCM 16-bit, 44.1 kHz, mono).
- Writes one self-contained generation folder with reproducibility metadata and install instructions.

**Convert-only mode:** already have an MP3/WAV/M4A? Skip ElevenLabs entirely and just convert it.

Example prompt:

```text
futuristic spaceship powering down with a tiny happy chirp
```

---

## Requirements

- **Node.js** 18.17+
- **FFmpeg** available in `PATH` (`ffmpeg -version`)
- **ElevenLabs API key** — only for generation mode. Convert-only mode needs no key.

Install FFmpeg on macOS:

```bash
brew install ffmpeg
```

---

## Installation

```bash
git clone https://github.com/<your-user>/Tesla-Boombox-LockChime.git
cd Tesla-Boombox-LockChime
npm install
cp .env.example .env
```

Add your key to `.env`:

```dotenv
ELEVENLABS_API_KEY=sk_your_key_here
```

---

## Usage

### Interactive

```bash
npm run generate
```

```text
🎵 Tesla Boombox LockChime Generator

Describe your lock sound:
> futuristic spaceship powering down with a tiny happy chirp

Generating with ElevenLabs...
✓ Original.mp3
✓ Converting to Tesla-compatible WAV...
✓ LockChime.wav (128.4 KB)
✓ Prompt.md
✓ INSTRUCTIONS.md

Created:
generations/2026-09-05_futuristic-spaceship-powering-down/
```

### Direct prompt

```bash
npm run generate -- "futuristic spaceship powering down with a tiny happy chirp"
```

### Convert only (no ElevenLabs)

```bash
npm run convert -- ./my-sound.mp3
```

Or run it interactively and it will ask for a path:

```bash
npm run convert
```

Convert-only mode does **not** require `ELEVENLABS_API_KEY`. It copies your source file into the generation folder, converts it to `LockChime.wav`, and writes the same metadata and instructions.

### Help

```bash
npm run generate -- --help
```

---

## Output structure

Every invocation creates exactly one folder:

```text
generations/
└── 2026-09-05_futuristic-spaceship-powering-down/
    ├── Prompt.md          # prompt + non-secret config used
    ├── Original.mp3       # source audio (provider output or your file)
    ├── LockChime.wav      # Tesla-ready audio
    └── INSTRUCTIONS.md    # copied from templates/INSTRUCTIONS.md
```

Folder naming: `YYYY-MM-DD_<slug>`, collision-safe (`-2`, `-3`, …).

If generation or conversion fails, the partial folder is removed — no misleading output.

---

## Configuration

All values live in `.env`. Only `ELEVENLABS_API_KEY` is required (and only for generation).

| Variable | Default | Notes |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | — | Required for generation mode |
| `ELEVENLABS_MODEL` | `eleven_text_to_sound_v2` | Sound effects model |
| `SFX_DURATION_SECONDS` | `4` | 0.5–30 |
| `PROMPT_INFLUENCE` | `0.3` | 0–1 |
| `SFX_LOOP` | `false` | |
| `WAV_SAMPLE_RATE` | `44100` | |
| `WAV_CHANNELS` | `1` | 1 = mono |
| `OUTPUT_DIR` | `./generations` | |

Config is validated at startup and fails fast with a readable message.

---

## Install on your Tesla (summary)

1. Plug the Tesla USB drive into your computer.
2. Copy `LockChime.wav` to the **root** of the drive — next to `TeslaCam`, **not inside it**.
3. Eject and reconnect the drive to the car's data-capable USB port (glovebox on most vehicles).
4. On the touchscreen: **Toybox → Boombox → Lock Sound → USB**.
5. Lock the car to test.

Full steps ship inside every generation folder as `INSTRUCTIONS.md`.

---

## Project structure

```text
src/
├── cli.js        # arg parsing, interactive prompt, workflow orchestration
├── config.js     # .env loading, defaults, validation
├── generate.js   # ElevenLabs Sound Effects call → Original.mp3
├── convert.js    # FFmpeg availability check + MP3 → LockChime.wav
└── output.js     # folder naming, Prompt.md, INSTRUCTIONS.md copy

templates/
└── INSTRUCTIONS.md

work/
├── PRD.md        # product requirements
└── STATUS.md     # current project state
```

---

## Security

- **Never commit `.env`.** It is gitignored.
- API keys are never logged and never written into `Prompt.md`.
- Only a whitelist of safe config values is serialized into metadata.
- Generated audio is gitignored by default — nothing is published from `generations/`.

---

## Troubleshooting

| Message | Fix |
| --- | --- |
| `ELEVENLABS_API_KEY is missing` | `cp .env.example .env` and add your key |
| `FFmpeg was not found` | Install FFmpeg and ensure it's in `PATH` |
| `401 Unauthorized` | Check your ElevenLabs key and account credits |
| Sound doesn't appear in the car | Confirm exact filename `LockChime.wav` at USB root, then replug the drive |

The CLI also warns (without failing) if the final WAV exceeds 1 MB or 5 seconds — Tesla lock sounds should be short one-shots.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Disclaimer

Tesla is a trademark of Tesla, Inc. This project is **not affiliated with, endorsed by, or sponsored by** Tesla, Inc. or ElevenLabs. Use at your own risk. Tesla does not publish a complete formal `LockChime.wav` encoding specification; defaults here are conservative and may need updating if Tesla changes behavior.
