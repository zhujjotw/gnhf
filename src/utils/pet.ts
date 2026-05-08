export type PetPhase = "egg" | "crack" | "hatch" | "idle";

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
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: ["  __  ", " (o ) ", " /|_| "],
      idle: [
        ["  __  ", ">(o ) ", " /|_| "],
        ["  __  ", ">(- ) ", " /|_| "],
      ],
    },
  },
  {
    id: "cat",
    name: "Cat",
    frames: {
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: [" /\\_/\\", "( o.o)", " > ^ <"],
      idle: [
        [" /\\_/\\", "( o.o)", " > ^ <"],
        [" /\\_/\\", "( -.-)", " > ^ <"],
      ],
    },
  },
  {
    id: "robot",
    name: "Robot",
    frames: {
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: [" [o_o]", " /|_|\\", "  / \\ "],
      idle: [
        [" [o_o]", " /|_|\\", "  / \\ "],
        [" [^_^]", " /|_|\\", "  / \\ "],
      ],
    },
  },
  {
    id: "owl",
    name: "Owl",
    frames: {
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: [" (o,o)", " {   }", "  v v "],
      idle: [
        [" (o,o)", " {   }", "  v v "],
        [" (-,-)", " {   }", "  v v "],
      ],
    },
  },
  {
    id: "turtle",
    name: "Turtle",
    frames: {
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: ["  __  ", " /oo\\_", " \\__/ "],
      idle: [
        ["  __  ", " /oo\\_", " \\__/ "],
        ["  __  ", " /--\\_", " \\__/ "],
      ],
    },
  },
  {
    id: "ghost",
    name: "Ghost",
    frames: {
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: [" .-.", "(o o)", "| O \\"],
      idle: [
        [" .-.", "(o o)", "| O \\"],
        [" .-.", "(- -)", "| O \\"],
      ],
    },
  },
  {
    id: "cactus",
    name: "Cactus",
    frames: {
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: [" \\|/ ", "- o -", " /|\\ "],
      idle: [
        [" \\|/ ", "- o -", " /|\\ "],
        ["  |\\ ", "- o -", " /|  "],
      ],
    },
  },
  {
    id: "mushroom",
    name: "Mushroom",
    frames: {
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: [" .---.", "( o o)", "  |_| "],
      idle: [
        [" .---.", "( o o)", "  |_| "],
        [" .---.", "( - -)", "  |_| "],
      ],
    },
  },
  {
    id: "penguin",
    name: "Penguin",
    frames: {
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: [" (o_o)", " /|_|\\", "  / \\ "],
      idle: [
        [" (o_o)", " /|_|\\", "  / \\ "],
        [" (-_-)", " /|_|\\", "  / \\ "],
      ],
    },
  },
  {
    id: "dragon",
    name: "Dragon",
    frames: {
      egg: ["  __  ", " /  \\ ", " \\__/ "],
      crack: ["  __  ", " /\\/\\ ", " \\__/ "],
      hatch: [" /\\_/\\", "( o>)", " /^^\\"],
      idle: [
        [" /\\_/\\", "( o>)", " /^^\\"],
        [" /\\_/\\", "( ^>)", " /^^\\"],
      ],
    },
  },
] as const satisfies readonly TerminalPet[];

export function selectTerminalPet(seed = Math.random()): TerminalPet {
  const normalized = Number.isFinite(seed) ? Math.abs(seed) % 1 : 0;
  return PETS[Math.floor(normalized * PETS.length)]!;
}

export function getPetPhase(elapsedMs: number): PetPhase {
  if (elapsedMs < 1_500) return "egg";
  if (elapsedMs < 3_000) return "crack";
  if (elapsedMs < 4_500) return "hatch";
  return "idle";
}

export function renderPetFrame(pet: TerminalPet, elapsedMs: number): string[] {
  const phase = getPetPhase(elapsedMs);
  if (phase !== "idle") return pet.frames[phase];

  const frames = pet.frames.idle;
  const index = Math.floor(elapsedMs / 800) % frames.length;
  return frames[index]!;
}
