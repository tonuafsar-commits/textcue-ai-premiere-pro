TextCue AI Premiere Pro Packages
================================

Use the Windows folder on Windows:
- Run TextCueAIInstaller.exe.
- Or double-click TextCue-AI-Premiere-Windows.ccx.

Use the macOS folder on macOS:
- Right-click "Install TextCue AI.command" and choose Open.
- Or double-click TextCue-AI-Premiere-macOS.ccx.

Use Direct-Download-Packages for sharing:
- TextCue-AI-Windows-Installer-Package.zip
- TextCue-AI-macOS-Installer-Package.zip
- TextCue-AI-Source-Code.zip

Read "SOLUTION - Install and Use Problems.txt" if the plugin does not install or does not appear inside Premiere Pro.

Functional status:
The MVP panel, transcript import, parsing, cue detection, suggestion generation, result list, settings, report export, and packaging are implemented.
Premiere host actions for text-layer creation, marker metadata/colors, playhead jumping, and generated-text undo are isolated in src/premiere.js and may need final wiring against the exact Premiere Pro UXP API version installed on the editor's machine.
