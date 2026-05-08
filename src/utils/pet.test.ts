import { describe, expect, it } from "vitest";
import { getPetPhase, renderPetFrame, selectTerminalPet } from "./pet.js";

describe("terminal pets", () => {
  it("selects from ten stable pet slots", () => {
    const ids = new Set(
      Array.from(
        { length: 10 },
        (_, index) => selectTerminalPet(index / 10).id,
      ),
    );

    expect(ids.size).toBe(10);
    expect(selectTerminalPet(0).id).toBe("duck");
    expect(selectTerminalPet(0.99).id).toBe("dragon");
  });

  it("walks through hatch phases before idle", () => {
    expect(getPetPhase(0)).toBe("egg");
    expect(getPetPhase(1_500)).toBe("crack");
    expect(getPetPhase(3_000)).toBe("hatch");
    expect(getPetPhase(4_500)).toBe("idle");
  });

  it("animates idle frames over time", () => {
    const pet = selectTerminalPet(0.1);

    expect(renderPetFrame(pet, 4_800)).not.toEqual(renderPetFrame(pet, 5_600));
  });
});
