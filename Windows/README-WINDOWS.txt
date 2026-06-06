TextCue AI for Premiere Pro - Windows Install
=============================================

Recommended install:
1. Close Premiere Pro.
2. Make sure Adobe Creative Cloud Desktop is installed and signed in.
3. Run TextCueAIInstaller.exe.
4. Restart Premiere Pro.
5. Open Window > UXP Plugins > TextCue AI.

Alternative install:
1. Double-click TextCue-AI-Premiere-Windows.ccx.
2. Approve installation in Creative Cloud Desktop.
3. Restart Premiere Pro.
4. Open Window > UXP Plugins > TextCue AI.

Manual UPIA install:
1. Open Command Prompt as Administrator.
2. Run:
   cd "C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent"
   UnifiedPluginInstallerAgent.exe /install "FULL_PATH_TO\TextCue-AI-Premiere-Windows.ccx"

Requirements:
- Premiere Pro 25.6 or newer.
- Adobe Creative Cloud Desktop.
- Developer Mode may need to be enabled in Premiere Pro plugin preferences for development builds.

Important status:
The panel, transcript import, parsing, cue detection, suggested text generation, review list, report export, and UI flow are implemented.
Premiere host actions for real timeline text creation, marker metadata, playhead jumping, and generated-text removal are isolated in src/premiere.js and may need final API wiring for the exact Premiere Pro UXP version installed.
