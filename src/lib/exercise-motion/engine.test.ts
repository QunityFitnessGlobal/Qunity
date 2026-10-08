import { describe, expect, it } from "vitest";
import { clipAt, drawFrame, loopLength, poseAt, solvePose, LIMB_LENGTHS, type Clip, type Joints, type Pt } from "@/lib/exercise-motion/engine";
import { EXERCISE_MOTIONS, motionFor } from "@/lib/exercise-motion/library";

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("solvePose", () => {
  it("keeps arms and legs their length, wherever the hands and feet go", () => {
    const pose = (handA: Pt, footA: Pt): Joints =>
      solvePose({ hip: [160, 101], lean: 20, footA, handA }, "side");
    for (const [hand, foot] of [
      [[130, 100], [150, 160]],
      [[170, 120], [175, 150]],
      [[150, 70], [140, 168]],
    ] as [Pt, Pt][]) {
      const j = pose(hand, foot);
      expect(dist(j.N, j.Ea)).toBeCloseTo(LIMB_LENGTHS.upper, 1);
      expect(dist(j.Ea, j.Wa)).toBeCloseTo(LIMB_LENGTHS.fore, 1);
      expect(dist(j.P, j.Ka)).toBeCloseTo(LIMB_LENGTHS.thigh, 1);
      expect(dist(j.Ka, j.Fa)).toBeCloseTo(LIMB_LENGTHS.shin, 1);
    }
  });

  it("stops a limb short when its target is out of reach", () => {
    const j = solvePose({ hip: [160, 101], footA: [160, 400], handA: [160, 59] }, "side");
    expect(dist(j.P, j.Fa)).toBeLessThan(LIMB_LENGTHS.thigh + LIMB_LENGTHS.shin);
  });
});

describe("the approved exercise motions", () => {
  it("are keyed by exercise id", () => {
    expect(motionFor("SQ01")).not.toBeNull();
    expect(motionFor("PL01")).toBeNull();
    expect(motionFor("nope")).toBeNull();
  });

  for (const [id, motion] of Object.entries(EXERCISE_MOTIONS)) {
    it(`${id} draws every moment of its loop`, () => {
      const loop = loopLength(motion);
      for (let i = 0; i < 40; i++) {
        for (const angle of ["main", "alt"] as const) {
          if (angle === "alt" && !motion.alt) continue;
          const frame = drawFrame(motion, { ms: (loop * i) / 40, angle });
          expect(frame.layers.length).toBeGreaterThan(5);
          for (const l of frame.layers) expect(l.d).not.toMatch(/NaN|Infinity/);
          expect(frame.transform).not.toMatch(/NaN|Infinity/);
        }
      }
      const thumb = drawFrame(motion, { ms: 0, variant: "thumb" });
      expect(thumb.transform).not.toMatch(/NaN|Infinity/);
    });
  }

  it("plays a sequence's parts in turn (two reps from the side, then from the front)", () => {
    const motion = EXERCISE_MOTIONS.PU07;
    expect(clipAt(motion, "main", 100).clip.angle).toBe("side");
    expect(clipAt(motion, "main", 6500).clip.angle).toBe("front");
    expect(clipAt(motion, "main", loopLength(motion) + 100).clip.angle).toBe("side");
  });

  it("lifts the body off the floor in a hop", () => {
    const hop = EXERCISE_MOTIONS.MV04.main as Clip;
    const { dy } = poseAt(hop, hop.dur / 4);
    expect(dy).toBeLessThan(0);
  });
});
