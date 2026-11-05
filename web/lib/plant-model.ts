// A procedural plant. Everything is decided here, once, from a seed, and depends only on growth
// progress (0 to 1), so moving back and forth replays the same plant. No drawing code.
// World units: x to the right, y up, the ground at y = 0.

export type Branch = {
  xs: number[];
  ys: number[];
  widths: number[];
  born: number;
  dur: number;
  depth: number;
  /** 0, 1 or 2 on the three main limbs and everything growing from them. */
  kind: number | null;
};

export type Leaf = {
  x: number;
  y: number;
  angle: number;
  size: number;
  hue: number;
  born: number;
  /** When it falls in the dry season, or 2 if it never does. */
  fall: number;
  /** When a new leaf appears in its place, or 2 if none does. */
  regrow: number;
  drift: number;
  phase: number;
  kind: number | null;
  /** A leaf of the young stem: it fades where it is, instead of falling. */
  sprout?: boolean;
};

/** A mass of shade inside the crown, behind the leaves. It is what makes the crown look full. */
export type Foliage = { x: number; y: number; radius: number; born: number };

export type Plant = { branches: Branch[]; roots: Branch[]; leaves: Leaf[]; foliage: Foliage[] };

export const PLANT_HEIGHT = 96;
export const DRY_START = 0.66;
export const DRY_END = 0.8;
export const SPROUT_FADE_START = 0.48;
export const SPROUT_FADE = 0.07;

const TO_RADIANS = Math.PI / 180;

function randomFrom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Walk = {
  x: number;
  y: number;
  /** Degrees. The line leaves at `heading`, close to its parent, and curves to `target`. */
  heading: number;
  target: number;
  length: number;
  w0: number;
  w1: number;
  steps: number;
  wander: number;
  floor?: number;
  ceiling?: number;
};

function walk(random: () => number, w: Walk) {
  const xs = [w.x];
  const ys = [w.y];
  const widths = [w.w0];
  let { x, y } = w;
  let drift = 0;
  const step = w.length / w.steps;
  for (let i = 1; i <= w.steps; i++) {
    const t = i / w.steps;
    drift = drift * 0.75 + (random() - 0.5) * w.wander;
    const blend = Math.min(1, t / 0.4);
    const eased = blend * blend * (3 - 2 * blend);
    const degrees = w.heading + (w.target - w.heading) * eased + drift;
    x += Math.cos(degrees * TO_RADIANS) * step;
    y += Math.sin(degrees * TO_RADIANS) * step;
    if (w.ceiling !== undefined) y = Math.min(y, w.ceiling);
    if (w.floor !== undefined) y = Math.max(y, w.floor);
    xs.push(x);
    ys.push(y);
    widths.push(w.w1 + (w.w0 - w.w1) * Math.pow(1 - t, 1.25));
  }
  return { xs, ys, widths };
}

function headingAt(branch: Branch, index: number): number {
  const i = Math.max(1, index);
  return Math.atan2(branch.ys[i] - branch.ys[i - 1], branch.xs[i] - branch.xs[i - 1]) / TO_RADIANS;
}

/** When the growing tip passes a point of the branch: the inverse of the smoothstep that draws it. */
export function reachedAt(branch: Branch, index: number): number {
  const fraction = index / (branch.xs.length - 1);
  return branch.born + branch.dur * (0.5 - Math.sin(Math.asin(1 - 2 * fraction) / 3));
}

// A leaf or a branch appears a moment after the tip has passed its point, never in the air ahead of it.
const AFTER_TIP = 0.01;

export function generatePlant(seed = 2026): Plant {
  const random = randomFrom(seed);
  const between = (low: number, high: number) => low + random() * (high - low);
  const branches: Branch[] = [];
  const leaves: Leaf[] = [];
  const foliage: Foliage[] = [];

  const trunk: Branch = {
    ...walk(random, {
      x: 0,
      // Starts below the ground, inside the taproot, so no notch shows at the ground line.
      y: -2,
      heading: 90,
      target: 90,
      length: 70,
      w0: 6.4,
      w1: 0.9,
      steps: 22,
      wander: 7,
    }),
    born: 0.2,
    dur: 0.38,
    depth: 0,
    kind: null,
  };
  // The base flares where it meets the ground, as real trunks do.
  trunk.widths = trunk.widths.map((width, i) => width * (1 + 0.3 * Math.pow(Math.max(0, 1 - i / 6), 2)));
  branches.push(trunk);

  function grow(parent: Branch, at: number, side: number, spec: {
    spread: number;
    length: number;
    born: number;
    dur: number;
    depth: number;
    kind: number | null;
    steps: number;
  }): Branch {
    const index = Math.round(at * (parent.xs.length - 1));
    const base = headingAt(parent, index);
    const child: Branch = {
      ...walk(random, {
        x: parent.xs[index],
        y: parent.ys[index],
        heading: base + side * 16,
        target: base + side * spec.spread,
        length: spec.length,
        w0: Math.max(parent.widths[index] * 0.72, 0.4),
        w1: 0.12,
        steps: spec.steps,
        wander: 12,
      }),
      born: Math.max(spec.born, reachedAt(parent, index) + AFTER_TIP / 2),
      dur: spec.dur,
      depth: spec.depth,
      kind: spec.kind,
    };
    branches.push(child);
    return child;
  }

  function addLeaves(branch: Branch, count: number, born: () => number, late: boolean) {
    const last = branch.xs.length - 1;
    for (let n = 0; n < count; n++) {
      const t = 0.3 + (n / Math.max(count - 1, 1)) * 0.7;
      const index = Math.round(t * last);
      const side = n % 2 === 0 ? 1 : -1;
      const start = Math.max(born(), reachedAt(branch, index) + AFTER_TIP);
      const falls = !late && random() < 0.82;
      leaves.push({
        x: branch.xs[index] + between(-0.7, 0.7),
        y: branch.ys[index] + between(-0.7, 0.7),
        angle: headingAt(branch, index) + side * between(28, 72),
        size: between(3.4, 5.6),
        hue: Math.floor(random() * 4),
        born: start,
        fall: falls ? between(Math.max(DRY_START, start + 0.02), DRY_END - 0.02) : 2,
        regrow: falls ? between(DRY_END + 0.03, 0.97) : 2,
        drift: between(-16, 16),
        phase: random() * Math.PI * 2,
        kind: branch.kind,
      });
    }
  }

  // The first leaves, on the young stem, while it is still a sprout.
  for (const [at, side] of [
    [0.12, -1],
    [0.18, 1],
    [0.26, -1],
    [0.33, 1],
    [0.41, -1],
    [0.48, 1],
  ] as const) {
    const index = Math.round(at * (trunk.xs.length - 1));
    leaves.push({
      x: trunk.xs[index],
      y: trunk.ys[index],
      angle: 90 + side * 62,
      size: 5.4,
      hue: side > 0 ? 0 : 1,
      born: Math.max(0.27 + at * 0.28, reachedAt(trunk, index) + AFTER_TIP),
      // They fade on the way to the Galhos stage, which shows the bare branches.
      fall: between(SPROUT_FADE_START, SPROUT_FADE_START + 0.02),
      regrow: 2,
      drift: side * 10,
      phase: random() * Math.PI * 2,
      kind: null,
      sprout: true,
    });
  }

  const limbs: { at: number; side: number; spread: number; length: number; kind: number | null }[] = [
    { at: 0.42, side: -1, spread: 58, length: 38, kind: 0 },
    { at: 0.56, side: 1, spread: 55, length: 40, kind: 1 },
    { at: 0.72, side: -1, spread: 46, length: 32, kind: 2 },
    { at: 0.66, side: 1, spread: 36, length: 24, kind: null },
    { at: 0.82, side: 1, spread: 44, length: 24, kind: null },
    { at: 0.9, side: -1, spread: 30, length: 18, kind: null },
    { at: 0.5, side: 1, spread: 40, length: 28, kind: null },
    { at: 0.62, side: -1, spread: 34, length: 28, kind: null },
    { at: 0.97, side: 1, spread: 16, length: 18, kind: null },
  ];

  for (const [order, limb] of limbs.entries()) {
    const main = grow(trunk, limb.at, limb.side, {
      spread: limb.spread,
      length: limb.length,
      born: 0.42 + order * 0.012,
      dur: 0.14,
      depth: 1,
      kind: limb.kind,
      steps: 12,
    });
    addLeaves(main, 5, () => between(0.56, 0.62), false);

    for (const [i, at] of [0.4, 0.62, 0.82, 1].entries()) {
      const side = i % 2 === 0 ? -limb.side : limb.side;
      const twig = grow(main, at, side, {
        spread: between(22, 44),
        length: limb.length * between(0.42, 0.6),
        born: 0.5 + i * 0.015,
        dur: 0.12,
        depth: 2,
        kind: limb.kind,
        steps: 8,
      });
      addLeaves(twig, 12, () => between(0.58, 0.65), false);
      for (const [index, radius] of [
        [twig.xs.length - 1, between(8, 12)],
        [4, between(6, 9)],
      ]) {
        const x = twig.xs[index];
        const y = twig.ys[index];
        const reached = reachedAt(twig, index) + AFTER_TIP;
        foliage.push({ x, y, radius, born: reached });
        // Leaves all around each mass, so its edge reads as foliage and not as a circle.
        for (let n = 0; n < 8; n++) {
          const angle = random() * Math.PI * 2;
          const reach = radius * (0.45 + random() * 0.6);
          const start = Math.max(between(0.6, 0.66), reached);
          leaves.push({
            x: x + Math.cos(angle) * reach,
            y: y + Math.sin(angle) * reach,
            angle: angle / TO_RADIANS + between(-35, 35),
            size: between(4, 6),
            hue: 3,
            born: start,
            fall: between(Math.max(DRY_START, start + 0.02), DRY_END - 0.02),
            regrow: between(DRY_END + 0.03, 0.97),
            drift: between(-16, 16),
            phase: random() * Math.PI * 2,
            kind: limb.kind,
          });
        }
      }

      // Grows only after the dry season: the plant comes back larger.
      for (const lateSide of [-1, 1]) {
        const late = grow(twig, between(0.7, 1), lateSide, {
          spread: between(18, 40),
          length: limb.length * between(0.2, 0.3),
          born: between(0.82, 0.88),
          dur: 0.1,
          depth: 3,
          kind: limb.kind,
          steps: 6,
        });
        addLeaves(late, 6, () => between(0.87, 0.97), true);
      }
    }
  }

  const roots: Branch[] = [];
  function root(x: number, y: number, target: number, length: number, w0: number, born: number, depth: number) {
    const branch: Branch = {
      ...walk(random, {
        x,
        y,
        heading: -90,
        target,
        length,
        w0,
        w1: 0.08,
        steps: 12,
        wander: 16,
        ceiling: -0.4,
      }),
      born,
      dur: 0.12,
      depth,
      kind: null,
    };
    roots.push(branch);
    return branch;
  }

  const taproot = root(0, 0, -92, 19, 8.2, 0.02, 0);
  const laterals: [number, number][] = [
    [-160, 19],
    [-22, 21],
    [-128, 15],
    [-50, 15],
    [-172, 13],
    [-8, 13],
  ];
  for (const [i, [target, length]] of laterals.entries()) {
    const start = Math.min(i * 2, taproot.xs.length - 2);
    const lateral = root(taproot.xs[start], taproot.ys[start], target, length, 2, 0.05 + i * 0.012, 1);
    for (const at of [0.5, 0.8]) {
      const index = Math.round(at * (lateral.xs.length - 1));
      root(
        lateral.xs[index],
        lateral.ys[index],
        target + between(-38, 38),
        length * between(0.25, 0.42),
        0.55,
        lateral.born + 0.07,
        2,
      );
    }
  }

  // Light comes from the upper right: leaves there are brighter, and the shaded ones are drawn first.
  const crown = leaves.filter((leaf) => leaf.born > 0.5);
  const lowest = Math.min(...crown.map((leaf) => leaf.y));
  const highest = Math.max(...crown.map((leaf) => leaf.y));
  for (const leaf of crown) {
    const light = ((leaf.y - lowest) / (highest - lowest)) * 0.5 + ((leaf.x + 60) / 120) * 0.2 + random() * 0.4;
    leaf.hue = light > 0.84 ? 0 : light > 0.62 ? 1 : light > 0.4 ? 2 : 3;
  }
  leaves.sort((a, b) => b.hue - a.hue);

  return { branches, roots, leaves, foliage };
}
