#!/bin/bash

clear
echo "TextCue AI macOS Installer"
echo "=========================="
echo

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_PATH="$SCRIPT_DIR/TextCue-AI-Premiere-macOS.ccx"

UPIA_CANDIDATES=(
  "/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent"
  "/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/macOS/UnifiedPluginInstallerAgent"
)

pause() {
  echo
  read -n 1 -s -r -p "Press any key to close."
  echo
}

if [ ! -f "$PACKAGE_PATH" ]; then
  echo "Could not find the plugin file:"
  echo "$PACKAGE_PATH"
  echo
  echo "Keep Install TextCue AI.command and TextCue-AI-Premiere-macOS.ccx in the same folder."
  pause
  exit 1
fi

echo "Step 1: Checking Adobe Creative Cloud installer..."
UPIA=""
for candidate in "${UPIA_CANDIDATES[@]}"; do
  if [ -x "$candidate" ]; then
    UPIA="$candidate"
    break
  fi
done

if [ -z "$UPIA" ]; then
  echo "Adobe Unified Plugin Installer Agent was not found."
  echo
  echo "Fix:"
  echo "1. Install or update Adobe Creative Cloud Desktop."
  echo "2. Sign in to Creative Cloud."
  echo "3. Install official Premiere Pro 25.6 or newer."
  echo "4. Try this installer again."
  echo
  echo "Alternative: double-click TextCue-AI-Premiere-macOS.ccx."
  pause
  exit 1
fi

echo "Found Adobe installer."
echo
echo "Step 2: Removing macOS quarantine from the plugin file..."
xattr -dr com.apple.quarantine "$PACKAGE_PATH" 2>/dev/null || true
xattr -dr com.apple.quarantine "$SCRIPT_DIR" 2>/dev/null || true

echo
echo "Step 3: Installing TextCue AI..."
"$UPIA" --install "$PACKAGE_PATH"
INSTALL_STATUS=$?

if [ "$INSTALL_STATUS" -ne 0 ]; then
  echo
  echo "The Adobe installer returned status $INSTALL_STATUS."
  echo
  echo "Try this:"
  echo "1. Open Adobe Creative Cloud Desktop."
  echo "2. Make sure you are signed in."
  echo "3. Make sure official Premiere Pro 25.6 or newer is installed."
  echo "4. Double-click TextCue-AI-Premiere-macOS.ccx."
  echo
  echo "Opening the .ccx now as a fallback..."
  open "$PACKAGE_PATH" || true
  pause
  exit "$INSTALL_STATUS"
fi

echo
echo "Installation command completed."
echo
echo "Next:"
echo "1. Restart Premiere Pro."
echo "2. Open Window > UXP Plugins > TextCue AI."
pause
