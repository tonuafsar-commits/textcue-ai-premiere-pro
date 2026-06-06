import { detectImportantPhrases } from "./detector.js";
import { createPremiereAdapter } from "./premiere.js";
import { readSettingsFromDom } from "./settings.js";
import { markCoveredCues } from "./timelineScanner.js";
import { checkForUpdate } from "./updateChecker.js";

let cues = [];
let generatedTextLayerIds = [];
let capturedTextStyle = null;
let premiere = null;

const elements = {};

initializeEntrypoint();
bindWhenReady();

function initializeEntrypoint() {
  try {
    if (typeof require !== "function") {
      return;
    }

    const { entrypoints } = require("uxp");
    entrypoints.setup({
      panels: {
        textCuePanel: {
          create(rootNode) {
            console.log("TextCue AI panel created", rootNode);
          },
          show() {
            refreshSequenceStatus();
          }
        }
      }
    });
  } catch (error) {
    console.warn("UXP entrypoint setup skipped outside Premiere.", error);
  }
}

function bindWhenReady() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePanel);
  } else {
    initializePanel();
  }
}

function initializePanel() {
  premiere = createPremiereAdapter();

  for (const id of [
    "sequenceStatus",
    "autoCreateBtn",
    "markersOnlyBtn",
    "captureStyleBtn",
    "applyStyleAllBtn",
    "syncTextBtn",
    "undoBtn",
    "resultsBody",
    "resultSummary",
    "messageBar",
    "capturedStyleStatus",
    "updateBar",
    "updateMessage",
    "updateLink"
  ]) {
    elements[id] = document.getElementById(id);
  }

  elements.autoCreateBtn.addEventListener("click", handleAutoCreateAll);
  elements.markersOnlyBtn.addEventListener("click", handleMarkersOnly);
  elements.captureStyleBtn.addEventListener("click", handleCaptureSelectedStyle);
  elements.applyStyleAllBtn.addEventListener("click", handleApplyStyleToAllGeneratedText);
  elements.syncTextBtn.addEventListener("click", handleSyncEditedTextToLayers);
  elements.undoBtn.addEventListener("click", handleUndoGeneratedText);
  bindStylePreview();

  refreshSequenceStatus();
  setMessage(premiere.isAvailable ? "Ready." : "Premiere DOM unavailable. UI preview mode is active.");
  runUpdateCheck();
}

function bindStylePreview() {
  for (const id of ["fontFamily", "fontSize", "fontWeight", "fontStyle", "fillColor", "strokeColor", "strokeWidth", "backgroundColor", "enableDefaultBackground", "placement"]) {
    document.getElementById(id).addEventListener("input", updateStylePreview);
    document.getElementById(id).addEventListener("change", updateStylePreview);
  }
  updateStylePreview();
}

function updateStylePreview() {
  const settings = readSettingsFromDom();
  const preview = document.getElementById("textPreview");
  const stage = document.getElementById("textPreviewStage");
  if (!preview || !stage) {
    return;
  }

  preview.style.fontFamily = `"${settings.fontFamily}", Arial, sans-serif`;
  preview.style.fontSize = `${Math.max(18, Math.round(settings.fontSize * 0.5))}px`;
  preview.style.fontWeight = settings.fontWeight;
  preview.style.fontStyle = settings.fontStyle;
  preview.style.color = settings.fillColor;
  preview.style.backgroundColor = settings.enableDefaultBackground ? settings.backgroundColor : "transparent";
  preview.style.textShadow = buildPreviewStroke(settings.strokeColor, settings.strokeWidth);
  applyPreviewPlacement(preview, settings.placement);
}

function buildPreviewStroke(color, width) {
  const size = Math.min(8, Math.max(0, Math.round(width * 0.45)));
  if (size === 0) {
    return "none";
  }

  return [
    `-${size}px -${size}px 0 ${color}`,
    `${size}px -${size}px 0 ${color}`,
    `-${size}px ${size}px 0 ${color}`,
    `${size}px ${size}px 0 ${color}`
  ].join(", ");
}

function applyPreviewPlacement(preview, placement) {
  const resolved = placement === "auto" ? "lower-third" : placement;
  preview.style.top = "auto";
  preview.style.right = "auto";
  preview.style.bottom = "22px";
  preview.style.left = "50%";
  preview.style.transform = "translateX(-50%)";

  if (resolved === "center") {
    preview.style.top = "50%";
    preview.style.bottom = "auto";
    preview.style.transform = "translate(-50%, -50%)";
  }

  if (resolved === "center-lower") {
    preview.style.bottom = "48px";
  }

  if (resolved === "right-side") {
    preview.style.left = "auto";
    preview.style.right = "22px";
    preview.style.bottom = "50%";
    preview.style.transform = "translateY(50%)";
  }
}

async function runUpdateCheck() {
  const update = await checkForUpdate();
  if (!update.available) {
    return;
  }

  elements.updateMessage.textContent = `Update available: v${update.latestVersion}`;
  elements.updateLink.href = update.url;
  elements.updateBar.hidden = false;
}

async function refreshSequenceStatus() {
  if (!premiere) {
    return;
  }

  const sequence = await premiere.getActiveSequence();
  elements.sequenceStatus.textContent = sequence ? `Active sequence: ${sequence.name || "Untitled"}` : "No active sequence detected.";
}

async function detectCuesFromActiveSequence() {
  try {
    const settings = readSettingsFromDom();
    const lines = await premiere.getActiveSequenceTranscriptLines();
    if (lines.length === 0) {
      cues = [];
      renderResults();
      throw new Error("No captions or transcript data found in the active sequence. Generate captions/transcript in Premiere first, then click Generate Text Automatically.");
    }

    const previousCreatedCues = cues.filter((cue) => cue.textLayerId);
    cues = mergeGeneratedLayerLinks(detectImportantPhrases(lines, settings), previousCreatedCues);
    cues = await markCoveredCues(cues, premiere, settings);
    renderResults();
    const synced = await syncChangedGeneratedTexts();
    const syncNote = synced > 0 ? ` Synced ${synced} existing layer(s).` : "";
    setMessage(`Scanned ${lines.length} transcript/caption lines and found ${cues.length} cue candidates.${syncNote}`);
    return cues;
  } catch (error) {
    showError(error);
    return [];
  }
}

async function handleAutoCreateAll() {
  const settings = readSettingsFromDom();
  await detectCuesFromActiveSequence();

  const targets = cues.filter((cue) => cue.status === "Needs Text" || cue.status === "Review");
  if (targets.length === 0) {
    setMessage("No pending text cues to create.");
    return;
  }

  await runCueBatch(targets, async (cue) => {
    await createTextForCue(cue, settings);
  });
}

async function handleMarkersOnly() {
  if (cues.length === 0) {
    await detectCuesFromActiveSequence();
  }

  const targets = cues.filter((cue) => cue.status === "Needs Text" || cue.status === "Review");
  if (targets.length === 0) {
    setMessage("No pending cues need markers.");
    return;
  }

  await runCueBatch(targets, async (cue) => {
    await addMarkerForCue(cue, cue.status === "Review" ? "review" : "pending");
    cue.status = "Marker Added";
  });
}

async function handleCaptureSelectedStyle() {
  try {
    capturedTextStyle = await premiere.getSelectedTextLayerStyle();
    applyCapturedStyleToControls(capturedTextStyle);
    updateStylePreview();
    elements.capturedStyleStatus.textContent = "Captured selected text style. You can now apply it to all generated text.";
    setMessage("Captured style from selected text layer.");
  } catch (error) {
    showError(error);
  }
}

async function handleApplyStyleToAllGeneratedText() {
  const createdCueIds = cues.filter((cue) => cue.textLayerId && cue.status === "Created").map((cue) => cue.textLayerId);
  if (createdCueIds.length === 0) {
    setMessage("No generated text layers found in this session.", "error");
    return;
  }

  const style = capturedTextStyle || buildStyleFromCurrentControls();
  try {
    let updated = 0;
    for (const textLayerId of createdCueIds) {
      await premiere.applyTextLayerStyle(textLayerId, style);
      updated += 1;
    }
    setMessage(`Applied style to ${updated} generated text layer(s).`);
  } catch (error) {
    showError(error);
  }
}

async function handleSyncEditedTextToLayers() {
  const synced = await syncChangedGeneratedTexts({ force: true });
  if (synced === 0) {
    setMessage("No generated text layers found in this session.", "error");
    return;
  }

  setMessage(`Synced edited text to ${synced} generated text layer(s).`);
}

async function syncChangedGeneratedTexts(options = {}) {
  const createdCues = cues.filter((cue) => cue.textLayerId && (cue.status === "Created" || cue.status === "Text Edited"));
  if (createdCues.length === 0) {
    return 0;
  }

  let updated = 0;
  try {
    for (const cue of createdCues) {
      if (!options.force && cue.lastSyncedText === cue.suggestedText) {
        continue;
      }
      await premiere.updateTextLayerText(cue.textLayerId, cue.suggestedText);
      cue.lastSyncedText = cue.suggestedText;
      cue.status = "Created";
      updated += 1;
    }
    renderResults();
    return updated;
  } catch (error) {
    showError(error);
    return updated;
  }
}

async function handleUndoGeneratedText() {
  if (generatedTextLayerIds.length === 0) {
    setMessage("No generated text from this session to undo.");
    return;
  }

  let removed = 0;
  for (const id of [...generatedTextLayerIds].reverse()) {
    try {
      const wasRemoved = await premiere.removeTextLayer(id);
      if (wasRemoved !== false) {
        removed += 1;
      }
    } catch (error) {
      console.warn(`Could not remove generated text layer ${id}.`, error);
    }
  }

  generatedTextLayerIds = [];
  cues = cues.map((cue) => cue.status === "Created" ? { ...cue, status: "Needs Text", textLayerId: null } : cue);
  renderResults();
  setMessage(removed > 0 ? `Undid ${removed} generated text layer(s).` : "Undo metadata cleared. Premiere removal API still needs wiring.");
}

async function runCueBatch(targets, action) {
  let completed = 0;
  for (const cue of targets) {
    try {
      await action(cue);
      completed += 1;
    } catch (error) {
      cue.status = "Review";
      console.warn(`Cue action failed for ${cue.suggestedText}.`, error);
      setMessage(error.message, "error");
      break;
    }
  }
  renderResults();
  if (completed > 0) {
    setMessage(`Processed ${completed} cue(s).`);
  }
}

async function createTextForCue(cue, settings) {
  if (cue.status === "Covered" || cue.status === "Ignored") {
    return;
  }

  const textLayerId = await premiere.createTextLayer(cue, settings);
  cue.textLayerId = textLayerId;
  cue.status = "Created";
  cue.lastSyncedText = cue.suggestedText;
  generatedTextLayerIds.push(textLayerId);
  document.getElementById("textPreview").textContent = cue.suggestedText;

  if (settings.addMarkersAfterText) {
    cue.markerId = await premiere.addMarker(cue, "done");
  }
}

async function addMarkerForCue(cue, markerStatus) {
  cue.markerId = await premiere.addMarker(cue, markerStatus);
}

function renderResults() {
  if (cues.length === 0) {
    elements.resultsBody.innerHTML = `<tr><td colspan="6" class="empty-state">No cues detected yet.</td></tr>`;
    elements.resultSummary.textContent = "No cue candidates.";
    return;
  }

  elements.resultsBody.innerHTML = "";
  const counts = countByStatus(cues);
  elements.resultSummary.textContent = `${cues.length} cues | ${counts["Needs Text"] || 0} need text | ${counts.Covered || 0} covered`;

  for (const cue of cues) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(cue.timeLabel)}</td>
      <td>${escapeHtml(cue.category)}<br><small>${escapeHtml(cue.spokenLine)}</small></td>
      <td><input class="editable-text" value="${escapeAttribute(cue.suggestedText)}" aria-label="Suggested text" /></td>
      <td class="${statusClass(cue.status)}">${escapeHtml(cue.status)}</td>
      <td class="confidence">${Math.round(cue.confidence * 100)}%</td>
      <td class="actions">
        <div class="row-actions">
          <button data-action="jump">Jump</button>
          <button data-action="create">Create Text</button>
          <button data-action="marker">Add Marker</button>
          <button data-action="ignore">Ignore</button>
        </div>
      </td>
    `;

    row.querySelector(".editable-text").addEventListener("change", (event) => {
      cue.suggestedText = event.target.value.trim() || cue.suggestedText;
      if (cue.textLayerId && cue.status === "Created") {
        cue.status = "Text Edited";
      }
      document.getElementById("textPreview").textContent = cue.suggestedText;
      renderResults();
    });
    row.querySelector('[data-action="jump"]').addEventListener("click", () => handleCueJump(cue));
    row.querySelector('[data-action="create"]').addEventListener("click", () => handleCueCreate(cue));
    row.querySelector('[data-action="marker"]').addEventListener("click", () => handleCueMarker(cue));
    row.querySelector('[data-action="ignore"]').addEventListener("click", () => handleCueIgnore(cue));

    elements.resultsBody.appendChild(row);
  }
}

async function handleCueJump(cue) {
  try {
    await premiere.jumpToTime(cue.startSeconds);
    setMessage(`Jumped to ${cue.timeLabel}.`);
  } catch (error) {
    showError(error);
  }
}

async function handleCueCreate(cue) {
  try {
    await createTextForCue(cue, readSettingsFromDom());
    renderResults();
    setMessage(`Created text: ${cue.suggestedText}`);
  } catch (error) {
    showError(error);
  }
}

async function handleCueMarker(cue) {
  try {
    await addMarkerForCue(cue, cue.status === "Review" ? "review" : "pending");
    cue.status = "Marker Added";
    renderResults();
    setMessage(`Added marker: ${cue.suggestedText}`);
  } catch (error) {
    showError(error);
  }
}

function handleCueIgnore(cue) {
  cue.status = "Ignored";
  cue.ignored = true;
  renderResults();
  setMessage(`Ignored cue: ${cue.suggestedText}`);
}

function mergeGeneratedLayerLinks(nextCues, previousCreatedCues) {
  return nextCues.map((cue) => {
    const previous = previousCreatedCues.find((item) => (
      Math.abs(item.startSeconds - cue.startSeconds) < 0.25 &&
      item.category === cue.category
    ));

    if (!previous) {
      return cue;
    }

    return {
      ...cue,
      status: previous.suggestedText === cue.suggestedText ? previous.status : "Text Edited",
      markerId: previous.markerId,
      textLayerId: previous.textLayerId,
      lastSyncedText: previous.lastSyncedText
    };
  });
}

function buildStyleFromCurrentControls() {
  const settings = readSettingsFromDom();
  return {
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    fontWeight: settings.fontWeight,
    fontStyle: settings.fontStyle,
    fillColor: settings.fillColor,
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    backgroundColor: settings.backgroundColor,
    enableDefaultBackground: settings.enableDefaultBackground,
    placement: settings.placement
  };
}

function applyCapturedStyleToControls(style) {
  setControlValue("fontFamily", style.fontFamily);
  setControlValue("fontSize", style.fontSize);
  setControlValue("fontWeight", style.fontWeight);
  setControlValue("fontStyle", style.fontStyle);
  setControlValue("fillColor", style.fillColor);
  setControlValue("strokeColor", style.strokeColor);
  setControlValue("strokeWidth", style.strokeWidth);
  setControlValue("backgroundColor", style.backgroundColor);
  setControlChecked("enableDefaultBackground", style.enableDefaultBackground);
  setControlValue("placement", style.placement);
}

function setControlValue(id, value) {
  const control = document.getElementById(id);
  if (!control || value === undefined || value === null || value === "") {
    return;
  }
  control.value = String(value);
}

function setControlChecked(id, value) {
  const control = document.getElementById(id);
  if (!control || value === undefined || value === null) {
    return;
  }
  control.checked = Boolean(value);
}

function countByStatus(items) {
  return items.reduce((accumulator, item) => {
    accumulator[item.status] = (accumulator[item.status] || 0) + 1;
    return accumulator;
  }, {});
}

function statusClass(status) {
  return `status-${String(status).toLowerCase().replace(/\s+/g, "-")}`;
}

function setMessage(message, level = "info") {
  elements.messageBar.textContent = message;
  elements.messageBar.style.color = level === "error" ? "var(--danger)" : "var(--muted)";
}

function showError(error) {
  console.error(error);
  setMessage(error.message || "Something went wrong.", "error");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
