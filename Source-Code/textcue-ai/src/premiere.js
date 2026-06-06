import { STYLE_PRESETS } from "./settings.js";

const MARKER_COLOR_INDEX = {
  pending: 1,
  done: 2,
  review: 3,
  covered: 4
};

export function createPremiereAdapter() {
  let app = null;

  try {
    if (typeof require === "function") {
      app = require("premierepro");
    }
  } catch (error) {
    console.warn("Premiere DOM unavailable. TextCue AI will run in UI-only mode.", error);
  }

  return {
    isAvailable: Boolean(app),

    async getActiveSequence() {
      if (!app) {
        return null;
      }

      try {
        const project = app.Project?.getActiveProject ? await app.Project.getActiveProject() : app.project;
        if (!project) {
          return null;
        }
        if (project.getActiveSequence) {
          return await project.getActiveSequence();
        }
        return project.activeSequence || null;
      } catch (error) {
        console.error("Could not get active sequence.", error);
        return null;
      }
    },

    async jumpToTime(seconds) {
      const sequence = await this.getActiveSequence();
      if (!sequence) {
        throw new Error("No active sequence is open.");
      }

      // TODO: Verify exact Premiere Pro UXP playhead API for the installed version.
      if (sequence.setPlayerPosition) {
        return sequence.setPlayerPosition(secondsToPremiereTime(seconds));
      }
      if (sequence.setPlayheadPosition) {
        return sequence.setPlayheadPosition(secondsToPremiereTime(seconds));
      }
      console.info(`Jump requested at ${seconds}s, but this Premiere UXP build did not expose a known playhead method.`);
      return null;
    },

    async findTextLikeClips(sequence) {
      if (!sequence) {
        return [];
      }

      try {
        const ranges = [];
        const videoTracks = getCollectionItems(sequence.videoTracks || sequence.videoTrack || []);
        for (const track of videoTracks) {
          const clips = getCollectionItems(track.clips || track.clipsCollection || []);
          for (const clip of clips) {
            if (isTextLikeClip(clip)) {
              ranges.push(readClipRange(clip));
            }
          }
        }
        return ranges.filter(Boolean);
      } catch (error) {
        console.warn("Timeline scan failed; duplicate detection skipped.", error);
        return [];
      }
    },

    async createTextLayer(cue, settings) {
      const sequence = await this.getActiveSequence();
      if (!sequence) {
        throw new Error("No active sequence is open.");
      }

      const style = STYLE_PRESETS[settings.stylePreset] || STYLE_PRESETS["Product Review"];
      const finalStyle = {
        ...style,
        fontFamily: settings.fontFamily || style.fontFamily,
        fontSize: settings.fontSize || style.fontSize,
        fontWeight: settings.fontWeight || "700",
        fontStyle: settings.fontStyle || "normal",
        fillColor: settings.fillColor || style.fillColor,
        strokeColor: settings.strokeColor || style.strokeColor,
        strokeWidth: Number.isFinite(settings.strokeWidth) ? settings.strokeWidth : style.strokeWidth,
        backgroundColor: settings.backgroundColor || style.backgroundColor
      };
      const payload = {
        text: cue.suggestedText,
        startSeconds: cue.startSeconds,
        durationSeconds: settings.textDuration,
        placement: placementForCue(cue.category, settings.placement === "auto" ? style.position : settings.placement, settings.verticalSafeZone),
        style: finalStyle
      };

      // TODO: Replace these fallbacks with the exact text/graphic creation API available in your Premiere Pro UXP version.
      // Current public UXP docs confirm Premiere DOM access, but text-layer creation members are still version-sensitive.
      if (sequence.createTextLayer) {
        const layer = await sequence.createTextLayer(payload);
        return getStableId(layer) || `text-${Date.now()}`;
      }
      if (sequence.addText) {
        const layer = await sequence.addText(payload.text, secondsToPremiereTime(payload.startSeconds), payload.durationSeconds, payload);
        return getStableId(layer) || `text-${Date.now()}`;
      }

      console.info("Text layer payload prepared:", payload);
      throw new Error("Text creation API is not available in this Premiere UXP build. Use markers or wire the TODO in src/premiere.js.");
    },

    async addMarker(cue, status = "pending") {
      const sequence = await this.getActiveSequence();
      if (!sequence) {
        throw new Error("No active sequence is open.");
      }

      const name = markerNameForCue(cue, status);
      const comments = `${cue.category}\n${cue.spokenLine}`;
      const colorIndex = MARKER_COLOR_INDEX[status] || MARKER_COLOR_INDEX.pending;

      try {
        const markers = sequence.markers || sequence.getMarkers?.();
        let marker = null;

        // TODO: Confirm marker collection API against the installed Premiere Pro UXP TypeScript definitions.
        if (markers?.createMarker) {
          marker = await markers.createMarker(secondsToPremiereTime(cue.startSeconds));
        } else if (sequence.createMarker) {
          marker = await sequence.createMarker(secondsToPremiereTime(cue.startSeconds));
        }

        if (marker) {
          await applyMarkerMetadata(marker, { name, comments, colorIndex });
          return getStableId(marker) || `marker-${Date.now()}`;
        }
      } catch (error) {
        console.warn("Marker creation failed.", error);
        throw error;
      }

      throw new Error("Marker API is not available in this Premiere UXP build. Wire the TODO in src/premiere.js.");
    },

    async removeTextLayer(textLayerId) {
      const sequence = await this.getActiveSequence();
      if (!sequence) {
        throw new Error("No active sequence is open.");
      }

      // TODO: Store and remove the created Graphic/TrackItem once the exact API object is returned by createTextLayer().
      if (sequence.removeTextLayer) {
        return sequence.removeTextLayer(textLayerId);
      }
      console.info(`Undo requested for generated text layer ${textLayerId}.`);
      return false;
    },

    async getSelectedTextLayerStyle() {
      const sequence = await this.getActiveSequence();
      if (!sequence) {
        throw new Error("No active sequence is open.");
      }

      // TODO: Wire this to the installed Premiere Pro UXP API for reading the selected Graphic/Text component.
      // Expected return shape:
      // { fontFamily, fontSize, fontWeight, fontStyle, fillColor, strokeColor, strokeWidth, backgroundColor, placement }
      if (sequence.getSelectedTextLayerStyle) {
        return sequence.getSelectedTextLayerStyle();
      }

      if (sequence.getSelection) {
        const selection = await sequence.getSelection();
        const selectedItem = Array.isArray(selection) ? selection[0] : selection?.[0] || selection;
        if (selectedItem?.getTextStyle) {
          return selectedItem.getTextStyle();
        }
      }

      throw new Error("Selected text style reading is not available in this Premiere UXP build. Wire the TODO in src/premiere.js.");
    },

    async applyTextLayerStyle(textLayerId, style) {
      const sequence = await this.getActiveSequence();
      if (!sequence) {
        throw new Error("No active sequence is open.");
      }

      // TODO: Wire this to the installed Premiere Pro UXP API for applying style to generated Graphic/Text layers.
      if (sequence.applyTextLayerStyle) {
        return sequence.applyTextLayerStyle(textLayerId, style);
      }
      if (sequence.updateTextLayerStyle) {
        return sequence.updateTextLayerStyle(textLayerId, style);
      }

      console.info("Apply style requested:", { textLayerId, style });
      throw new Error("Applying style to generated text layers is not available in this Premiere UXP build. Wire the TODO in src/premiere.js.");
    }
  };
}

export function markerNameForCue(cue, status) {
  if (status === "done") {
    return `✅ TEXT ADDED | ${cue.suggestedText}`;
  }
  if (status === "covered") {
    return `🔵 COVERED | ${cue.suggestedText}`;
  }
  if (status === "review") {
    return `🟡 REVIEW TEXT | ${cue.suggestedText}`;
  }
  return `⚠ ADD TEXT | ${cue.suggestedText}`;
}

function placementForCue(category, presetPosition, verticalSafeZone) {
  if (presetPosition && presetPosition !== "auto") {
    return verticalSafeZone ? `${presetPosition}-vertical-safe` : presetPosition;
  }

  const base = {
    "Ranking/product intro": "lower-third",
    "Product name": "lower-third",
    Price: "center-lower",
    Warning: "center-lower",
    "Compatibility note": "center-lower",
    Specs: presetPosition === "right-side" ? "right-side" : "lower-third"
  }[category] || presetPosition || "lower-third";

  return verticalSafeZone ? `${base}-vertical-safe` : base;
}

async function applyMarkerMetadata(marker, metadata) {
  if (marker.createSetNameAction) {
    const actions = [
      marker.createSetNameAction(metadata.name),
      marker.createSetCommentsAction?.(metadata.comments),
      marker.createSetColorByIndexAction?.(metadata.colorIndex),
      marker.createSetTypeAction?.("Comment")
    ].filter(Boolean);

    for (const action of actions) {
      if (action?.execute) {
        await action.execute();
      }
    }
    return;
  }

  if ("name" in marker) marker.name = metadata.name;
  if ("comments" in marker) marker.comments = metadata.comments;
  if ("colorIndex" in marker) marker.colorIndex = metadata.colorIndex;
}

function isTextLikeClip(clip) {
  const haystack = [
    clip.name,
    clip.type,
    clip.mediaType,
    clip.projectItem?.name,
    clip.projectItem?.type,
    clip.getName?.()
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /(text|graphic|caption|mogrt|essential graphics)/i.test(haystack);
}

function readClipRange(clip) {
  const startSeconds = premiereTimeToSeconds(clip.start || clip.inPoint || clip.getStart?.());
  const endSeconds = premiereTimeToSeconds(clip.end || clip.outPoint || clip.getEnd?.());
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
    return null;
  }
  return { startSeconds, endSeconds };
}

function getCollectionItems(collection) {
  if (Array.isArray(collection)) {
    return collection;
  }

  const length = collection?.numTracks ?? collection?.numItems ?? collection?.length ?? 0;
  const items = [];
  for (let index = 0; index < length; index += 1) {
    items.push(collection[index] || collection.getTrackAt?.(index) || collection.getItemAt?.(index));
  }
  return items.filter(Boolean);
}

function premiereTimeToSeconds(value) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number(value);
  }
  if (value?.seconds !== undefined) {
    return Number(value.seconds);
  }
  if (value?.ticks !== undefined) {
    return Number(value.ticks) / 254016000000;
  }
  return NaN;
}

function secondsToPremiereTime(seconds) {
  return seconds;
}

function getStableId(object) {
  return object?.id || object?.nodeId || object?.guid || object?.name || null;
}
