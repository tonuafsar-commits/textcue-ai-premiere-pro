# Functional Status

TextCue AI is packaged as a Premiere Pro UXP extension MVP.

## Implemented

- Premiere UXP manifest v5 panel scaffold.
- Manual transcript paste.
- Timestamp parsing for `MM:SS - text`, `HH:MM:SS - text`, bracketed timestamps, and seconds.
- Rule-based cue detection for ranking/product intro, product names, prices, specs, warnings, tutorial steps, claims, pros/cons, and compatibility notes.
- Suggested on-screen text generation.
- Text Mode, Content Type, Style Preset, duplicate-avoidance, marker-after-text, duration, and vertical safe-zone settings.
- Result list with timestamp, spoken line, suggested text, category, confidence, status, edit field, and actions.
- Session tracking for generated text IDs.
- Captured-style workflow for applying one edited text layer style to all generated text layers in the current session.
- Optional bright magenta generated-text background so editors can quickly identify TextCue AI output; disabled by default.
- Edited cue text sync workflow for pushing changed suggested text into already-generated text layers.
- Premiere adapter that checks for active sequence and isolates host-specific timeline actions.
- In-panel GitHub release update check for direct-distribution users.

## Needs Premiere-Version API Wiring

The following actions are prepared in `src/premiere.js`, but may require final method-name adjustments against the exact Premiere Pro UXP TypeScript definitions installed with the target Premiere version:

- Creating real Essential Graphics/text layers.
- Adding sequence markers and setting marker metadata/colors.
- Jumping the playhead.
- Removing generated text layers for undo.

This separation is intentional: parser, detector, UI, report export, settings, and packaging should remain stable while host DOM calls are adjusted in one file.
