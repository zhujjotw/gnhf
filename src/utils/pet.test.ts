import { describe, expect, it } from "vitest";
import { getPetPhase, renderPetFrame, selectTerminalPet } from "./pet.js";

describe("terminal pets", () => {
  it("selects from six stable pet slots", () => {
    const ids = new Set(
      Array.from({ length: 6 }, (_, index) => selectTerminalPet(index / 6).id),
    );

    expect(ids.size).toBe(6);
    expect(selectTerminalPet(0).id).toBe("duck");
    expect(selectTerminalPet(0.99).id).toBe("dragon");
  });

  it("walks through hatch phases before idle", () => {
    expect(getPetPhase(0)).toBe("egg");
    expect(getPetPhase(1_200)).toBe("shake1");
    expect(getPetPhase(2_000)).toBe("shake2");
    expect(getPetPhase(2_800)).toBe("crack");
    expect(getPetPhase(4_000)).toBe("hatch");
    expect(getPetPhase(5_500)).toBe("idle");
  });

  it("animates idle frames over time", () => {
    const pet = selectTerminalPet(0.1);

    expect(renderPetFrame(pet, 5_800)).not.toEqual(renderPetFrame(pet, 6_600));
  });

  it("shakes the egg during shake phases", () => {
    const pet = selectTerminalPet(0);
    const frame1 = renderPetFrame(pet, 1_200);
    const frame2 = renderPetFrame(pet, 1_350);
    // Shake shifts the egg horizontally
    expect(frame1).not.toEqual(frame2);
  });

  it("renders larger pet frames (5 lines)", () => {
    const pet = selectTerminalPet(0);
    const frame = renderPetFrame(pet, 6_000);
    expect(frame).toHaveLength(5);
    expect(frame[0]!.length).toBeGreaterThan(6);
  });
});
