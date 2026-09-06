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
