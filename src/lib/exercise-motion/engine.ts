// The animated demo for an exercise: a flat figure whose every key moment is
// described by a few numbers (where the hips are, how far the body leans,
// where the hands and feet go). Elbows and knees are worked out with two-bone
// IK, so arms and legs keep their length while the figure moves. A frame is
// drawn into a fixed 320x180 (16:9) picture, or a 100x100 thumbnail.

export type Pt = readonly [number, number];
type MutPt = [number, number];

export type JointName =
  | "H" | "N" | "P"
  | "Sa" | "Sb" | "Ha" | "Hb"
  | "Ea" | "Eb" | "Wa" | "Wb"
  | "Ka" | "Kb" | "Fa" | "Fb" | "Ta" | "Tb";
export type Joints = Record<JointName, Pt>;

// One key moment. Side views face left: lean 0 is upright, 90 is lying with
// the head to the left. "a" limbs are the near ones (drawn dark), "b" the far
// ones (drawn light); in a front view "a" is the figure's left on screen.
export interface PoseSpec {
  hip: Pt;
  lean?: number;
  // Extra tilt of the head on top of the lean.
  head?: number;
  // Torso length as a share of full (a torso pointing at the camera is short).
  tl?: number;
  // Front view: half the shoulder width and hip width (negative swaps sides).
  shw?: number;
  hipw?: number;
  // Side view: how far the far limbs sit from the near ones when not given.
  off?: Pt;
  footA: Pt;
  footB?: Pt;
  handA: Pt;
  handB?: Pt;
  // Which way a knee or elbow bends (a direction), or exactly where it is
  // (a point — for a limb pointing at the camera, drawn foreshortened).
  kneeA?: Pt;
  kneeB?: Pt;
  elbowA?: Pt;
  elbowB?: Pt;
  kneePtA?: Pt;
  kneePtB?: Pt;
  elbowPtA?: Pt;
  elbowPtB?: Pt;
  // Foot direction in degrees (0 = pointing right, 90 = down).
  toeA?: number;
  toeB?: number;
}

// The diagonal view poses the figure in 3D: x along the floor, y up, z away
// from the camera. "a" is the figure's left side.
export type Pt3 = readonly [number, number, number];
export interface PoseSpec3 {
  hip: Pt3;
  // Direction from the hips to the neck, of the head, and from the left
  // shoulder to the right (the body's width).
  torso?: Pt3;
  headDir?: Pt3;
  side?: Pt3;
  tl?: number;
  shw?: number;
  hipw?: number;
  footA: Pt3;
  footB: Pt3;
  handA: Pt3;
  handB: Pt3;
  kneeA?: Pt3;
  kneeB?: Pt3;
  elbowA?: Pt3;
  elbowB?: Pt3;
  kneePtA?: Pt3;
  kneePtB?: Pt3;
  elbowPtA?: Pt3;
  elbowPtB?: Pt3;
  toeA?: Pt3;
  toeB?: Pt3;
}

export type CameraAngle = "side" | "front" | "above" | "diagonal" | "back";
// A body position the camera can't show by itself (a badge in the corner).
export type BodyPosition = "belly";
export type PrintLabel = "hipWidth" | "together" | "wide" | "slightlyApart" | "shoulderWidth" | "close";

// The "where your feet (or hands) go" map shown in the corner of the video.
export interface Prints {
  kind: "feet" | "hands";
  gap: number;
  turn: number;
  label: PrintLabel;
}

type Box = Pt[];
export type Prop =
  | { type: "wall"; x: number; w: number; box?: Box }
  | { type: "table"; x1: number; x2: number; y: number; box?: Box }
  // The dashed "invisible chair", fading in as the hips go down (y0 -> y1).
  | { type: "chair"; x1: number; x2: number; y: number; y0: number; y1: number; box?: Box }
  // A ball on the floor, carried by the hands during the `hold` part of a loop.
  | { type: "ball"; at: Pt; hold: readonly [number, number]; layer?: "front"; box?: Box }
  // A gold ring on the joint a hand touches, during each `when` window.
  | { type: "touch"; at: readonly JointName[]; when: readonly (readonly [number, number])[]; layer?: "front" }
  // Floor marks that slide by when the exercise travels (the figure stays in
  // the middle). Without from/to the floor moves evenly the whole loop.
  | { type: "travel"; dist: number; from?: number; to?: number; axis?: "y"; x1?: number; x2?: number }
  // Seen from above: the floor fills the frame (optionally with a mat).
  | { type: "topdown"; x?: number; y1?: number; y2?: number; w?: number; box?: Box }
  // Diagonal view: the floor fills the frame, with a mat (or a lighter
  // patch of floor, `mat: false`) lying on it.
  | { type: "mat3"; x1: number; x2: number; z1: number; z2: number; mat?: boolean }
  // Seen from behind, facing a wall: the wall fills the background.
  | { type: "wallback" };

interface ClipBase {
  // Which solver poses the figure; `look: "side"` draws a front-solved
  // figure with side-view colours (a body turning into a side plank).
  view: "side" | "front" | "oblique";
  look?: "side";
  angle: CameraAngle;
  dur: number;
  keys: readonly (readonly [number, string])[];
  // Even pace between key moments (walking) instead of easing in and out.
  linear?: boolean;
  // Small hop: the whole body rises this much twice per loop.
  bounce?: number;
  mat?: boolean;
  props?: readonly Prop[];
  prints?: Prints;
  position?: BodyPosition;
  // Where in the loop the still thumbnail is taken (0-1).
  thumbT?: number;
}
export interface SpecClip extends ClipBase {
  kind: "spec";
  poses: Readonly<Record<string, PoseSpec>>;
}
// Posed in 3D and drawn from a diagonal (3/4) angle.
export interface ObliqueClip extends ClipBase {
  kind: "oblique";
  poses: Readonly<Record<string, PoseSpec3>>;
}
// The first hand-drawn clips: joints given directly, with their own framing.
export interface RawClip extends ClipBase {
  kind: "raw";
  poses: Readonly<Record<string, Joints>>;
  cam: readonly [number, number, number];
  shadow: readonly [number, number];
  thumbBox: readonly [number, number, number];
}
export type Clip = SpecClip | ObliqueClip | RawClip;

export interface ExerciseMotion {
  // One clip, or parts played one after another (two reps from the side,
  // then two from the front).
  main: Clip | readonly Clip[];
  // A second camera angle, offered on the pre-workout screen.
  alt?: Clip;
}

export interface Layer {
  d: string;
  fill: string;
  stroke: string;
  width: number;
  opacity: number;
  dash: string;
}

export interface MotionFrame {
  // SVG transform from figure space into the 320x180 (or 100x100) picture.
  transform: string;
  layers: Layer[];
  shadow: { cx: number; rx: number } | null;
  mat: boolean;
  angle: CameraAngle;
  prints: { kind: "feet" | "hands"; label: PrintLabel; a: string; b: string } | null;
  position: BodyPosition | null;
}

const LN = { neck: 16, torso: 42, upper: 24, fore: 22, thigh: 34, shin: 33, foot: 9 };
const RAD = Math.PI / 180;
const FLOOR = 172;
const INK = "#3d2f5c";
const FAR = "#b9aad3";
// Far limbs in the diagonal view (a little darker: they cross more of the body).
const FAR_DIAGONAL = "#9d8bc0";
const SHIRT = "#a32894";

const add = (a: Pt, b: Pt): MutPt => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Pt, b: Pt): MutPt => [a[0] - b[0], a[1] - b[1]];
const mul = (a: Pt, k: number): MutPt => [a[0] * k, a[1] * k];
const unit = (a: Pt): MutPt => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
// Direction for an angle in degrees: 0 = up, positive = toward -x (forward
// for a figure facing left).
const dir = (deg: number): MutPt => [-Math.sin(deg * RAD), -Math.cos(deg * RAD)];

// The middle joint of a two-bone limb from `root` toward `target`, bent to
// the side `hint` points to; also where the limb's end lands (short of the
// target when it is out of reach).
function ik(root: Pt, target: Pt, l1: number, l2: number, hint: Pt): [MutPt, MutPt] {
  const d = sub(target, root);
  const dist = Math.min(Math.max(Math.hypot(d[0], d[1]), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const u = unit(d);
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const base = add(root, mul(u, a));
  const n: Pt = [-u[1], u[0]];
  const j1 = add(base, mul(n, h));
  const j2 = add(base, mul(n, -h));
  const score = (j: Pt) => (j[0] - base[0]) * hint[0] + (j[1] - base[1]) * hint[1];
  return [score(j1) >= score(j2) ? j1 : j2, add(root, mul(u, dist))];
}

function limb(root: Pt, target: Pt, l1: number, l2: number, hint: Pt, mid?: Pt): [MutPt, MutPt] {
  return mid ? [[mid[0], mid[1]], [target[0], target[1]]] : ik(root, target, l1, l2, hint);
}

const toe = (ankle: Pt, deg: number): MutPt => add(ankle, [Math.cos(deg * RAD) * LN.foot, Math.sin(deg * RAD) * LN.foot]);

export function solvePose(s: PoseSpec, view: "side" | "front"): Joints {
  const lean = s.lean ?? 0;
  const P = s.hip;
  const N = add(P, mul(dir(lean), LN.torso * (s.tl ?? 1)));
  const H = add(N, mul(dir(lean + (s.head ?? 0)), LN.neck));
  if (view === "front") {
    const across: Pt = [Math.cos(lean * RAD), -Math.sin(lean * RAD)];
    const sw = s.shw ?? 13;
    const hw = s.hipw ?? 9;
    const Sa = add(N, add(mul(across, -sw), [0, 2]));
    const Sb = add(N, add(mul(across, sw), [0, 2]));
    const Ha = add(P, mul(across, -hw));
    const Hb = add(P, mul(across, hw));
    const [Ka, Fa] = limb(Ha, s.footA, LN.thigh, LN.shin, s.kneeA ?? [-1, 0], s.kneePtA);
    const [Kb, Fb] = limb(Hb, s.footB ?? s.footA, LN.thigh, LN.shin, s.kneeB ?? [1, 0], s.kneePtB);
    const [Ea, Wa] = limb(Sa, s.handA, LN.upper, LN.fore, s.elbowA ?? [-1, 0.4], s.elbowPtA);
    const [Eb, Wb] = limb(Sb, s.handB ?? s.handA, LN.upper, LN.fore, s.elbowB ?? [1, 0.4], s.elbowPtB);
    return {
      H, N, P, Sa, Sb, Ha, Hb, Ea, Eb, Wa, Wb, Ka, Kb, Fa, Fb,
      Ta: toe(Fa, s.toeA ?? 160),
      Tb: toe(Fb, s.toeB ?? 20),
    };
  }
  const off = s.off ?? [5, -2];
  const footB = s.footB ?? add(s.footA, off);
  const handB = s.handB ?? add(s.handA, off);
  const [Ka, Fa] = limb(P, s.footA, LN.thigh, LN.shin, s.kneeA ?? [-1, 0], s.kneePtA);
  const [Kb, Fb] = limb(P, footB, LN.thigh, LN.shin, s.kneeB ?? s.kneeA ?? [-1, 0], s.kneePtB);
  const [Ea, Wa] = limb(N, s.handA, LN.upper, LN.fore, s.elbowA ?? [1, 0.4], s.elbowPtA);
  const [Eb, Wb] = limb(N, handB, LN.upper, LN.fore, s.elbowB ?? s.elbowA ?? [1, 0.4], s.elbowPtB);
  const toeA = s.toeA ?? 165;
  return {
    H, N, P, Sa: N, Sb: N, Ha: P, Hb: P, Ea, Eb, Wa, Wb, Ka, Kb, Fa, Fb,
    Ta: toe(Fa, toeA),
    Tb: toe(Fb, s.toeB ?? toeA),
  };
}

// ---- The diagonal (3/4) view: poses in 3D, drawn with an oblique
// projection (depth goes up and to the right), so a body lying on the floor
// shows its width — wings opening, an elbow crossing to the other knee.
type V3 = [number, number, number];
const add3 = (a: Pt3, b: Pt3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a: Pt3, b: Pt3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a: Pt3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const len3 = (a: Pt3) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a: Pt3): V3 => mul3(a, 1 / (len3(a) || 1));

const project = (q: Pt3): MutPt => [q[0] + 0.72 * q[2], FLOOR - q[1] - 0.42 * q[2]];

function ik3(root: Pt3, target: Pt3, l1: number, l2: number, hint: Pt3): [V3, V3] {
  const d = sub3(target, root);
  const dist = Math.min(Math.max(len3(d), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const u = unit3(d);
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // The bend goes toward the part of `hint` that isn't along the limb.
  let n = sub3(hint, mul3(u, hint[0] * u[0] + hint[1] * u[1] + hint[2] * u[2]));
  if (len3(n) < 1e-6) n = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  return [add3(add3(root, mul3(u, a)), mul3(unit3(n), h)), add3(root, mul3(u, dist))];
}

function solveOblique(s: PoseSpec3): { joints: Joints; depth: Record<JointName, number> } {
  const limb = (root: Pt3, target: Pt3, l1: number, l2: number, hint: Pt3, mid?: Pt3): [Pt3, Pt3] =>
    mid ? [mid, target] : ik3(root, target, l1, l2, hint);
  const P = s.hip;
  const td = unit3(s.torso ?? [-1, 0, 0]);
  const N = add3(P, mul3(td, LN.torso * (s.tl ?? 1)));
  const W = unit3(s.side ?? [0, 0, 1]);
  const H = add3(N, mul3(unit3(s.headDir ?? add3(td, [0, 0.25, 0])), LN.neck));
  const sw = s.shw ?? 13;
  const hw = s.hipw ?? 9;
  const Sa = add3(N, mul3(W, -sw));
  const Sb = add3(N, mul3(W, sw));
  const Ha = add3(P, mul3(W, -hw));
  const Hb = add3(P, mul3(W, hw));
  const [Ka, Fa] = limb(Ha, s.footA, LN.thigh, LN.shin, s.kneeA ?? [0, 1, 0], s.kneePtA);
  const [Kb, Fb] = limb(Hb, s.footB, LN.thigh, LN.shin, s.kneeB ?? s.kneeA ?? [0, 1, 0], s.kneePtB);
  const [Ea, Wa] = limb(Sa, s.handA, LN.upper, LN.fore, s.elbowA ?? [0, -1, 0], s.elbowPtA);
  const [Eb, Wb] = limb(Sb, s.handB, LN.upper, LN.fore, s.elbowB ?? s.elbowA ?? [0, -1, 0], s.elbowPtB);
  const toeDir = s.toeA ?? [1, -0.2, 0];
  const Ta = add3(Fa, mul3(unit3(toeDir), LN.foot));
  const Tb = add3(Fb, mul3(unit3(s.toeB ?? toeDir), LN.foot));
  const j3: Record<JointName, Pt3> = { H, N, P, Sa, Sb, Ha, Hb, Ea, Eb, Wa, Wb, Ka, Kb, Fa, Fb, Ta, Tb };
  const joints = {} as Joints;
  const depth = {} as Record<JointName, number>;
  (Object.keys(j3) as JointName[]).forEach((k) => {
    joints[k] = project(j3[k]);
    depth[k] = j3[k][2];
  });
  return { joints, depth };
}

// The corners of a mat lying on the floor, as drawn in the diagonal view.
const matCorners = (m: { x1: number; x2: number; z1: number; z2: number }): MutPt[] =>
  ([[m.x1, 0, m.z1], [m.x2, 0, m.z1], [m.x2, 0, m.z2], [m.x1, 0, m.z2]] as Pt3[]).map(project);

// Blend two key moments: every number and point moves in a straight line.
function blendSpec<S extends PoseSpec | PoseSpec3>(a: S, b: S, u: number): S {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    const x = (k in a ? a : b)[k as keyof S] as unknown;
    const y = (k in b ? b : a)[k as keyof S] as unknown;
    if (typeof x === "number" && typeof y === "number") out[k] = x + (y - x) * u;
    else if (Array.isArray(x) && Array.isArray(y)) out[k] = x.map((v: number, n: number) => v + (y[n] - v) * u);
  });
  return out as S;
}

const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

export interface PoseAt {
  joints: Joints;
  // Height of the hop at this moment (negative = up), and where in the loop.
  dy: number;
  t: number;
  // Diagonal view: how far each joint is from the camera.
  depth?: Record<JointName, number>;
}

export function poseAt(clip: Clip, ms: number): PoseAt {
  const t = (((ms % clip.dur) + clip.dur) % clip.dur) / clip.dur;
  const ks = clip.keys;
  let i = 0;
  while (i < ks.length - 2 && t >= ks[i + 1][0]) i++;
  const t0 = ks[i][0];
  const t1 = ks[i + 1][0];
  let u = t1 > t0 ? Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) : 0;
  if (!clip.linear) u = easeInOut(u);
  const dy = clip.bounce ? -clip.bounce * Math.abs(Math.sin(2 * Math.PI * t)) : 0;
  let joints: Joints;
  let depth: Record<JointName, number> | undefined;
  if (clip.kind === "oblique") {
    ({ joints, depth } = solveOblique(blendSpec(clip.poses[ks[i][1]], clip.poses[ks[i + 1][1]], u)));
  } else if (clip.kind === "spec") {
    joints = solvePose(blendSpec(clip.poses[ks[i][1]], clip.poses[ks[i + 1][1]], u), clip.view === "front" ? "front" : "side");
  } else {
    const A = clip.poses[ks[i][1]];
    const B = clip.poses[ks[i + 1][1]];
    joints = {} as Joints;
    (Object.keys(A) as JointName[]).forEach((k) => {
      joints[k] = [A[k][0] + (B[k][0] - A[k][0]) * u, A[k][1] + (B[k][1] - A[k][1]) * u];
    });
  }
  if (dy) (Object.keys(joints) as JointName[]).forEach((k) => (joints[k] = [joints[k][0], joints[k][1] + dy]));
  return { joints, dy, t, depth };
}

// The clip playing at `ms` (a sequence plays its parts one after another),
// and the time within it.
export function clipAt(motion: ExerciseMotion, angle: "main" | "alt", ms: number): { clip: Clip; ms: number } {
  const chosen = angle === "alt" && motion.alt ? motion.alt : motion.main;
  if (!Array.isArray(chosen)) return { clip: chosen as Clip, ms };
  const parts = chosen as readonly Clip[];
  const total = parts.reduce((n, c) => n + c.dur, 0);
  let m = ((ms % total) + total) % total;
  let i = 0;
  while (i < parts.length - 1 && m >= parts[i].dur) {
    m -= parts[i].dur;
    i++;
  }
  return { clip: parts[i], ms: m };
}

// How long one full loop of the motion takes (all parts of a sequence).
export function loopLength(motion: ExerciseMotion): number {
  const main = motion.main;
  return Array.isArray(main) ? (main as readonly Clip[]).reduce((n, c) => n + c.dur, 0) : (main as Clip).dur;
}

const firstClip = (motion: ExerciseMotion): Clip =>
  Array.isArray(motion.main) ? (motion.main as readonly Clip[])[0] : (motion.main as Clip);

// The camera angle the demo opens with.
export function mainAngle(motion: ExerciseMotion): CameraAngle {
  return firstClip(motion).angle;
}

// The moment shown when the demo stands still (its thumbnail moment).
export function stillMoment(motion: ExerciseMotion): number {
  const clip = firstClip(motion);
  return clip.dur * (clip.thumbT ?? 0.5);
}

// Frames a clip 16:9 around everything it does in a loop, plus a square
// around the thumbnail moment.
const framing = new WeakMap<Clip, { cam: [number, number, number]; thumb: [number, number, number] }>();
function frameClip(clip: Clip) {
  const cached = framing.get(clip);
  if (cached) return cached;
  let result: { cam: [number, number, number]; thumb: [number, number, number] };
  if (clip.kind === "raw") {
    result = { cam: [...clip.cam], thumb: [...clip.thumbBox] };
  } else {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    // A diagonal view has floor all round, so it doesn't pin the floor line.
    let y1 = clip.view === "oblique" ? -Infinity : 180;
    const grow = (q: Pt, r: number) => {
      x0 = Math.min(x0, q[0] - r);
      x1 = Math.max(x1, q[0] + r);
      y0 = Math.min(y0, q[1] - r);
      y1 = Math.max(y1, q[1] + r);
    };
    for (let i = 0; i < 24; i++) {
      const { joints } = poseAt(clip, (clip.dur * i) / 24);
      (Object.keys(joints) as JointName[]).forEach((k) => grow(joints[k], k === "H" ? 14 : 8));
    }
    (clip.props ?? []).forEach((pr) => ("box" in pr && pr.box ? pr.box : []).forEach((q) => grow(q, 4)));
    (clip.props ?? []).forEach((pr) => {
      if (pr.type === "mat3") matCorners(pr).forEach((q) => grow(q, 2));
    });
    const w = Math.max(220, x1 - x0 + 70, ((y1 - y0 + 24) * 16) / 9);
    const h = (w * 9) / 16;
    // The diagonal view frames the body in the middle; the others stand it
    // on the bottom edge.
    const cam: [number, number, number] =
      clip.view === "oblique"
        ? [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w]
        : [(x0 + x1) / 2 - w / 2, Math.min(y0 - 12, y1 + 6 - h), w];
    const { joints } = poseAt(clip, clip.dur * (clip.thumbT ?? 0.5));
    const pts = Object.values(joints);
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    const side = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 30;
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    result = { cam, thumb: [cx - side / 2, cy - side / 2, side] };
  }
  framing.set(clip, result);
  return result;
}

const fmt = (q: Pt) => q[0].toFixed(1) + " " + q[1].toFixed(1);
const path = (pts: Pt[]) => "M" + pts.map(fmt).join(" L");
const circle = (c: Pt, r: number) =>
  `M${(c[0] - r).toFixed(1)} ${c[1].toFixed(1)} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const layer = (d: string, o: Partial<Layer> = {}): Layer => ({ d, fill: "none", stroke: "none", width: 0, opacity: 1, dash: "none", ...o });

function propLayers(clip: Clip, j: Joints, t: number, where: "behind" | "front"): Layer[] {
  const out: Layer[] = [];
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  for (const pr of clip.props ?? []) {
    const at = "layer" in pr && pr.layer === "front" ? "front" : "behind";
    if (at !== where) continue;
    switch (pr.type) {
      case "wall":
        out.push(layer(`M${pr.x} -60 L${pr.x} ${FLOOR} L${pr.x + pr.w} ${FLOOR} L${pr.x + pr.w} -60 Z`, { fill: "#e6ddf0", stroke: "#cbbcde", width: 1.5 }));
        break;
      case "table":
        out.push(layer(`M${pr.x1 + 6} ${pr.y} L${pr.x1 + 6} ${FLOOR} M${pr.x2 - 6} ${pr.y} L${pr.x2 - 6} ${FLOOR}`, { stroke: "#c4b3da", width: 5 }));
        out.push(layer(`M${pr.x1} ${pr.y} L${pr.x2} ${pr.y}`, { stroke: "#b29fcd", width: 8 }));
        break;
      case "chair": {
        const op = clamp((j.P[1] - pr.y0) / (pr.y1 - pr.y0)) * 0.75;
        out.push(
          layer(
            `M${pr.x1} ${pr.y} L${pr.x2} ${pr.y} L${pr.x2} ${pr.y - 44} M${pr.x1 + 3} ${pr.y} L${pr.x1 + 3} ${FLOOR} M${pr.x2} ${pr.y} L${pr.x2} ${FLOOR}`,
            { stroke: SHIRT, width: 2.5, dash: "5 5", opacity: op },
          ),
        );
        break;
      }
      case "ball": {
        const held = t > pr.hold[0] && t < pr.hold[1];
        const c: Pt = held ? [(j.Wa[0] + j.Wb[0]) / 2, (j.Wa[1] + j.Wb[1]) / 2 + 5] : pr.at;
        out.push(layer(circle(c, 7), { fill: "#ff8a3d", stroke: "#e5671c", width: 1.5 }));
        break;
      }
      case "touch":
        pr.when.forEach((w, n) => {
          if (t < w[0] || t > w[1]) return;
          const fade = Math.min(1, (t - w[0]) / 0.03, (w[1] - t) / 0.03);
          out.push(layer(circle(j[pr.at[n]], 8), { stroke: "#ffc233", width: 3, opacity: fade }));
        });
        break;
      case "topdown":
        out.push(layer("M-300 -300 H620 V472 H-300 Z", { fill: "#ece6f3" }));
        if (pr.w) out.push(layer(`M${pr.x} ${pr.y1} L${pr.x} ${pr.y2}`, { stroke: "#d8c9ea", width: pr.w }));
        break;
      case "mat3":
        out.push(layer("M-300 -300 H620 V472 H-300 Z", { fill: "#ece6f3" }));
        out.push(layer(path(matCorners(pr)) + " Z", { fill: pr.mat === false ? "#e3dbee" : "#d8c9ea" }));
        break;
      case "wallback":
        out.push(layer(`M-300 -300 H620 V${FLOOR - 1} H-300 Z`, { fill: "#e6ddf0" }));
        out.push(layer(`M-300 ${FLOOR - 7} H620 V${FLOOR - 1} H-300 Z`, { fill: "#d6cae6" }));
        break;
      case "travel": {
        // The floor slides exactly one mark spacing per loop, so it joins up.
        const k = pr.from == null ? t : clamp((t - pr.from) / ((pr.to ?? 1) - pr.from));
        const off = (pr.from == null ? k : easeInOut(k)) * pr.dist;
        let d = "";
        if (pr.axis === "y") {
          const x1 = pr.x1 ?? 96;
          const x2 = pr.x2 ?? 224;
          for (let y = -400; y < 600; y += pr.dist) {
            const yy = (y + off).toFixed(1);
            d += `M${x1} ${yy} L${x1 + 14} ${yy} M${x2} ${yy} L${x2 - 14} ${yy} `;
          }
        } else {
          for (let x = -400; x < 760; x += pr.dist) d += `M${(x + off).toFixed(1)} 178 L${(x + off + 16).toFixed(1)} 178 `;
        }
        out.push(layer(d, { stroke: "#d3c6e4", width: 3 }));
        break;
      }
    }
  }
  return out;
}

export interface FrameOptions {
  angle?: "main" | "alt";
  ms: number;
  variant?: "video" | "thumb";
}

export function drawFrame(motion: ExerciseMotion, { angle = "main", ms, variant = "video" }: FrameOptions): MotionFrame {
  const picked =
    variant === "thumb" ? { clip: firstClip(motion), ms: firstClip(motion).dur * (firstClip(motion).thumbT ?? 0.5) } : clipAt(motion, angle, ms);
  const clip = picked.clip;
  const { joints: j, dy, t, depth } = poseAt(clip, picked.ms);
  // The diagonal view draws shoulders and hips as bars (like the front view)
  // with near limbs dark and far ones light (like the side view).
  const oblique = clip.view === "oblique";
  const front = clip.view === "front" || oblique;
  const sideLook = clip.look === "side" || oblique;
  const far = front && !sideLook ? INK : oblique ? FAR_DIAGONAL : FAR;

  const layers: Layer[] = propLayers(clip, j, t, "behind");
  const seg = (...names: JointName[]) => path(names.map((n) => j[n]));
  const legA = layer(seg("Ha", "Ka", "Fa", "Ta"), { stroke: INK, width: 9 });
  const legB = layer(seg("Hb", "Kb", "Fb", "Tb"), { stroke: far, width: 9 });
  const armA = layer(seg("Sa", "Ea", "Wa"), { stroke: INK, width: 8 });
  const armB = layer(seg("Sb", "Eb", "Wb"), { stroke: far, width: 8 });
  const torso = layer(front ? `${seg("Sa", "Sb")} ${seg("N", "P")} ${seg("Ha", "Hb")}` : seg("N", "P"), { stroke: SHIRT, width: 15 });
  if (depth) {
    // Farthest part first, so an arm crossing in front of the body is drawn
    // over it.
    const z = (names: JointName[]) => names.reduce((n, k) => n + depth[k], 0) / names.length;
    const parts: [Layer, JointName[]][] = [
      [legB, ["Hb", "Kb", "Fb", "Tb"]],
      [armB, ["Sb", "Eb", "Wb"]],
      [torso, ["N", "P"]],
      [legA, ["Ha", "Ka", "Fa", "Ta"]],
      [armA, ["Sa", "Ea", "Wa"]],
    ];
    layers.push(...parts.map(([l, names]) => [l, z(names)] as const).sort((x, y) => y[1] - x[1]).map(([l]) => l));
  } else {
    layers.push(...(front && !sideLook ? [legB, legA, torso, armB, armA] : [legB, armB, torso, legA, armA]));
  }
  layers.push(layer(circle(j.H, 11), { fill: INK }));
  layers.push(...propLayers(clip, j, t, "front"));

  const { cam, thumb } = frameClip(clip);
  const box = variant === "thumb" ? thumb : cam;
  const scale = (variant === "thumb" ? 100 : 320) / box[2];

  let shadow: MotionFrame["shadow"] = null;
  if (!(clip.props ?? []).some((p) => p.type === "topdown")) {
    if (clip.kind === "raw") {
      shadow = { cx: clip.shadow[0], rx: clip.shadow[1] * (1 + dy / 16) };
    } else {
      const xs = [j.Fa[0], j.Fb[0], j.Ta[0], j.Tb[0]];
      const lift = Math.max(0, 168 - Math.max(j.Fa[1], j.Fb[1]));
      shadow = {
        cx: (Math.min(...xs) + Math.max(...xs)) / 2,
        rx: ((Math.max(...xs) - Math.min(...xs)) / 2 + 22) * Math.max(0.4, 1 - lift / 50),
      };
    }
  }

  let prints: MotionFrame["prints"] = null;
  if (clip.prints) {
    const half = clip.prints.gap / 2;
    prints = {
      kind: clip.prints.kind,
      label: clip.prints.label,
      a: `translate(${26 - half} 17) rotate(${-clip.prints.turn})`,
      b: `translate(${26 + half} 17) rotate(${clip.prints.turn})`,
    };
  }

  return {
    transform: `scale(${scale.toFixed(4)}) translate(${(-box[0]).toFixed(1)} ${(-box[1]).toFixed(1)})`,
    layers,
    shadow,
    mat: Boolean(clip.mat),
    angle: clip.angle,
    prints,
    position: clip.position ?? null,
  };
}

// Joint-to-joint lengths, for checking that a pose never stretches a limb.
export const LIMB_LENGTHS = LN;
