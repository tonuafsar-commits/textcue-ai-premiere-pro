const PRODUCT_AFTER_RANKING = /(?:we have|goes to|is|for)\s+(?:the\s+)?(?<name>[A-Z0-9][A-Za-z0-9+.'-]*(?:\s+[A-Z0-9][A-Za-z0-9+.'-]*){1,7})/;
const PRICE_PATTERN = /(?:around|under|about|only|just)?\s*\$\s?\d+(?:[.,]\d{2})?/i;
const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10
};

export function buildSuggestedText(category, spokenLine, context = {}) {
  switch (category) {
    case "Ranking/product intro":
      return buildRankingText(spokenLine);
    case "Product name":
      return extractProductName(spokenLine) || titleCase(compactLine(spokenLine, 5));
    case "Price":
      return buildPriceText(spokenLine);
    case "Specs":
      return buildSpecsText(spokenLine);
    case "Warning":
    case "Compatibility note":
      return buildWarningText(spokenLine);
    case "Tutorial step":
      return buildTutorialText(spokenLine);
    case "Pros/cons":
      return buildProsConsText(spokenLine);
    case "Important claim":
      return titleCase(compactLine(spokenLine, context.heavy ? 7 : 5));
    default:
      return titleCase(compactLine(spokenLine, 6));
  }
}

export function buildRankingText(line) {
  const rank = extractRank(line);
  const productName = extractProductName(line);
  if (rank && productName) {
    return `#${rank} ${productName}`;
  }
  if (rank) {
    return `#${rank}`;
  }
  return extractProductName(line) || "Next Pick";
}

export function buildPriceText(line) {
  const match = line.match(PRICE_PATTERN);
  if (match) {
    const price = match[0].replace(/\s+/g, "");
    if (/under/i.test(match[0])) {
      return `Under ${price.replace(/under/i, "")}`;
    }
    if (/around|about/i.test(match[0])) {
      return `Around ${price.replace(/around|about/i, "")}`;
    }
    return price;
  }
  if (/budget|affordable/i.test(line)) {
    return "Budget Friendly";
  }
  return "Check Price";
}

export function buildSpecsText(line) {
  const specs = [];
  const specPatterns = [
    [/\b4k\b/i, "4K Recording"],
    [/\b1080p\b/i, "1080p Video"],
    [/\b(?:60\s?fps|60 frames)\b/i, "60 FPS"],
    [/\b(?:30\s?h|30 hour|30-hour).*battery/i, "30H Battery Life"],
    [/\bbattery life\b/i, "Long Battery Life"],
    [/\bwaterproof\b/i, "Waterproof"],
    [/\bbluetooth\b/i, "Bluetooth"],
    [/\busb-c\b/i, "USB-C"],
    [/\bnight vision\b/i, "Night Vision"],
    [/\bwireless carplay\b/i, "Wireless CarPlay"],
    [/\bwired carplay\b/i, "Wired CarPlay"]
  ];

  for (const [pattern, label] of specPatterns) {
    if (pattern.test(line)) {
      specs.push(label);
    }
  }

  return specs.slice(0, 2).join(" + ") || titleCase(compactLine(line, 4));
}

export function buildWarningText(line) {
  if (/not compatible with\s+(?<thing>[A-Za-z0-9 -]+)/i.test(line)) {
    const thing = line.match(/not compatible with\s+(?<thing>[A-Za-z0-9 -]+)/i).groups.thing;
    return `Not Compatible With ${titleCase(compactLine(thing, 3))}`;
  }
  if (/only works with\s+(?<thing>[A-Za-z0-9 -]+)/i.test(line)) {
    const thing = line.match(/only works with\s+(?<thing>[A-Za-z0-9 -]+)/i).groups.thing;
    return `Only Works With ${titleCase(compactLine(thing, 3))}`;
  }
  if (/compatible|support/i.test(line)) {
    return "Check Compatibility First";
  }
  return "Important: Check First";
}

export function buildTutorialText(line) {
  const stepMatch = line.match(/\bstep\s+(?<step>\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
  const step = stepMatch ? normalizeRank(stepMatch.groups.step) : null;
  const cleaned = line
    .replace(/\bstep\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b[:,]?\s*/i, "")
    .replace(/\b(first|next|after that|finally)\b[:,]?\s*/i, "")
    .trim();
  const action = titleCase(compactLine(cleaned, 4)) || "Follow This Step";
  return step ? `Step ${step}: ${action}` : action;
}

export function buildProsConsText(line) {
  if (/\b(pro|benefit|advantage|best thing)\b/i.test(line)) {
    return titleCase(compactLine(line, 5));
  }
  if (/\b(con|downside|drawback|weakness)\b/i.test(line)) {
    return `Downside: ${titleCase(compactLine(line, 4))}`;
  }
  return titleCase(compactLine(line, 5));
}

export function extractRank(line) {
  const match = line.match(/\b(?:number|#)\s*(?<rank>\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
  return match ? normalizeRank(match.groups.rank) : null;
}

export function extractProductName(line) {
  const ranked = line.match(PRODUCT_AFTER_RANKING);
  if (ranked && ranked.groups.name) {
    return cleanupProductName(ranked.groups.name);
  }

  const quoted = line.match(/["“](?<name>[^"”]+)["”]/);
  if (quoted && quoted.groups.name) {
    return cleanupProductName(quoted.groups.name);
  }

  return "";
}

export function normalizeRank(value) {
  const lower = String(value).toLowerCase();
  return NUMBER_WORDS[lower] || Number(value);
}

function cleanupProductName(value) {
  return value
    .replace(/\b(with|that|which|and it|it records|price|costs).*/i, "")
    .replace(/[.,:;!?]+$/g, "")
    .trim();
}

function compactLine(line, maxWords) {
  return String(line)
    .replace(/[.,!?;:]+/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}

function titleCase(value) {
  return String(value)
    .toLowerCase()
    .replace(/\b[a-z0-9]/g, (char) => char.toUpperCase());
}
