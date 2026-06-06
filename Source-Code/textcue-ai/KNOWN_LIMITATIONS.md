# Known Limitations

- Manual transcript paste/import is the MVP path. Automatic speech-to-text is not included yet.
- `src/premiere.js` contains TODOs for text-layer creation, marker creation, playhead jumping, and undo removal because those Premiere Pro UXP APIs are version-sensitive.
- Duplicate detection uses best-effort timeline scanning for text, graphic, caption, MOGRT, and Essential Graphics clips. It may miss custom templates if Premiere exposes them with unexpected clip metadata.
- Undo only tracks text layer IDs created during the current panel session.
- Marker color names are represented as color indexes; confirm indexes against the installed Premiere Pro UXP TypeScript definitions.
- Detection is rule-based. It is intentionally conservative and does not call an AI model yet.
