export function buildReport(cues, settings, sequenceName = "Active Sequence") {
  const created = cues.filter((cue) => cue.status === "Created");
  const ignored = cues.filter((cue) => cue.status === "Ignored");
  const covered = cues.filter((cue) => cue.status === "Covered");
  const pending = cues.filter((cue) => cue.status === "Needs Text" || cue.status === "Review");

  const lines = [
    "TextCue AI Report",
    `Sequence: ${sequenceName}`,
    `Exported: ${new Date().toLocaleString()}`,
    `Mode: ${settings.textMode}`,
    `Style Preset: ${settings.stylePreset}`,
    "",
    `Created: ${created.length}`,
    `Ignored: ${ignored.length}`,
    `Covered: ${covered.length}`,
    `Pending/Review: ${pending.length}`,
    "",
    "Cue Details",
    "==========="
  ];

  for (const cue of cues) {
    lines.push(
      "",
      `[${cue.status}] ${cue.timeLabel} | ${cue.category} | ${Math.round(cue.confidence * 100)}%`,
      `Suggested: ${cue.suggestedText}`,
      `Spoken: ${cue.spokenLine}`
    );
  }

  return lines.join("\n");
}

export async function exportTextFile(fileName, content) {
  try {
    if (typeof require === "function") {
      const fs = require("uxp").storage?.localFileSystem;
      if (fs?.getFileForSaving) {
        const file = await fs.getFileForSaving(fileName, { types: ["txt"] });
        await file.write(content);
        return true;
      }
    }
  } catch (error) {
    console.warn("UXP save dialog unavailable, falling back to browser download.", error);
  }

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
