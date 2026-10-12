import type { SkinKey } from "@/lib/skins";

// The decorations each skin draws behind the child screens, as SVG markup
// for a 390×844 phone (SkinBackdrop scales it to the screen): stars and
// planets, jungle leaves and flowers, or a treasure map with a castle and a
// dragon. Built from fixed numbers only — nothing here comes from a user.

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

function starField(w: number, h: number, n: number, seed: number): string {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = (r() * w).toFixed(1);
    const y = (r() * h).toFixed(1);
    const rad = (0.6 + r() * 1.3).toFixed(2);
    const op = (0.35 + r() * 0.6).toFixed(2);
    const delay = (r() * 3).toFixed(1);
    out += `<circle cx="${x}" cy="${y}" r="${rad}" fill="#ffffff" opacity="${op}"${i % 4 === 0 ? ` class="skin-twinkle" style="animation-delay:${delay}s"` : ""}></circle>`;
  }
  return out;
}

function planet(id: string, cx: number, cy: number, r: number, from: string, to: string, ring: string | null): string {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"></stop><stop offset="1" stop-color="${to}"></stop></linearGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"></circle>
    <path d="M${cx - r * 0.55} ${cy - r * 0.2} q ${r * 0.5} ${-r * 0.25} ${r * 1.05} 0" stroke="#ffffff" stroke-opacity="0.18" stroke-width="${r * 0.12}" fill="none" stroke-linecap="round"></path>
    ${
      ring
        ? `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.7}" ry="${r * 0.42}" fill="none" stroke="${ring}" stroke-width="${Math.max(2, r * 0.12)}" transform="rotate(-18 ${cx} ${cy})" opacity="0.85"></ellipse>
    <path d="M${cx - r} ${cy + r * 0.05} a ${r} ${r} 0 0 0 ${2 * r} 0" fill="url(#${id})" transform="rotate(-18 ${cx} ${cy})"></path>`
        : ""
    }`;
}

function comet(x: number, y: number): string {
  return `<defs><linearGradient id="skin-comet-tail" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"></stop><stop offset="1" stop-color="#ffffff" stop-opacity="0"></stop></linearGradient></defs>
    <g class="skin-comet" opacity="0.8"><path d="M${x} ${y} l-46 18" stroke="url(#skin-comet-tail)" stroke-width="2.4" stroke-linecap="round"></path><circle cx="${x}" cy="${y}" r="2.6" fill="#ffffff"></circle></g>`;
}

function frond(x: number, y: number, angle: number, len: number, color: string, vein: string, scale = 1): string {
  let leaves = "";
  for (let i = 0; i < 7; i++) {
    const t = (i + 1) / 8;
    const px = t * len;
    const size = (1 - t * 0.55) * 26;
    for (const side of [-1, 1]) {
      leaves += `<path d="M0 0 C ${size * 0.3} ${-size * 0.45 * side}, ${size * 0.8} ${-size * 0.5 * side}, ${size} ${-size * 0.12 * side} C ${size * 0.7} ${size * 0.05 * side}, ${size * 0.3} ${size * 0.08 * side}, 0 0 Z" fill="${color}" transform="translate(${px.toFixed(1)} 0) rotate(${side * -38})"></path>`;
    }
  }
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})"><path d="M0 0 Q ${len * 0.5} -6 ${len} 0" stroke="${vein}" stroke-width="2.2" fill="none" stroke-linecap="round"></path>${leaves}</g>`;
}

function leaf(x: number, y: number, angle: number, size: number, color: string, vein: string): string {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${size / 64})"><path d="M0 0 C 12 -24, 46 -28, 66 -4 C 46 14, 14 18, 0 0 Z" fill="${color}"></path><path d="M3 -1 C 22 -9, 42 -11, 62 -5" stroke="${vein}" stroke-width="1.6" fill="none" stroke-linecap="round"></path></g>`;
}

function flower(x: number, y: number, color: string): string {
  let petals = "";
  for (let i = 0; i < 5; i++) {
    petals += `<circle cx="${(x + Math.cos((i * 2 * Math.PI) / 5) * 4.2).toFixed(1)}" cy="${(y + Math.sin((i * 2 * Math.PI) / 5) * 4.2).toFixed(1)}" r="3.4" fill="${color}"></circle>`;
  }
  return `${petals}<circle cx="${x}" cy="${y}" r="2.4" fill="#ffd34d"></circle>`;
}

const ADV_INK = "#5a3e22";
const ADV_RED = "#9b2c2c";

function compass(cx: number, cy: number, r: number): string {
  const pts = (n: number, big: number, small: number, rot = 0) =>
    Array.from({ length: n * 2 }, (_, i) => {
      const a = ((Math.PI * 2) / (n * 2)) * i - Math.PI / 2 + rot;
      const rr = i % 2 === 0 ? big : small;
      return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
    }).join(" ");
  return `<g opacity="0.75"><circle cx="${cx}" cy="${cy}" r="${r * 1.05}" fill="none" stroke="${ADV_INK}" stroke-width="1.2" stroke-dasharray="2 3"></circle>
    <polygon points="${pts(4, r * 0.62, r * 0.16, Math.PI / 4)}" fill="${ADV_INK}" opacity="0.35"></polygon>
    <polygon points="${pts(4, r, r * 0.2)}" fill="${ADV_INK}"></polygon>
    <polygon points="${cx},${cy - r} ${cx + r * 0.2},${cy} ${cx - r * 0.2},${cy}" fill="${ADV_RED}"></polygon>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.12}" fill="#fbf3df"></circle></g>`;
}

function mountains(x: number, y: number, w: number): string {
  let out = "";
  for (const [fx, fh] of [[0, 0.55], [0.22, 0.9], [0.45, 0.65], [0.68, 1], [0.9, 0.6]]) {
    const px = x + fx * w;
    const h = 46 * fh;
    out += `<path d="M${px - 26} ${y} L${px} ${y - h} L${px + 26} ${y} Z" fill="#c9ab76" stroke="${ADV_INK}" stroke-width="1.3" stroke-linejoin="round" opacity="0.8"></path>
      <path d="M${px - 9} ${y - h * 0.66} L${px} ${y - h} L${px + 9} ${y - h * 0.66} L${px + 3} ${y - h * 0.6} L${px - 3} ${y - h * 0.7} Z" fill="#fbf3df" opacity="0.9"></path>`;
  }
  return out;
}

function castle(x: number, y: number, s: number): string {
  const tower = (tx: number, w: number, h: number) =>
    `<path d="M${tx} ${y} V${y - h} h${w * 0.2} v${-6 * s} h${w * 0.2} v${6 * s} h${w * 0.2} v${-6 * s} h${w * 0.2} v${6 * s} h${w * 0.2} V${y} Z" fill="#b89766" stroke="${ADV_INK}" stroke-width="1.3" stroke-linejoin="round"></path>`;
  return `<g opacity="0.85">${tower(x, 20 * s, 54 * s)}${tower(x + 52 * s, 20 * s, 54 * s)}
    <path d="M${x + 18 * s} ${y} V${y - 34 * s} h${36 * s} V${y} Z" fill="#c9ab76" stroke="${ADV_INK}" stroke-width="1.3"></path>
    <path d="M${x + 29 * s} ${y} V${y - 12 * s} a ${7 * s} ${7 * s} 0 0 1 ${14 * s} 0 V${y} Z" fill="${ADV_INK}"></path>
    <path d="M${x + 10 * s} ${y - 54 * s} V${y - 76 * s}" stroke="${ADV_INK}" stroke-width="1.4"></path>
    <path d="M${x + 10 * s} ${y - 76 * s} l${14 * s} ${4 * s} l${-14 * s} ${4 * s} Z" fill="${ADV_RED}"></path></g>`;
}

function dragon(x: number, y: number, s: number): string {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="0.82"><g class="skin-float">
    <path d="M44 38 L28 6 L46 20 L54 2 L60 32 Z" fill="${ADV_RED}" opacity="0.85"></path>
    <path d="M8 46 C 2 52, 6 60, 14 56 M10 44 C 24 36, 36 46, 52 40 C 64 35, 72 29, 84 27" stroke="${ADV_RED}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="M82 22 L96 25 L86 33 Z" fill="${ADV_RED}"></path>
    <path d="M30 42 l-4 10 M48 40 l2 10" stroke="${ADV_RED}" stroke-width="3" stroke-linecap="round"></path>
    <circle cx="88" cy="26.5" r="1.4" fill="#fde68a"></circle></g></g>`;
}

function treasure(x: number, y: number): string {
  return `<path d="M${x - 8} ${y - 8} L${x + 8} ${y + 8} M${x + 8} ${y - 8} L${x - 8} ${y + 8}" stroke="${ADV_RED}" stroke-width="4" stroke-linecap="round"></path>`;
}

function trail(d: string): string {
  return `<path d="${d}" fill="none" stroke="${ADV_RED}" stroke-width="2.2" stroke-dasharray="6 6" stroke-linecap="round" opacity="0.7"></path>`;
}

function mapGrid(w: number, h: number): string {
  let out = "";
  for (let x = 30; x < w; x += 60) out += `<line x1="${x}" x2="${x}" y1="0" y2="${h}" stroke="${ADV_INK}" stroke-width="0.6" opacity="0.12"></line>`;
  for (let y = 30; y < h; y += 60) out += `<line x1="0" x2="${w}" y1="${y}" y2="${y}" stroke="${ADV_INK}" stroke-width="0.6" opacity="0.12"></line>`;
  return out;
}

const DECOR: Record<Exclude<SkinKey, "qunity">, () => string> = {
  space: () =>
    `${starField(390, 844, 110, 11)}${planet("skin-pl-1", 58, 330, 30, "#7dd3fc", "#6366f1", "#c7d2fe")}${planet("skin-pl-2", 338, 560, 18, "#fde68a", "#f97316", null)}${planet("skin-pl-3", 330, 140, 11, "#f59e9e", "#b45ad6", "#f8c4ff")}${comet(320, 150)}`,
  jungle: () =>
    `${frond(-10, 260, -20, 130, "#7fbf6a", "#4d8f45")}${frond(400, 420, -165, 120, "#5aa469", "#3c7f48")}${frond(-8, 620, 5, 110, "#5aa469", "#3c7f48")}${frond(398, 760, -150, 100, "#7fbf6a", "#4d8f45")}
     ${leaf(326, 300, 210, 46, "#9bd17f", "#5f9a4c")}${leaf(40, 470, -30, 42, "#9bd17f", "#5f9a4c")}${leaf(300, 640, 160, 38, "#7fbf6a", "#4d8f45")}
     ${flower(70, 230, "#ff8a6b")}${flower(320, 380, "#ffb3c7")}${flower(96, 600, "#ff8a6b")}${flower(300, 470, "#ffb3c7")}`,
  adventure: () =>
    `${mapGrid(390, 844)}${castle(286, 160, 1)}${dragon(14, 220, 0.95)}${mountains(-16, 470, 90)}${mountains(300, 650, 100)}${compass(336, 760, 24)}
     ${trail("M60 720 C 40 680, 70 640, 40 600")}${treasure(44, 588)}`,
};

const cache = new Map<SkinKey, string>();

export function skinDecorSvg(skin: Exclude<SkinKey, "qunity">): string {
  if (!cache.has(skin)) cache.set(skin, DECOR[skin]());
  return cache.get(skin)!;
}

// The small decorations on the picker's cards and preview phone.
export function skinMiniDecorSvg(skin: SkinKey, w: number, h: number): string {
  if (skin === "space") return starField(w, h, 26, 5) + planet(`skin-mini-${w}`, w - 22, 30, 9, "#f59e9e", "#b45ad6", "#f8c4ff");
  if (skin === "jungle")
    return frond(-4, h - 8, -55, 60, "#7fbf6a", "#4d8f45", 0.7) + frond(w + 4, h - 4, -125, 56, "#5aa469", "#3c7f48", 0.7) + leaf(w - 30, 10, 200, 24, "#9bd17f", "#5f9a4c");
  if (skin === "adventure")
    return mapGrid(w, h) + trail(`M14 ${h - 14} C 40 ${h - 40}, 70 ${h - 10}, ${w - 40} ${h - 34}`) + treasure(w - 34, h - 36) + dragon(w - 64, 6, 0.42);
  return "";
}
