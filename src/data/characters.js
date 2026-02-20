// export const CHARACTERS = Array.from({ length: 143 }, (_, i) => i + 1);
export const CHARACTERS = [143, 111, 95, 78, 60, 42, 24];
export const CHARACTERS_INVERSE = Array.from({ length: 143 }, (_, i) => i + 1)
  .filter(n => !CHARACTERS.includes(n));
export const ROW_COLORS = [
  "#FF0000", "#FF1FA8", "#FF3FB7", "#FF5FC6", "#FF7FD5",
  "#FF9FE4", "#FFBFEE", "#FFCFF3", "#FFDFF8", "#FFEFFC",
];

export const ANIMATIONS = [
  // "anim-stretch", "anim-sway",
  "anim-pulse",
  //  "anim-spin",
  // "anim-wiggle", "anim-bounce", "anim-shake"
];
