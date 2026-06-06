export const DEFAULT_SETTINGS = {
  textMode: "balanced",
  contentType: "Product Review",
  stylePreset: "Product Review",
  avoidDuplicates: true,
  addMarkersAfterText: true,
  textDuration: 2.5,
  verticalSafeZone: false,
  duplicateToleranceBefore: 1,
  duplicateToleranceAfter: 2.5
};

export const STYLE_PRESETS = {
  "Minimal Clean": {
    fontSize: 62,
    fontFamily: "Arial",
    fillColor: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 0,
    backgroundColor: "transparent",
    position: "lower-third"
  },
  "Bold YouTube": {
    fontSize: 82,
    fontFamily: "Arial Black",
    fillColor: "#ffffff",
    strokeColor: "#111111",
    strokeWidth: 8,
    backgroundColor: "#ff3131",
    position: "lower-third"
  },
  "Product Review": {
    fontSize: 68,
    fontFamily: "Arial",
    fillColor: "#ffffff",
    strokeColor: "#101010",
    strokeWidth: 5,
    backgroundColor: "#1f7ae0",
    position: "lower-third"
  },
  "Tech Review": {
    fontSize: 64,
    fontFamily: "Arial",
    fillColor: "#f6fbff",
    strokeColor: "#0d2436",
    strokeWidth: 4,
    backgroundColor: "#00a6a6",
    position: "right-side"
  },
  "Top 10 Style": {
    fontSize: 76,
    fontFamily: "Arial Black",
    fillColor: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 6,
    backgroundColor: "#f05a28",
    position: "lower-third"
  },
  "Shorts/Reels Style": {
    fontSize: 88,
    fontFamily: "Arial Black",
    fillColor: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 7,
    backgroundColor: "transparent",
    position: "center-lower"
  }
};

export function readSettingsFromDom(documentRef = document) {
  return {
    textMode: documentRef.getElementById("textMode").value,
    contentType: documentRef.getElementById("contentType").value,
    stylePreset: documentRef.getElementById("stylePreset").value,
    avoidDuplicates: documentRef.getElementById("avoidDuplicates").checked,
    addMarkersAfterText: documentRef.getElementById("addMarkersAfterText").checked,
    textDuration: Number(documentRef.getElementById("textDuration").value) || DEFAULT_SETTINGS.textDuration,
    verticalSafeZone: documentRef.getElementById("verticalSafeZone").checked,
    duplicateToleranceBefore: DEFAULT_SETTINGS.duplicateToleranceBefore,
    duplicateToleranceAfter: DEFAULT_SETTINGS.duplicateToleranceAfter
  };
}
