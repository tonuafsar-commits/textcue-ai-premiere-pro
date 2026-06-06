TextCue AI for Premiere Pro - macOS Install
===========================================

Recommended install:
1. Close Premiere Pro.
2. Make sure Adobe Creative Cloud Desktop is installed and signed in.
3. Right-click "Install TextCue AI.command" and choose Open.
4. If macOS blocks the script, open Terminal and run:
   chmod +x "Install TextCue AI.command"
   ./Install\ TextCue\ AI.command
5. Restart Premiere Pro.
6. Open Window > UXP Plugins > TextCue AI.

Alternative install:
1. Double-click TextCue-AI-Premiere-macOS.ccx.
2. Approve installation in Creative Cloud Desktop.
3. Restart Premiere Pro.
4. Open Window > UXP Plugins > TextCue AI.

Manual UPIA install:
1. Open Terminal.
2. Run:
   cd "/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/macOS"
   ./UnifiedPluginInstallerAgent --install "FULL_PATH_TO/TextCue-AI-Premiere-macOS.ccx"

Requirements:
- Premiere Pro 25.6 or newer.
- Adobe Creative Cloud Desktop.
- Developer Mode may need to be enabled in Premiere Pro plugin preferences for development builds.

Important status:
The panel, transcript import, parsing, cue detection, suggested text generation, review list, report export, and UI flow are implemented.
Premiere host actions for real timeline text creation, marker metadata, playhead jumping, and generated-text removal are isolated in src/premiere.js and may need final API wiring for the exact Premiere Pro UXP version installed.
