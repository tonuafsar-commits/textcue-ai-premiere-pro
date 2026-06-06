export const CURRENT_VERSION = "0.1.3";
export const LATEST_RELEASE_API = "https://api.github.com/repos/tonuafsar-commits/textcue-ai-premiere-pro/releases/latest";
export const STABLE_DOWNLOAD_URL = "https://github.com/tonuafsar-commits/textcue-ai-premiere-pro/releases/latest/download/TextCue-AI-All-In-One.zip";

export async function checkForUpdate() {
  try {
    const response = await fetch(LATEST_RELEASE_API, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      return { available: false, error: `Update check failed: ${response.status}` };
    }

    const release = await response.json();
    const latestVersion = normalizeVersion(release.tag_name || release.name || "");
    const currentVersion = normalizeVersion(CURRENT_VERSION);

    if (compareVersions(latestVersion, currentVersion) > 0) {
      const allInOneAsset = release.assets?.find((asset) => asset.name === "TextCue-AI-All-In-One.zip");
      return {
        available: true,
        currentVersion,
        latestVersion,
        url: allInOneAsset?.browser_download_url || release.html_url || STABLE_DOWNLOAD_URL
      };
    }

    return { available: false, currentVersion, latestVersion };
  } catch (error) {
    console.warn("TextCue AI update check failed.", error);
    return { available: false, error: error.message };
  }
}

export function compareVersions(a, b) {
  const left = String(a).split(".").map((part) => Number(part) || 0);
  const right = String(b).split(".").map((part) => Number(part) || 0);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const delta = (left[index] || 0) - (right[index] || 0);
    if (delta !== 0) {
      return delta;
    }
  }

  return 0;
}

function normalizeVersion(value) {
  return String(value).trim().replace(/^v/i, "") || "0.0.0";
}
