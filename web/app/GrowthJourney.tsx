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
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PlantCanvas } from "./PlantCanvas";

const HEADING = "text-[clamp(2.25rem,1.3rem+3.2vw,4rem)] leading-[1.02]";
const SCROLL_PER_STAGE_SVH = 85;
const noop = () => () => {};

const STAGES = [
  {
    name: "Semente",
    title: null,
    text: "A semente é o primeiro passo: entender o básico antes de colocar dinheiro. Role, arraste ou deslize para o lado e veja o resto do caminho.",
  },
  {
    name: "Raízes",
    title: "Primeiro, as raízes",
    text: "Antes de crescer para cima, a planta cresce para baixo. Uma reserva para imprevistos evita vender na pior hora.",
  },
  {
    name: "Broto",
    title: "Depois, a constância",
    text: "Investir parte do salário todo mês cria o hábito e tira o peso de escolher o dia certo.",
  },
  {
    name: "Galhos",
    title: "Cada galho, um risco",
    text: "Cada tipo de investimento reage de um jeito. Escolha um e veja o galho dele:",
  },
  {
    name: "Seca",
    title: "Toda árvore passa por secas",
    text: "Em algum momento os preços caem, e a carteira parece perder as folhas. Quem tem raízes não precisa vender no pior momento.",
  },
  {
    name: "Árvore",
    title: "O tempo faz o resto",
    text: "Juros sobre juros precisam de anos. Não há prazo garantido: o que cresceu até aqui não promete o futuro.",
  },
];

const LIMBS = [
  { name: "Renda fixa", text: "Paga juros combinados ou ligados a um índice. Em geral, oscila menos." },
  { name: "Ações", text: "Partes de empresas. Podem render mais e também cair muito." },
  { name: "Fundos imobiliários", text: "Recebem de aluguéis ou de juros de crédito. A cota oscila todo dia." },
];

const LIMBS_STAGE = 3;

function Stage({
  stage,
  index,
  progress,
  fades,
  limb,
  onLimb,
}: {
  stage: (typeof STAGES)[number];
  index: number;
  progress: MotionValue<number>;
  fades: boolean;
  limb: number | null;
  onLimb: (limb: number) => void;
}) {
  const center = index / (STAGES.length - 1);
  const opacity = useTransform(progress, (value) => {
    const distance = Math.abs(value - center);
    return Math.max(0, Math.min(1, 1 - (distance - 0.06) / 0.1));
  });
  return (
    <article className="h-full w-full shrink-0 snap-start snap-always">
      <motion.div
        style={fades ? { opacity } : undefined}
        className="mx-auto flex h-full max-w-6xl flex-col px-4 pt-[calc(38svh+3.5rem)] pb-28 sm:px-8 lg:justify-center lg:pt-0 lg:pb-24"
      >
        <div className="space-y-4 lg:w-[52%]">
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
          {index === LIMBS_STAGE && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {LIMBS.map((item, itemIndex) => (
                  <button
                    key={item.name}
                    type="button"
                    aria-pressed={limb === itemIndex}
                    onClick={() => onLimb(itemIndex)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      limb === itemIndex ? "bg-lime text-forest" : "bg-mist/15 text-mist hover:bg-mist/25"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <p role="status" className="min-h-12 max-w-[46ch]">
                {limb === null ? "" : LIMBS[limb].text}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </article>
  );
}

/**
 * The growth stages of investing, on a stage held in place while the vertical scroll moves it sideways.
 * Before JavaScript runs, and with reduced motion, it is a plain sideways row of panels.
 */
export function GrowthJourney() {
  const outer = useRef<HTMLElement>(null);
  const stageBox = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [limb, setLimb] = useState<number>(0);
  const reduced = useReducedMotion();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const pinned = hydrated && !reduced;
  const last = STAGES.length - 1;

  const { scrollYProgress } = useScroll({ target: outer, offset: ["start start", "end end"] });
  const { scrollXProgress } = useScroll({ container: row });
  const spring = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.0005 });
  const progress = pinned ? spring : scrollXProgress;
  const trackX = useTransform(progress, (value) => `${(-value * last * 100) / STAGES.length}%`);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (pinned) setCurrent(Math.round(value * last));
  });
  useMotionValueEvent(scrollXProgress, "change", (value) => {
    if (!pinned) setCurrent(Math.round(value * last));
  });

  function goTo(index: number) {
    if (!pinned) {
      row.current?.scrollTo({ left: index * row.current.clientWidth });
      return;
    }
    const box = outer.current!;
    const top = box.getBoundingClientRect().top + window.scrollY;
    const length = box.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (index / last) * length, behavior: "smooth" });
  }

  // Sideways gestures move the same scroll position as the wheel does.
  useEffect(() => {
    const box = stageBox.current;
    const section = outer.current;
    if (!box || !section || !pinned) return;
    const perPixel = () => (section.offsetHeight - window.innerHeight) / (last * box.clientWidth);

    function onWheel(event: WheelEvent) {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      window.scrollBy({ top: event.deltaX * perPixel(), behavior: "auto" });
    }

    let dragging = false;
    let startX = 0;
    function onDown(event: PointerEvent) {
      if ((event.target as Element).closest("a,button,input")) return;
      dragging = true;
      startX = event.clientX;
    }
    function onMove(event: PointerEvent) {
      if (!dragging) return;
      window.scrollBy({ top: (startX - event.clientX) * perPixel(), behavior: "auto" });
      startX = event.clientX;
    }
    function onUp() {
      dragging = false;
    }

    box.addEventListener("wheel", onWheel, { passive: false });
    box.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      box.removeEventListener("wheel", onWheel);
      box.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [pinned, last]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (!pinned || (event.target as Element).closest("a,button,input")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(Math.min(current + 1, last));
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(Math.max(current - 1, 0));
    }
  }

  return (
    <section
      ref={outer}
      aria-label="As etapas de crescimento ao investir"
      className="on-forest relative bg-forest text-mist"
      style={pinned ? { height: `calc(100svh + ${last * SCROLL_PER_STAGE_SVH}svh)` } : undefined}
    >
      <div
        ref={stageBox}
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="group"
        aria-label="Etapas. Use as setas para os lados para passar"
        className={`relative h-[calc(100svh-var(--header-height))] min-h-[600px] overflow-hidden lg:min-h-[520px] ${
          pinned ? "sticky top-[var(--header-height)] cursor-grab touch-pan-y select-none active:cursor-grabbing" : ""
        }`}
      >
        <PlantCanvas progress={progress} highlight={current === LIMBS_STAGE ? limb : null} still={reduced === true} />

        <div
          ref={row}
          className={`absolute inset-0 ${
            pinned ? "" : "flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          }`}
        >
          <motion.div
            style={pinned ? { x: trackX, width: `${STAGES.length * 100}%` } : { display: "contents" }}
            className="flex h-full"
          >
            {STAGES.map((stage, index) => (
              <div key={stage.name} className="h-full shrink-0" style={{ width: pinned ? `${100 / STAGES.length}%` : "100%" }}>
                <Stage stage={stage} index={index} progress={progress} fades={pinned} limb={limb} onLimb={setLimb} />
              </div>
            ))}
          </motion.div>
        </div>

        <nav
          aria-label="Etapas do crescimento"
          className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-4 sm:px-8"
        >
          {pinned && (
            <motion.div aria-hidden="true" style={{ scaleX: progress }} className="h-0.5 origin-left rounded-full bg-lime" />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            <div className="ml-auto flex items-center gap-4">
              <a href="#comece" className="text-sm text-forest-soft underline-offset-4 hover:text-lime hover:underline">
                Pular
              </a>
              <button
                type="button"
                onClick={() => goTo(current === last ? 0 : current + 1)}
                className="shrink-0 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-forest hover:bg-mist"
              >
                {current === last ? "Voltar ao início" : "Próxima etapa"}
              </button>
            </div>
          </div>
        </nav>
      </div>
    </section>
  );
}
