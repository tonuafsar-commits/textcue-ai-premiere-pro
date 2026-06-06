import { buildSuggestedText, extractProductName } from "./textGenerator.js";

const CATEGORY_RULES = [
  {
    category: "Ranking/product intro",
    confidence: 0.94,
    modes: ["minimal", "balanced", "heavy"],
    pattern: /\b(?:at\s+)?number\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b|\bcoming in at number\b|\bnext up\b/i
  },
  {
    category: "Price",
    confidence: 0.92,
    modes: ["minimal", "balanced", "heavy"],
    pattern: /\b(?:price is|costs|around\s+\$|about\s+\$|under\s+\$|budget|affordable)\b|\$\s?\d+/i
  },
  {
    category: "Warning",
    confidence: 0.88,
    modes: ["minimal", "balanced", "heavy"],
    pattern: /\b(?:make sure|be careful|keep in mind|does not support|don't forget)\b/i
  },
  {
    category: "Compatibility note",
    confidence: 0.9,
    modes: ["minimal", "balanced", "heavy"],
    pattern: /\b(?:only works with|not compatible|compatible with|supports wired|supports wireless)\b/i
  },
  {
    category: "Specs",
    confidence: 0.86,
    modes: ["balanced", "heavy"],
    pattern: /\b(?:4k|1080p|60\s?fps|battery life|waterproof|bluetooth|usb-c|night vision|wireless carplay|wired carplay)\b/i
  },
  {
    category: "Tutorial step",
    confidence: 0.82,
    modes: ["balanced", "heavy"],
    pattern: /\bstep\s+(?:\d+|one|two|three|four|five)\b|^\s*(?:first|next|after that|finally)\b/i
  },
  {
    category: "Pros/cons",
    confidence: 0.76,
    modes: ["heavy"],
    pattern: /\b(?:pros?|cons?|benefit|advantage|drawback|downside|best thing|worst thing)\b/i
  },
  {
    category: "Important claim",
    confidence: 0.68,
    modes: ["heavy"],
    pattern: /\b(?:best|fastest|easiest|most important|key feature|main reason|you need)\b/i
  }
];

export function detectImportantPhrases(transcriptLines, settings) {
  const mode = settings.textMode || "balanced";
  const cues = [];

  for (const line of transcriptLines) {
    const matchedRules = CATEGORY_RULES.filter((rule) => rule.modes.includes(mode) && rule.pattern.test(line.text));

    if (matchedRules.length === 0) {
      const productName = mode !== "heavy" ? extractProductName(line.text) : "";
      if (productName) {
        cues.push(createCue(line, "Product name", 0.72, settings));
      }
      continue;
    }

    for (const rule of matchedRules) {
      cues.push(createCue(line, rule.category, adjustConfidence(rule.confidence, line.text), settings));
    }
  }

  return dedupeCues(cues);
}

function createCue(line, category, confidence, settings) {
  const suggestedText = buildSuggestedText(category, line.text, {
    heavy: settings.textMode === "heavy"
  });

  return {
    id: `${line.id}-${slug(category)}-${slug(suggestedText)}`,
    startSeconds: line.startSeconds,
    timeLabel: line.timeLabel,
    spokenLine: line.text,
    suggestedText,
    category,
    confidence,
    status: confidence < 0.72 ? "Review" : "Needs Text",
    markerId: null,
    textLayerId: null,
    ignored: false
  };
}

function adjustConfidence(baseConfidence, text) {
  const lengthPenalty = text.split(/\s+/).length > 22 ? 0.06 : 0;
  const vaguePenalty = /\b(?:thing|stuff|something)\b/i.test(text) ? 0.05 : 0;
  return Math.max(0.5, Math.min(0.99, Number((baseConfidence - lengthPenalty - vaguePenalty).toFixed(2))));
}

function dedupeCues(cues) {
  const seen = new Set();
  return cues.filter((cue) => {
    const key = `${Math.round(cue.startSeconds)}-${cue.suggestedText.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
