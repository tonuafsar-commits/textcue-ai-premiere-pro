TextCue AI Premiere Pro Packages
================================

Use the Windows folder on Windows:
- Run TextCueAIInstaller.exe.
- Or double-click TextCue-AI-Premiere-Windows.ccx.

Use the macOS folder on macOS:
- Right-click "Install TextCue AI.command" and choose Open.
- Or double-click TextCue-AI-Premiere-macOS.ccx.

Use Direct-Download-Packages for sharing:
- TextCue-AI-All-In-One.zip
- TextCue-AI-Windows-Installer-Package.zip
- TextCue-AI-macOS-Installer-Package.zip
- TextCue-AI-Source-Code.zip

Stable latest all-in-one download link:
https://github.com/tonuafsar-commits/textcue-ai-premiere-pro/releases/latest/download/TextCue-AI-All-In-One.zip

Update notifications:
The panel checks the latest GitHub release when it opens. If a newer release exists, it shows an update bar with a download link. Creative Cloud automatic update notifications require Adobe Marketplace distribution.

Text style sync workflow:
1. Auto-create text layers.
2. Edit one generated text layer in Premiere until the font, size, color, stroke, background, and placement look right.
3. Select that edited text layer.
4. Click "Capture Selected Text Style".
5. Click "Apply Style To All Generated Text".

The Premiere host calls for reading and applying selected text style are isolated in Source-Code/textcue-ai/src/premiere.js and may need final API method wiring for the exact Premiere Pro UXP version.

Generated text highlight:
Use "Enable default highlight background" to add a bright magenta background to generated text while reviewing. It is disabled by default.

Read "SOLUTION - Install and Use Problems.txt" if the plugin does not install or does not appear inside Premiere Pro.

Transcript workflow:
Click "Generate Text Automatically". TextCue AI scans the active sequence for captions or available Premiere transcript data. Editors do not paste or import transcripts.

Functional status:
The MVP panel, transcript import, parsing, cue detection, suggestion generation, result list, settings, report export, and packaging are implemented.
Premiere host actions for text-layer creation, marker metadata/colors, playhead jumping, and generated-text undo are isolated in src/premiere.js and may need final wiring against the exact Premiere Pro UXP API version installed on the editor's machine.
