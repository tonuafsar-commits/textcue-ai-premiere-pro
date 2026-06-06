#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_PATH="$SCRIPT_DIR/TextCue-AI-Premiere-macOS.ccx"
UPIA="/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/macOS/UnifiedPluginInstallerAgent"

echo "TextCue AI Premiere Pro UXP Installer"
echo "--------------------------------------"

if [ ! -f "$PACKAGE_PATH" ]; then
  echo "Could not find TextCue-AI-Premiere-macOS.ccx next to this installer."
  echo "Folder checked: $SCRIPT_DIR"
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi

if [ ! -x "$UPIA" ]; then
  echo "Adobe Unified Plugin Installer Agent was not found."
  echo "Install or update Adobe Creative Cloud Desktop, then try again."
  echo "Expected path:"
  echo "$UPIA"
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi

echo "Installing:"
echo "$PACKAGE_PATH"
"$UPIA" --install "$PACKAGE_PATH"

echo
echo "Installation command completed."
echo "Restart Premiere Pro, then open Window > UXP Plugins > TextCue AI."
read -n 1 -s -r -p "Press any key to close."
