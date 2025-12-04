// Mapping of color options to penguin model files
export interface PenguinColorOption {
  name: string;
  hex: string;
  modelFile: string;
  previewImage: string;
}

export const PENGUIN_COLORS: PenguinColorOption[] = [
  // Row 1
  { name: "Cyan", hex: "#00BCD4", modelFile: "wAddleCYAN.glb", previewImage: "/penguin-previews/cyan.png" },
  { name: "Navy", hex: "#1A237E", modelFile: "wAddleNAVY.glb", previewImage: "/penguin-previews/navy.png" },
  { name: "Green", hex: "#4CAF50", modelFile: "wAddleGREEN.glb", previewImage: "/penguin-previews/green.png" },
  { name: "Salmon", hex: "#FF6B6B", modelFile: "wAddleSALMON.glb", previewImage: "/penguin-previews/salmon.png" },
  { name: "Yellow", hex: "#FFD700", modelFile: "wAddleYELLOW.glb", previewImage: "/penguin-previews/yellow.png" },
  // Row 2
  { name: "Purple", hex: "#9C27B0", modelFile: "wAddlePURP.glb", previewImage: "/penguin-previews/purple.png" },
  { name: "Forest", hex: "#2E7D32", modelFile: "wAddleFORREST.glb", previewImage: "/penguin-previews/forrest.png" },
  { name: "Orange", hex: "#FF6F00", modelFile: "wAddleORANGE.glb", previewImage: "/penguin-previews/orange.png" },
  { name: "Black", hex: "#424242", modelFile: "wAddleBLACK.glb", previewImage: "/penguin-previews/black.png" },
  { name: "Baby Blue", hex: "#03A9F4", modelFile: "wAddleBABYBL.glb", previewImage: "/penguin-previews/blue.png" },
  // Row 3
  { name: "Lime", hex: "#CDDC39", modelFile: "wAddleLIME.glb", previewImage: "/penguin-previews/lime.png" },
  { name: "Brown", hex: "#795548", modelFile: "wAddleBROWN.glb", previewImage: "/penguin-previews/brown.png" },
  { name: "Hot Pink", hex: "#FF1493", modelFile: "wAddlePINK.glb", previewImage: "/penguin-previews/hotpink.png" },
  { name: "Red", hex: "#EF4444", modelFile: "wAddleRED.glb", previewImage: "/penguin-previews/redd.png" },
  { name: "Light Purple", hex: "#CE93D8", modelFile: "wAddleLIGHTPURP.glb", previewImage: "/penguin-previews/lightpurplee.png" }
];

// Helper function to get model file from hex color
export function getModelFileFromHex(hex: string): string {
  const color = PENGUIN_COLORS.find(c => c.hex.toUpperCase() === hex.toUpperCase());
  return color ? color.modelFile : "wAddleCYAN.glb"; // Default to cyan
}

// Helper function to get model file from model name
export function getModelFileFromName(name: string): string {
  const color = PENGUIN_COLORS.find(c => c.modelFile === name);
  return color ? color.modelFile : "wAddleCYAN.glb"; // Default to cyan
}