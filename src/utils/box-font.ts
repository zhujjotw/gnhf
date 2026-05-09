const FONT: Record<string, [string, string, string]> = {
  A: ["┏━┓", "┣━┫", "╹ ╹"],
  B: ["┏━┓", "┣━┫", "┗━┛"],
  C: ["┏━╸", "┃  ", "┗━╸"],
  D: ["╺┳┓", " ┃┃", "╺┻┛"],
  E: ["┏━╸", "┣╸ ", "┗━╸"],
  F: ["┏━╸", "┣╸ ", "╹  "],
  G: ["┏━╸", "┃╺┓", "┗━┛"],
  H: ["╻ ╻", "┣━┫", "╹ ╹"],
  I: ["╻", "┃", "╹"],
  J: ["  ╻", "  ┃", "┗━┛"],
  K: ["╻┏╸", "┣┛ ", "╹┗╸"],
  L: ["╻  ", "┃  ", "┗━╸"],
  M: ["┏┳┓", "┃╹┃", "╹ ╹"],
  N: ["┏┓╻", "┃┗┫", "╹ ╹"],
  O: ["┏━┓", "┃ ┃", "┗━┛"],
  P: ["┏━┓", "┣━┛", "╹  "],
  Q: ["┏━┓", "┃╻┃", "┗┻┛"],
  R: ["┏━┓", "┣┳┛", "╹┗╸"],
  S: ["┏━╸", "┗━┓", "╺━┛"],
  T: ["╺┳╸", " ┃ ", " ╹ "],
  U: ["╻ ╻", "┃ ┃", "┗━┛"],
  V: ["╻ ╻", "┃┏┛", "┗┛ "],
  W: ["╻ ╻", "┃╻┃", "┗┻┛"],
  X: ["╻ ╻", " ╳ ", "╹ ╹"],
  Y: ["╻ ╻", "┗┳┛", " ╹ "],
  Z: ["╺━┓", "┏━┛", "┗━╸"],
  " ": ["   ", "   ", "   "],
  ".": [" ", " ", "╹"],
  ",": [" ", " ", "╸"],
};

function charWidth(ch: string): number {
  const glyph = FONT[ch];
  if (!glyph) return 0;
  return glyph[0].length;
}

export function textToArtWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    w += charWidth(ch);
  }
  return w;
}

export function renderTextAsArt(
  text: string,
  maxWidth: number,
): [string, string, string][] {
  const upper = text.toUpperCase();
  const words = upper.split(" ");
  const lines: [string, string, string][] = [];
  let current: [string, string, string] = ["", "", ""];
  let currentWidth = 0;

  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi]!;
    let wordWidth = 0;
    for (const ch of word) wordWidth += charWidth(ch);

    const spaceWidth = charWidth(" ");
    const neededWidth =
      currentWidth === 0 ? wordWidth : spaceWidth + wordWidth;

    if (currentWidth > 0 && currentWidth + neededWidth > maxWidth) {
      lines.push(current);
      current = ["", "", ""];
      currentWidth = 0;
    }

    if (currentWidth > 0) {
      const spaceGlyph = FONT[" "]!;
      current[0] += spaceGlyph[0];
      current[1] += spaceGlyph[1];
      current[2] += spaceGlyph[2];
      currentWidth += spaceWidth;
    }

    for (const ch of word) {
      const glyph = FONT[ch];
      if (!glyph) continue;
      current[0] += glyph[0];
      current[1] += glyph[1];
      current[2] += glyph[2];
      currentWidth += glyph[0].length;
    }
  }

  if (currentWidth > 0) {
    lines.push(current);
  }

  return lines;
}
