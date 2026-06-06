export async function markCoveredCues(cues, premiere, settings) {
  if (!settings.avoidDuplicates) {
    return cues.map((cue) => ({ ...cue, status: cue.status === "Covered" ? "Needs Text" : cue.status }));
  }

  const sequence = await premiere.getActiveSequence();
  if (!sequence) {
    return cues;
  }

  const ranges = await premiere.findTextLikeClips(sequence);
  return cues.map((cue) => {
    if (cue.textLayerId || cue.status === "Created" || cue.status === "Text Edited") {
      return cue;
    }
    const covered = ranges.some((range) => overlapsTolerance(cue.startSeconds, range, settings));
    return covered ? { ...cue, status: "Covered" } : cue;
  });
}

export function overlapsTolerance(seconds, range, settings) {
  const start = seconds - settings.duplicateToleranceBefore;
  const end = seconds + settings.duplicateToleranceAfter;
  return range.startSeconds <= end && range.endSeconds >= start;
}
