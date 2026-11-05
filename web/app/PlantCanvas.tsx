"use client";

import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { DRY_END, DRY_START, generatePlant, PLANT_HEIGHT, type Branch } from "@/lib/plant-model";

const TO_RADIANS = Math.PI / 180;
const SOIL = "#0b2420";
const HILLS = ["#16382f", "#1b4136"];
const LIME: Rgb = [203, 247, 81];
const BARK: Rgb = [108, 128, 78];
const OLD_BARK: Rgb = [84, 104, 66];
const ROOT: Rgb = [150, 170, 132];
const OCHRE: Rgb = [201, 164, 92];
const LEAF_BASES: Rgb[] = [
  [203, 247, 81],
  [143, 201, 90],
  [93, 158, 95],
  [63, 127, 88],
];
const RAMP_STEPS = 8;

type Rgb = [number, number, number];

function mix(a: Rgb, b: Rgb, t: number): string {
  const c = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

function ramp(a: Rgb, b: Rgb): string[] {
  return Array.from({ length: RAMP_STEPS }, (_, i) => mix(a, b, i / (RAMP_STEPS - 1)));
}

const LEAF_RAMPS = LEAF_BASES.map((base) => ramp(base, OCHRE));
const BARK_RAMP = ramp(LIME, BARK);
const TRUNK_RAMP = ramp(LIME, OLD_BARK);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const rampAt = (colors: string[], t: number) => colors[Math.round(clamp01(t) * (RAMP_STEPS - 1))];

function interpolate(p: number, stops: readonly (readonly [number, number])[]): number {
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i][0]) {
      const [p0, v0] = stops[i - 1];
      const [p1, v1] = stops[i];
      return v0 + (v1 - v0) * smooth((p - p0) / (p1 - p0));
    }
  }
  return stops[stops.length - 1][1];
}

// A young stem is thin. It only gains weight once there are branches to hold.
const THICKNESS_STOPS = [
  [0.2, 0.14],
  [0.45, 0.26],
  [0.7, 0.78],
  [1, 1.14],
] as const;

const ZOOM_STOPS = [
  [0, 2.5],
  [0.2, 1.9],
  [0.4, 1.45],
  [0.6, 1.05],
  [1, 0.94],
] as const;

type Scene = {
  width: number;
  height: number;
  wide: boolean;
  unit: number;
  groundY: number;
  originX: number;
  zoom: number;
  time: number;
  gust: number;
  pointerX: number;
  pointerY: number;
  p: number;
};

/** Sideways movement of a world point: the breeze, the pointer and clicks. Higher points move more. */
function sway(scene: Scene, x: number, y: number): number {
  if (y <= 0) return 0;
  const height = y / PLANT_HEIGHT;
  const strength = height * Math.sqrt(height);
  const { time, gust } = scene;
  let offset =
    strength *
    (1.5 * Math.sin(time * 0.9 + x * 0.05) + 0.7 * Math.sin(time * 2.1 + y * 0.09) + gust * 8 * Math.sin(time * 9 + y * 0.1));
  const screenX = scene.originX + x * scene.unit * scene.zoom;
  const screenY = scene.groundY - y * scene.unit * scene.zoom;
  const dx = screenX - scene.pointerX;
  const dy = screenY - scene.pointerY;
  const reach = 150;
  const distance = dx * dx + dy * dy;
  if (distance < reach * reach) {
    const push = 1 - Math.sqrt(distance) / reach;
    offset += Math.sign(dx || 1) * push * push * 5 * Math.min(1, height * 3);
  }
  return offset;
}

function drawLimb(ctx: CanvasRenderingContext2D, scene: Scene, branch: Branch, color: string, thickness: number) {
  const grown = smooth((scene.p - branch.born) / branch.dur);
  if (grown <= 0) return;
  const last = branch.xs.length - 1;
  const reach = grown * last;
  const count = Math.ceil(reach);
  const scale = scene.unit * scene.zoom;
  const px: number[] = [];
  const py: number[] = [];
  const pw: number[] = [];
  for (let i = 0; i <= count; i++) {
    const fraction = i === count ? reach - (count - 1) : 1;
    const a = Math.max(i - 1, 0);
    const x = i === count && count > 0 ? branch.xs[a] + (branch.xs[i] - branch.xs[a]) * fraction : branch.xs[i];
    const y = i === count && count > 0 ? branch.ys[a] + (branch.ys[i] - branch.ys[a]) * fraction : branch.ys[i];
    px.push(scene.originX + (x + sway(scene, x, y)) * scale);
    py.push(scene.groundY - y * scale);
    // The growing tip always comes to a point, whatever the branch's final width is there.
    const tip = clamp01((reach - i) / 3.5);
    pw.push(Math.max(branch.widths[i] * thickness * tip * scale * 0.5, 0.25));
  }

  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i < px.length; i++) {
    const a = Math.max(i - 1, 0);
    const b = Math.min(i + 1, px.length - 1);
    const dx = px[b] - px[a];
    const dy = py[b] - py[a];
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    left.push([px[i] + nx * pw[i], py[i] + ny * pw[i]]);
    right.push([px[i] - nx * pw[i], py[i] - ny * pw[i]]);
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (const [x, y] of left) ctx.lineTo(x, y);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
}

const LEAF_PATH = typeof Path2D === "undefined" ? null : new Path2D("M0 0 C.2 -.3 .68 -.34 1 0 C.68 .34 .2 .3 0 0Z");

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleDegrees: number,
  size: number,
  color: string,
  alpha = 1,
) {
  const angle = angleDegrees * TO_RADIANS;
  const cos = Math.cos(angle) * size;
  const sin = Math.sin(angle) * size;
  ctx.setTransform(cos, sin, -sin, cos, x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill(LEAF_PATH as Path2D);
}

function backdrop(seed: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const value = Math.sin(seed * (i + 1) * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  });
}

const STONES = backdrop(3.1, 90);
const GRASS = backdrop(5.7, 160);
const DOTS = backdrop(9.3, 60);

function drawBackground(ctx: CanvasRenderingContext2D, scene: Scene, travel: number, dry: number) {
  const { width, height, groundY, time, p } = scene;

  // The sun crosses the sky along the whole journey: it marks the time passing.
  const sunX = width * (scene.wide ? 0.56 + p * 0.38 : 0.12 + p * 0.76);
  const sunY = groundY * (0.62 - Math.sin(p * Math.PI) * 0.46);
  ctx.fillStyle = dry > 0.5 ? "rgba(201,164,92,0.5)" : "rgba(227,232,225,0.13)";
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(sunX, sunY, Math.min(width, height) * 0.055, 0, Math.PI * 2);
  ctx.fill();

  if (dry > 0) {
    ctx.fillStyle = `rgba(201,164,92,${0.07 * dry})`;
    ctx.fillRect(0, 0, width, height);
  }

  HILLS.forEach((color, layer) => {
    const shift = travel * (0.12 + layer * 0.16);
    const base = groundY - (layer === 0 ? height * 0.16 : height * 0.08);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= width + 24; x += 24) {
      const w = x + shift;
      const hill =
        Math.sin(w * 0.0031 + layer * 2.1) * height * 0.035 + Math.sin(w * 0.0083 + layer) * height * 0.012;
      ctx.lineTo(x, base + hill);
    }
    ctx.lineTo(width, groundY);
    ctx.closePath();
    ctx.fill();
  });

  // The soil is cut open so the roots can be seen.
  ctx.fillStyle = SOIL;
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = "#10302a";
  for (let i = 0; i < STONES.length; i += 3) {
    const x = ((STONES[i] * (width + 300) - travel) % (width + 300) + width + 300) % (width + 300) - 150;
    const y = groundY + 18 + STONES[i + 1] * (height - groundY - 18);
    const size = 2 + STONES[i + 2] * 6;
    ctx.beginPath();
    ctx.ellipse(x, y, size * 1.5, size, STONES[i + 2] * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grass along the ground, moved by the same breeze as the plant.
  ctx.lineCap = "round";
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rampAt(ramp([93, 158, 95], OCHRE), dry);
  ctx.beginPath();
  for (let i = 0; i < GRASS.length; i += 2) {
    const x = ((GRASS[i] * (width + 300) - travel) % (width + 300) + width + 300) % (width + 300) - 150;
    const blade = 4 + GRASS[i + 1] * 9;
    const lean = Math.sin(time * 1.4 + x * 0.02) * 2.5 + scene.gust * 6;
    ctx.moveTo(x, groundY);
    ctx.quadraticCurveTo(x + lean * 0.3, groundY - blade * 0.6, x + lean, groundY - blade);
  }
  ctx.stroke();

  // Pollen in the air, only when there is a canopy to give it.
  const pollen = smooth((p - 0.86) / 0.12);
  if (pollen > 0) {
    ctx.fillStyle = "#cbf751";
    for (let i = 0; i < DOTS.length; i += 2) {
      const x = (DOTS[i] * width + Math.sin(time * 0.3 + i) * 26 - travel * 0.5 + width) % width;
      const y = groundY * (0.15 + DOTS[i + 1] * 0.75) + Math.cos(time * 0.4 + i) * 18;
      ctx.globalAlpha = pollen * (0.25 + 0.3 * Math.abs(Math.sin(time + i)));
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

type Burst = { x: number; y: number; vx: number; vy: number; angle: number; spin: number; hue: number; life: number };

/** Draws the plant from the current progress. Reads no React state while running. */
export function PlantCanvas({
  progress,
  highlight,
  still,
}: {
  progress: MotionValue<number>;
  highlight: number | null;
  still: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const plant = useMemo(() => generatePlant(), []);
  const highlightRef = useRef(highlight);
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    highlightRef.current = highlight;
    redraw.current();
  }, [highlight]);

  useMotionValueEvent(progress, "change", () => {
    if (still) redraw.current();
  });

  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext("2d");
    if (!element || !ctx) return;

    const pointer = { x: -9999, y: -9999 };
    let gust = 0;
    let bursts: Burst[] = [];
    let cssWidth = 0;
    let cssHeight = 0;
    let scale = 1;
    let visible = true;
    let frame = 0;
    let last = performance.now();

    function resize() {
      const box = element!.getBoundingClientRect();
      cssWidth = box.width;
      cssHeight = box.height;
      scale = Math.min(window.devicePixelRatio || 1, 2);
      element!.width = Math.round(cssWidth * scale);
      element!.height = Math.round(cssHeight * scale);
      draw(last);
    }

    function draw(now: number) {
      const seconds = still ? 0 : now / 1000;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      gust *= Math.pow(0.05, dt);
      const p = clamp01(progress.get());
      const wide = cssWidth >= 1024;
      const groundY = cssHeight * (wide ? 0.78 : 0.38);
      const unit = (groundY - (wide ? 34 : 8)) / PLANT_HEIGHT;
      const travel = p * cssWidth * 0.5;
      const zoom = interpolate(p, ZOOM_STOPS);
      const scene: Scene = {
        width: cssWidth,
        height: cssHeight,
        wide,
        unit,
        groundY,
        originX: (wide ? cssWidth * 0.74 : cssWidth * 0.5) - (wide ? p * cssWidth * 0.03 : 0),
        zoom,
        time: seconds,
        gust,
        pointerX: pointer.x,
        pointerY: pointer.y,
        p,
      };
      const dry = smooth((p - DRY_START) / 0.08) * (1 - smooth((p - DRY_END - 0.03) / 0.12));
      const selected = highlightRef.current;
      const world = scene.unit * zoom;

      ctx!.setTransform(scale, 0, 0, scale, 0, 0);
      ctx!.globalAlpha = 1;
      ctx!.clearRect(0, 0, cssWidth, cssHeight);
      drawBackground(ctx!, scene, travel, dry);

      // Roots first. Thin ones before thick ones, so joints stay hidden under the parent.
      for (let i = plant.roots.length - 1; i >= 0; i--) {
        const root = plant.roots[i];
        const thick = root.depth === 0 ? interpolate(p, THICKNESS_STOPS) * 0.95 + 0.1 : 0.45 + 0.55 * smooth((p - root.born) / 0.7);
        drawLimb(ctx!, scene, root, mix(ROOT, [176, 198, 178], root.depth / 2), thick);
      }

      const seed = 1 - smooth((p - 0.19) / 0.08);
      if (seed > 0) {
        ctx!.fillStyle = "#d9b37a";
        ctx!.beginPath();
        ctx!.ellipse(scene.originX, groundY + 3 * world, 3 * world * seed, 2.1 * world * seed, -0.4, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = "#b98f58";
        ctx!.beginPath();
        ctx!.ellipse(scene.originX + 0.5 * world, groundY + 3.4 * world, 1.7 * world * seed, 1 * world * seed, -0.4, 0, Math.PI * 2);
        ctx!.fill();
      }

      for (let i = plant.branches.length - 1; i >= 0; i--) {
        const branch = plant.branches[i];
        const age = (p - branch.born - branch.dur * 0.5) / 0.32;
        const thick = branch.depth === 0 ? interpolate(p, THICKNESS_STOPS) : interpolate(p, THICKNESS_STOPS) * 0.8 + 0.2;
        const dim = selected !== null && branch.kind !== selected;
        const on = selected !== null && branch.kind === selected;
        const color = on ? "#cbf751" : dim ? "#4e6a4c" : rampAt(branch.depth === 0 ? TRUNK_RAMP : BARK_RAMP, age);
        drawLimb(ctx!, scene, branch, color, thick);
      }

      for (const leaf of plant.leaves) {
        const opened = (p - leaf.born) / 0.05;
        if (opened <= 0) continue;
        const swayed = sway(scene, leaf.x, leaf.y);
        const baseX = scene.originX + (leaf.x + swayed) * world;
        const baseY = groundY - leaf.y * world;
        const flutter = Math.sin(seconds * 2.3 + leaf.phase) * 7;
        const size = leaf.size * world;
        const dim = selected !== null && leaf.kind !== selected;
        const toOchre = clamp01(dry * (leaf.fall < 2 ? 1.1 : 0.45));
        const color = rampAt(LEAF_RAMPS[leaf.hue], toOchre);
        const fading = selected === null ? 1 : dim ? 0.28 : 1;

        if (p < leaf.fall) {
          drawLeaf(ctx!, baseX, baseY, -leaf.angle + flutter, size * smooth(opened), color, fading);
        } else {
          const fall = clamp01((p - leaf.fall) / 0.09);
          if (fall < 1) {
            const dropY = baseY + (groundY - baseY) * fall * fall;
            const dropX = baseX + leaf.drift * world * fall * 0.6 + Math.sin(fall * 8 + leaf.phase) * 14 * fall;
            drawLeaf(ctx!, dropX, dropY, -leaf.angle + fall * 420 + leaf.phase * 40, size, color, fading * (1 - fall * fall));
          }
          const back = (p - leaf.regrow) / 0.04;
          if (back > 0) {
            drawLeaf(ctx!, baseX, baseY, -leaf.angle + flutter, size * smooth(back) * 1.05, LEAF_RAMPS[leaf.hue][0], fading);
          }
        }
      }

      // Leaves shaken loose by a click. Real physics, not tied to progress.
      if (bursts.length) {
        for (const leaf of bursts) {
          leaf.vy += 60 * dt;
          leaf.vx *= 0.98;
          leaf.x += leaf.vx * dt;
          leaf.y += leaf.vy * dt;
          leaf.angle += leaf.spin * dt;
          leaf.life -= dt * 0.4;
          if (leaf.y >= groundY) leaf.life = 0;
          drawLeaf(ctx!, leaf.x, leaf.y, leaf.angle, 3.4 * world, LEAF_RAMPS[leaf.hue][0], clamp01(leaf.life));
        }
        bursts = bursts.filter((leaf) => leaf.life > 0);
      }
      ctx!.setTransform(scale, 0, 0, scale, 0, 0);
      ctx!.globalAlpha = 1;
    }

    function loop(now: number) {
      if (visible) draw(now);
      frame = requestAnimationFrame(loop);
    }

    function onMove(event: PointerEvent) {
      const box = element!.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
    }
    function onLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }
    function onClick(event: MouseEvent) {
      if ((event.target as Element).closest("a,button,input")) return;
      const p = clamp01(progress.get());
      if (still || p < 0.4) return;
      gust = 1;
      const box = element!.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      if (bursts.length > 40 || p < 0.6) return;
      for (let i = 0; i < 9; i++) {
        bursts.push({
          x: x + (Math.random() - 0.5) * 50,
          y: y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 90,
          vy: -30 - Math.random() * 50,
          angle: Math.random() * 360,
          spin: (Math.random() - 0.5) * 300,
          hue: Math.floor(Math.random() * 4),
          life: 1,
        });
      }
    }

    redraw.current = () => draw(performance.now());
    const host = element.parentElement!;
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    watcher.observe(element);
    if (!still) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("click", onClick);
      frame = requestAnimationFrame(loop);
    }
    resize();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      watcher.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("click", onClick);
      redraw.current = () => {};
    };
  }, [plant, progress, still]);

  return <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
