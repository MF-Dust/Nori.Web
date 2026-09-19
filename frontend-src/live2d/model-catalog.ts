// Available ARGNori assets from ARGNori.model3.json.
export const NORI_MODEL_EXPRESSIONS = [
  "00_Default",
  "01_KiraKira",
  "02_Dizzy",
  "03_Angry",
  "04_Shy",
  "05_Dark",
  "06_Speechless",
  "07_Smile",
  "08_Tears",
  "09_Troubled",
  "10_Doubt",
  "11_Disgust",
  "12_Serious",
  "13_Happy",
  "Sleep",
  "14_Surprised",
] as const;
export const NORI_MODEL_MOTIONS = {
  Background: 1,
  Idle: 2,
  Reactions: 6,
  Effects: 1,
  Poses: 2,
} as const;
