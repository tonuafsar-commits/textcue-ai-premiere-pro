import { detectImportantPhrases } from "./detector.js";
import { createPremiereAdapter } from "./premiere.js";
import { buildReport, exportTextFile } from "./reportExporter.js";
import { readSettingsFromDom } from "./settings.js";
import { markCoveredCues } from "./timelineScanner.js";
import { parseTranscript } from "./transcriptParser.js";

let cues = [];
let generatedTextLayerIds = [];
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
    "scanSequenceBtn",
    "importTranscriptBtn",
    "autoCreateBtn",
    "markersOnlyBtn",
    "exportReportBtn",
    "undoBtn",
    "analyzeTranscriptBtn",
    "transcriptInput",
    "fileInput",
    "resultsBody",
    "resultSummary",
    "messageBar"
  ]) {
    elements[id] = document.getElementById(id);
  }

  elements.scanSequenceBtn.addEventListener("click", handleScanSequence);
  elements.importTranscriptBtn.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", handleTranscriptImport);
  elements.analyzeTranscriptBtn.addEventListener("click", handleAnalyzeTranscript);
  elements.autoCreateBtn.addEventListener("click", handleAutoCreateAll);
  elements.markersOnlyBtn.addEventListener("click", handleMarkersOnly);
  elements.exportReportBtn.addEventListener("click", handleExportReport);
  elements.undoBtn.addEventListener("click", handleUndoGeneratedText);

  refreshSequenceStatus();
  setMessage(premiere.isAvailable ? "Ready." : "Premiere DOM unavailable. UI preview mode is active.");
}

async function refreshSequenceStatus() {
  if (!premiere) {
    return;
  }

  const sequence = await premiere.getActiveSequence();
  elements.sequenceStatus.textContent = sequence ? `Active sequence: ${sequence.name || "Untitled"}` : "No active sequence detected.";
}

async function handleScanSequence() {
  try {
    const sequence = await premiere.getActiveSequence();
    if (!sequence) {
      setMessage("No active sequence is open. Open a sequence in Premiere Pro first.", "error");
      await refreshSequenceStatus();
      return;
    }

    await refreshSequenceStatus();
    if (cues.length > 0) {
      cues = await markCoveredCues(cues, premiere, readSettingsFromDom());
      renderResults();
    }
    setMessage("Active sequence scanned.");
  } catch (error) {
    showError(error);
  }
}

async function handleTranscriptImport(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    elements.transcriptInput.value = await file.text();
    setMessage(`Imported ${file.name}.`);
    await handleAnalyzeTranscript();
  } catch (error) {
    showError(error);
  } finally {
    event.target.value = "";
  }
}

async function handleAnalyzeTranscript() {
  try {
    const settings = readSettingsFromDom();
    const lines = parseTranscript(elements.transcriptInput.value);
    if (lines.length === 0) {
      cues = [];
      renderResults();
      setMessage("No timestamped transcript lines found. Use lines like 00:12 - Spoken text.", "error");
      return;
    }

    cues = detectImportantPhrases(lines, settings);
    cues = await markCoveredCues(cues, premiere, settings);
    renderResults();
    setMessage(`Analyzed ${lines.length} transcript lines and found ${cues.length} cue candidates.`);
  } catch (error) {
    showError(error);
  }
}

async function handleAutoCreateAll() {
  const settings = readSettingsFromDom();
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

async function handleExportReport() {
  try {
    const sequence = await premiere.getActiveSequence();
    const report = buildReport(cues, readSettingsFromDom(), sequence?.name || "Active Sequence");
    await exportTextFile("textcue-ai-report.txt", report);
    setMessage("Report exported.");
  } catch (error) {
    showError(error);
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
  generatedTextLayerIds.push(textLayerId);

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
