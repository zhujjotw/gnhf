export type PetPhase = "egg" | "shake1" | "shake2" | "crack" | "hatch" | "idle";

export interface TerminalPet {
  id: string;
  name: string;
  frames: {
    egg: string[];
    crack: string[];
    hatch: string[];
    idle: string[][];
  };
}

const PETS = [
  {
    id: "duck",
    name: "Duck",
    frames: {
      egg: [
        "    ____    ",
        "   /    \\   ",
        "  |      |  ",
        "  |      |  ",
        "   \\____/   ",
      ],
      crack: [
        "    ____    ",
        "   / /\\ \\   ",
        "  | /  \\ |  ",
        "  |/    \\|  ",
        "   \\____/   ",
      ],
      hatch: [
        "     __     ",
        "   >(o )    ",
        "    /|_|    ",
        "   / / \\    ",
        "  (__/ \\_)  ",
      ],
      idle: [
        [
          "     __     ",
          "   >(o )    ",
          "    /|_|    ",
          "   / / \\    ",
          "  (__/ \\_)  ",
        ],
        [
          "     __     ",
          "   >(- )    ",
          "    /|_|    ",
          "   / / \\    ",
          "  (__/ \\_)  ",
        ],
      ],
    },
  },
  {
    id: "cat",
    name: "Cat",
    frames: {
      egg: [
        "    ____    ",
        "   /    \\   ",
        "  |      |  ",
        "  |      |  ",
        "   \\____/   ",
      ],
      crack: [
        "    ____    ",
        "   / /\\ \\   ",
        "  | /  \\ |  ",
        "  |/    \\|  ",
        "   \\____/   ",
      ],
      hatch: [
        "   /\\_/\\    ",
        "  / o.o \\   ",
        " (  > <  )  ",
        "  \\_____/   ",
        "   |   |    ",
      ],
      idle: [
        [
          "   /\\_/\\    ",
          "  / o.o \\   ",
          " (  > <  )  ",
          "  \\_____/   ",
          "   |   |    ",
        ],
        [
          "   /\\_/\\    ",
          "  / -.- \\   ",
          " (  > <  )  ",
          "  \\_____/   ",
          "   |   |    ",
        ],
      ],
    },
  },
  {
    id: "robot",
    name: "Robot",
    frames: {
      egg: [
        "    ____    ",
        "   /    \\   ",
        "  |      |  ",
        "  |      |  ",
        "   \\____/   ",
      ],
      crack: [
        "    ____    ",
        "   / /\\ \\   ",
        "  | /  \\ |  ",
        "  |/    \\|  ",
        "   \\____/   ",
      ],
      hatch: [
        "   [o_o]    ",
        "  /|====|\\  ",
        "   |    |   ",
        "   |____|   ",
        "   /    \\   ",
      ],
      idle: [
        [
          "   [o_o]    ",
          "  /|====|\\  ",
          "   |    |   ",
          "   |____|   ",
          "   /    \\   ",
        ],
        [
          "   [^_^]    ",
          "  /|====|\\  ",
          "   |    |   ",
          "   |____|   ",
          "   /    \\   ",
        ],
      ],
    },
  },
  {
    id: "owl",
    name: "Owl",
    frames: {
      egg: [
        "    ____    ",
        "   /    \\   ",
        "  |      |  ",
        "  |      |  ",
        "   \\____/   ",
      ],
      crack: [
        "    ____    ",
        "   / /\\ \\   ",
        "  | /  \\ |  ",
        "  |/    \\|  ",
        "   \\____/   ",
      ],
      hatch: [
        "   (o,o)    ",
        "  /{    }\\  ",
        "  | {  } |  ",
        "   \\{__}/   ",
        "    v  v    ",
      ],
      idle: [
        [
          "   (o,o)    ",
          "  /{    }\\  ",
          "  | {  } |  ",
          "   \\{__}/   ",
          "    v  v    ",
        ],
        [
          "   (-,-)    ",
          "  /{    }\\  ",
          "  | {  } |  ",
          "   \\{__}/   ",
          "    v  v    ",
        ],
      ],
    },
  },
  {
    id: "penguin",
    name: "Penguin",
    frames: {
      egg: [
        "    ____    ",
        "   /    \\   ",
        "  |      |  ",
        "  |      |  ",
        "   \\____/   ",
      ],
      crack: [
        "    ____    ",
        "   / /\\ \\   ",
        "  | /  \\ |  ",
        "  |/    \\|  ",
        "   \\____/   ",
      ],
      hatch: [
        "    (o_o)   ",
        "   /|    |  ",
        "  / |    |  ",
        "  \\_|____|  ",
        "    /    \\  ",
      ],
      idle: [
        [
          "    (o_o)   ",
          "   /|    |  ",
          "  / |    |  ",
          "  \\_|____|  ",
          "    /    \\  ",
        ],
        [
          "    (-_-)   ",
          "   /|    |  ",
          "  / |    |  ",
          "  \\_|____|  ",
          "    /    \\  ",
        ],
      ],
    },
  },
  {
    id: "dragon",
    name: "Dragon",
    frames: {
      egg: [
        "    ____    ",
        "   /    \\   ",
        "  |      |  ",
        "  |      |  ",
        "   \\____/   ",
      ],
      crack: [
        "    ____    ",
        "   / /\\ \\   ",
        "  | /  \\ |  ",
        "  |/    \\|  ",
        "   \\____/   ",
      ],
      hatch: [
        "   /\\_/\\    ",
        "  ( o> )    ",
        "  /|^^|\\    ",
        " / |  | \\   ",
        "(__/  \\__)  ",
      ],
      idle: [
        [
          "   /\\_/\\    ",
          "  ( o> )    ",
          "  /|^^|\\    ",
          " / |  | \\   ",
          "(__/  \\__)  ",
        ],
        [
          "   /\\_/\\    ",
          "  ( ^> )    ",
          "  /|^^|\\    ",
          " / |  | \\   ",
          "(__/  \\__)  ",
        ],
      ],
    },
  },
] as const satisfies readonly TerminalPet[];

const HATCH_SPARKLES = [
  [
    "  *   . *   ",
    "    . * .   ",
    " *    .  *  ",
    "  .  *   .  ",
    "   *  . *   ",
  ],
  [
    " .  *    .  ",
    "   *  . *   ",
    "  .   *  .  ",
    " *  .   *   ",
    "    .  *    ",
  ],
  [
    "   .  *  .  ",
    " *   .  *   ",
    "    *  .    ",
    "  .  *  .   ",
    " *    .  *  ",
  ],
] as const;

export function selectTerminalPet(seed = Math.random()): TerminalPet {
  const normalized = Number.isFinite(seed) ? Math.abs(seed) % 1 : 0;
  return PETS[Math.floor(normalized * PETS.length)]!;
}

export function getPetPhase(elapsedMs: number): PetPhase {
  if (elapsedMs < 1_200) return "egg";
  if (elapsedMs < 2_000) return "shake1";
  if (elapsedMs < 2_800) return "shake2";
  if (elapsedMs < 4_000) return "crack";
  if (elapsedMs < 5_500) return "hatch";
  return "idle";
}

export function renderPetFrame(pet: TerminalPet, elapsedMs: number): string[] {
  const phase = getPetPhase(elapsedMs);

  if (phase === "egg") {
    return pet.frames.egg;
  }

  if (phase === "shake1" || phase === "shake2") {
    const shakeOffset = Math.floor(elapsedMs / 150) % 3;
    const base = pet.frames.egg;
    if (shakeOffset === 1) {
      return base.map((line) => " " + line.slice(0, -1));
    }
    if (shakeOffset === 2) {
      return base.map((line) => line.slice(1) + " ");
    }
    return base;
  }

  if (phase === "crack") {
    const sparkleIdx = Math.floor(elapsedMs / 300) % HATCH_SPARKLES.length;
    const sparkle = HATCH_SPARKLES[sparkleIdx]!;
    const crack = pet.frames.crack;
    return crack.map((line, i) => {
      const sp = sparkle[i] ?? "";
      const merged = line
        .split("")
        .map((ch, ci) => {
          const spCh = sp[ci];
          if (spCh && spCh !== " " && ch === " ") return spCh;
          return ch;
        })
        .join("");
      return merged;
    });
  }

  if (phase === "hatch") {
    const sparkleIdx = Math.floor(elapsedMs / 200) % HATCH_SPARKLES.length;
    const sparkle = HATCH_SPARKLES[sparkleIdx]!;
    const hatch = pet.frames.hatch;
    return hatch.map((line, i) => {
      const sp = sparkle[i] ?? "";
      const merged = line
        .split("")
        .map((ch, ci) => {
          const spCh = sp[ci];
          if (spCh && spCh !== " " && ch === " ") return spCh;
          return ch;
        })
        .join("");
      return merged;
    });
  }

  const frames = pet.frames.idle;
  const index = Math.floor(elapsedMs / 800) % frames.length;
  return [...frames[index]!];
}
