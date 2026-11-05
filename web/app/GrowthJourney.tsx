"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState } from "react";

const HEADING = "text-[clamp(2.25rem,1.3rem+3.2vw,4rem)] leading-[1.02]";

const STAGES = [
  {
    name: "Semente",
    title: null,
    text: "A semente é o primeiro passo: entender o básico antes de colocar dinheiro. Passe para o lado e veja o resto do caminho.",
  },
  {
    name: "Raízes",
    title: "Primeiro, as raízes",
    text: "Antes de crescer para cima, a planta cresce para baixo. Uma reserva para imprevistos evita vender na pior hora.",
  },
  {
    name: "Broto",
    title: "Depois, a constância",
    text: "Investir um pouco todo mês cria o hábito e diminui o peso de acertar o dia certo.",
  },
  {
    name: "Galhos",
    title: "Cada galho, um risco",
    text: "Renda fixa, ações e fundos imobiliários reagem de formas diferentes. Se um galho sofre, os outros podem sustentar a planta.",
  },
  {
    name: "Árvore",
    title: "O tempo faz o resto",
    text: "Juros sobre juros precisam de anos. Nenhuma árvore cresce em linha reta: haverá secas, e o que cresceu até aqui não garante o futuro.",
  },
];

const ROOTS = [
  "M300 486 C298 515 290 540 262 566",
  "M300 486 C304 520 316 548 344 580",
  "M298 505 C270 515 240 520 190 540",
  "M303 510 C335 516 370 524 418 536",
  "M292 530 C280 545 262 570 258 600",
  "M316 545 C335 552 350 556 372 552",
];

const STEM = "M300 486 C296 420 308 360 300 300 C294 240 304 180 300 110";

const BRANCHES = [
  "M301 360 C260 340 225 320 175 300",
  "M300 330 C345 310 385 290 430 262",
  "M298 260 C255 235 225 215 190 180",
  "M301 230 C345 205 380 185 415 150",
  "M300 170 C275 140 262 120 250 85",
  "M300 150 C325 125 340 105 355 75",
];

const LEAF = "M0 0 C12 -16 38 -18 60 0 C38 18 12 16 0 0Z";
const LEAF_COLORS = ["#cbf751", "#8fc95a", "#5d9e5f"];

/** x, y, rotation, size, color. In the order they open. */
const SPROUT_LEAVES = [
  [298, 430, -150, 0.8, 1],
  [300, 410, -30, 0.9, 0],
  [303, 372, -155, 0.9, 1],
  [302, 350, -20, 1, 0],
] as const;

const CROWN_LEAVES = [
  [235, 325, -165, 1, 2],
  [205, 312, 150, 1.1, 1],
  [175, 300, -170, 1.2, 0],
  [175, 300, 140, 1, 2],
  [350, 308, -60, 1, 2],
  [392, 285, 40, 1.1, 1],
  [430, 262, -30, 1.2, 0],
  [430, 262, 30, 1, 2],
  [250, 232, -130, 1, 1],
  [222, 212, 170, 1.1, 2],
  [190, 180, -150, 1.2, 0],
  [190, 180, 160, 1, 1],
  [345, 205, 25, 1, 1],
  [380, 185, -60, 1.1, 2],
  [415, 150, -35, 1.2, 0],
  [415, 150, 20, 1, 1],
  [272, 138, -170, 1, 2],
  [250, 85, -110, 1.2, 0],
  [250, 85, -170, 1, 1],
  [330, 118, 10, 1, 2],
  [355, 75, -70, 1.2, 0],
  [355, 75, -10, 1, 1],
  [300, 110, -90, 1.3, 0],
  [300, 110, -130, 1, 2],
  [300, 110, -50, 1, 1],
] as const;

function Line({
  d,
  progress,
  from,
  to,
  color,
  width,
}: {
  d: string;
  progress: MotionValue<number>;
  from: number;
  to: number;
  color: string;
  width: number | MotionValue<number>;
}) {
  const pathLength = useTransform(progress, [from, to], [0, 1]);
  const opacity = useTransform(progress, [from, from + 0.01], [0, 1]);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      style={{ pathLength, opacity, strokeWidth: width }}
    />
  );
}

function Leaf({
  leaf,
  progress,
  from,
  to,
}: {
  leaf: readonly [number, number, number, number, number];
  progress: MotionValue<number>;
  from: number;
  to: number;
}) {
  const [x, y, rotation, size, color] = leaf;
  const scale = useTransform(progress, [from, to], [0, size]);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <motion.path d={LEAF} fill={LEAF_COLORS[color]} style={{ scale, originX: 0, originY: 0.5 }} />
    </g>
  );
}

function Plant({ progress }: { progress: MotionValue<number> }) {
  const zoom = useTransform(progress, [0, 0.3, 0.75], [1.9, 1.5, 1]);
  // While the plant is small, the ground rises so the seed sits in the middle of the view.
  const rise = useTransform(progress, [0, 0.3, 0.75], [-190, -110, 0]);
  const seed = useTransform(progress, [0, 0.3], [1, 0]);
  const trunk = useTransform(progress, [0.3, 1], [5, 15]);
  return (
    <svg
      viewBox="0 0 600 640"
      aria-hidden="true"
      className="h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMax meet"
    >
      <motion.g style={{ y: rise, scale: zoom, transformBox: "view-box", transformOrigin: "300px 486px" }}>
        <path
          d="M70 480 C140 462 460 462 530 480 C520 590 400 625 300 625 C200 625 80 590 70 480Z"
          fill="#0b2420"
        />
        {ROOTS.map((d, index) => (
          <Line
            key={d}
            d={d}
            progress={progress}
            from={0.08 + index * 0.025}
            to={0.24 + index * 0.025}
            color="var(--color-forest-soft)"
            width={3}
          />
        ))}
        <motion.ellipse
          cx="300"
          cy="490"
          rx="17"
          ry="12"
          fill="#d9b37a"
          style={{ scale: seed, originX: 0.5, originY: 0.5 }}
        />
        <Line d={STEM} progress={progress} from={0.28} to={0.72} color="var(--color-lime)" width={trunk} />
        {BRANCHES.map((d, index) => (
          <Line
            key={d}
            d={d}
            progress={progress}
            from={0.55 + index * 0.035}
            to={0.72 + index * 0.035}
            color="var(--color-lime)"
            width={5}
          />
        ))}
        {SPROUT_LEAVES.map((leaf, index) => (
          <Leaf key={index} leaf={leaf} progress={progress} from={0.36 + index * 0.04} to={0.46 + index * 0.04} />
        ))}
        {CROWN_LEAVES.map((leaf, index) => {
          const from = 0.72 + (index / CROWN_LEAVES.length) * 0.22;
          return <Leaf key={index} leaf={leaf} progress={progress} from={from} to={from + 0.06} />;
        })}
      </motion.g>
    </svg>
  );
}

/** The growth stages of investing. The page keeps scrolling normally: only the sideways move grows the plant. */
export function GrowthJourney() {
  const scroller = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const reduced = useReducedMotion();
  const { scrollXProgress } = useScroll({ container: scroller });
  const smooth = useSpring(scrollXProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  const last = STAGES.length - 1;

  useMotionValueEvent(scrollXProgress, "change", (value) => setCurrent(Math.round(value * last)));

  function goTo(index: number) {
    const element = scroller.current;
    if (!element) return;
    element.scrollTo({ left: index * element.clientWidth, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <section
      aria-label="As etapas de crescimento ao investir"
      className="on-forest relative h-[calc(100svh-6rem)] min-h-[640px] overflow-hidden bg-forest text-mist sm:h-[calc(100svh-3.5rem)] lg:max-h-[860px] lg:min-h-[520px]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-2 h-[38svh] lg:inset-y-6 lg:right-[max(1rem,calc((100vw-84rem)/2))] lg:left-auto lg:h-auto lg:w-[46%] lg:pb-14">
        <Plant progress={reduced ? scrollXProgress : smooth} />
      </div>

      <div
        ref={scroller}
        tabIndex={0}
        role="group"
        aria-label="Etapas. Use as setas para passar"
        className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {STAGES.map((stage) => (
          <article key={stage.name} className="h-full w-full shrink-0 snap-start snap-always">
            <div className="mx-auto flex h-full max-w-6xl flex-col px-4 pt-[40svh] pb-28 sm:px-8 lg:justify-center lg:pt-0 lg:pb-24">
              <div className="space-y-5 lg:w-1/2">
                <p className="font-semibold text-lime">{stage.name}</p>
                {stage.title ? (
                  <h2 className={HEADING}>{stage.title}</h2>
                ) : (
                  <h1 className="text-[11.4vw] leading-[0.95] sm:text-[6.5vw] lg:text-[5.4vw] 2xl:text-[5.5rem]">
                    Investir em
                    <br />
                    palavras simples
                  </h1>
                )}
                <p className="max-w-[46ch] text-lg leading-snug sm:text-xl">{stage.text}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <nav
        aria-label="Etapas do crescimento"
        className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
      >
        <ol className="flex flex-wrap gap-x-3 gap-y-1 text-sm sm:gap-x-5">
          {STAGES.map((stage, index) => (
            <li key={stage.name}>
              <button
                type="button"
                aria-current={index === current ? "step" : undefined}
                onClick={() => goTo(index)}
                className={`py-1 underline-offset-4 hover:text-lime ${
                  index === current ? "font-semibold text-lime underline" : "text-forest-soft"
                }`}
              >
                {stage.name}
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => goTo(current === last ? 0 : current + 1)}
          className="shrink-0 self-end rounded-full bg-lime px-4 py-2 text-sm font-semibold text-forest hover:bg-mist"
        >
          {current === last ? "Voltar ao início" : "Próxima etapa"}
        </button>
      </nav>
    </section>
  );
}
