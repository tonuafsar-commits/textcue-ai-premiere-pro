# TextCue AI

TextCue AI is a Premiere Pro UXP panel MVP for finding spoken moments that probably need on-screen text. It parses a timestamped transcript, detects cue-worthy lines, checks the active timeline for existing text-like clips, and lets an editor create text, add review markers, ignore cues, undo generated text from the current session, apply one captured text style to every generated text layer, and sync edited cue text back into generated layers.

Stable latest all-in-one download:

https://github.com/tonuafsar-commits/textcue-ai-premiere-pro/releases/latest/download/TextCue-AI-All-In-One.zip

## Project Structure

```text
textcue-ai/
  manifest.json
  index.html
  styles.css
  src/
    main.js
    premiere.js
    transcriptParser.js
    detector.js
    textGenerator.js
    timelineScanner.js
    reportExporter.js
    settings.js
  examples/
    example-transcript.txt
  KNOWN_LIMITATIONS.md
```

## Install For Development

1. Install Adobe UXP Developer Tool.
2. Open Premiere Pro 25.6 or newer.
3. In UXP Developer Tool, click **Add Plugin**.
4. Select `textcue-ai/manifest.json`.
5. Click **Load**.
6. In Premiere Pro, open **Window > UXP Plugins > TextCue AI**.

If the manifest changes, unload and reload the plugin in UXP Developer Tool.

## Usage

1. Open a Premiere Pro project and activate the sequence you want to check.
2. Open the TextCue AI panel.
3. Paste a transcript or click **Import Transcript** and choose a `.txt`, `.srt`, or `.vtt` file.
4. Use transcript lines like:

```text
00:12 - At number 5, we have the TORVO TD3 Dash Cam.
00:27 - It records in 4K with night vision.
00:39 - The price is around $49.
00:52 - Make sure your car supports wired CarPlay first.
```

5. Click **Analyze Transcript**.
6. Review the detected cues. Edit suggested text directly in the result list when needed.
7. Use per-cue actions: **Jump**, **Create Text**, **Add Marker**, or **Ignore**.
8. Use global actions when ready:
   - **Auto Create All Text** creates all pending/review cues.
   - **Add Markers Only** adds review markers without creating text.
   - **Capture Selected Text Style** reads the style from one selected generated text layer.
   - **Apply Style To All Generated Text** applies that captured style to every text layer generated in the current session.
   - **Sync Edited Text To Layers** pushes changed suggested text back into already-generated text layers.

Generated text uses a bright magenta default background (`#ff00cc`) so editors can spot AI-generated layers quickly before applying a final house style.
   - **Undo Generated Text** attempts to remove text created in the current panel session.

## Detection Modes

- **Minimal**: product names, ranking, prices, warnings, compatibility.
- **Balanced**: Minimal plus main specs and tutorial steps. This is the default.
- **Heavy**: Balanced plus pros/cons and broader important claims.

## Categories

- Ranking/product intro
- Product name
- Price
- Specs
- Warning
- Tutorial step
- Important claim
- Pros/cons
- Compatibility note

## Marker Names

TextCue AI uses marker names like:

```text
⚠ ADD TEXT | #5 TORVO TD3 Dash Cam
⚠ ADD TEXT | Around $49
⚠ ADD TEXT | 4K Recording + Night Vision
✅ TEXT ADDED | #5 TORVO TD3 Dash Cam
```

## Premiere API Wiring Notes

The panel logic is complete and modular, but a few host operations are intentionally isolated in `src/premiere.js` with TODO comments:

- Creating text/graphic layers.
- Setting marker metadata and colors.
- Jumping the playhead.
- Removing generated text during undo.

Adobe's current Premiere UXP documentation confirms manifest v5 panel entrypoints and Premiere DOM access with `require("premierepro")`, but some text/graphic creation methods differ by installed Premiere version. Keep API-specific changes inside `src/premiere.js` so the UI, parser, detector, report exporter, and settings remain stable.

## Future Roadmap

- Add local Whisper transcription.
- Add AI-powered summarization for cleaner cue text.
- Add MOGRT template support.
- Add animated text presets.
- Add batch processing for multiple sequences.
- Add YouTube chapter/title integration.
- Add brand preset saving.
