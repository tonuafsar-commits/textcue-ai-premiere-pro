const TIMESTAMP_PATTERNS = [
  /^(?<time>\d{1,2}:\d{2}(?::\d{2})?)\s*(?:-|--|–|—|\|)\s*(?<text>.+)$/u,
  /^\[(?<time>\d{1,2}:\d{2}(?::\d{2})?)\]\s*(?<text>.+)$/u,
  /^(?<time>\d+(?:\.\d+)?)s?\s*(?:-|--|–|—|\|)\s*(?<text>.+)$/u
];

export function parseTranscript(rawText) {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  return rawText
    .split(/\r?\n/)
    .map((line, index) => parseTranscriptLine(line, index + 1))
    .filter(Boolean);
}

export function parseTranscriptLine(line, lineNumber) {
  const trimmed = line.trim();
  if (!trimmed || trimmed === "WEBVTT") {
    return null;
  }

  for (const pattern of TIMESTAMP_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match.groups) {
      const startSeconds = timestampToSeconds(match.groups.time);
      if (Number.isFinite(startSeconds)) {
        return {
          id: `line-${lineNumber}-${startSeconds}`,
          lineNumber,
          startSeconds,
          timeLabel: secondsToTimestamp(startSeconds),
          text: match.groups.text.trim()
        };
      }
    }
  }

  return null;
}

export function timestampToSeconds(value) {
  if (!value) {
    return NaN;
  }

  if (/^\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }

  const parts = value.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) {
    return NaN;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return NaN;
}

export function secondsToTimestamp(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}
