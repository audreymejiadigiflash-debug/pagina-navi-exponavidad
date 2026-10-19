"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type HeroLink = { href: string; label: string };

export type HeroSlide = {
  id: string;
  image: string;
  /** Tailwind object-position classes: keeps the products in view on narrow screens. */
  imagePosition: string;
  eyebrow: string;
  title: string;
  text: string;
  primary?: HeroLink;
  secondary?: HeroLink;
};

const INTERVAL_MS = 6500;
const SWIPE_MIN_PX = 40;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;
  // Reduced-motion users only change slides on demand.
  const playing = !userPaused && !reducedMotion && count > 1;

  useEffect(() => {
    if (!playing || hoverPaused) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [active, playing, hoverPaused, count]);

  const goTo = (index: number) => setActive((index + count) % count);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados de la temporada"
      className="relative isolate overflow-hidden bg-fir-deep"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setHoverPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHoverPaused(false);
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start === null || end === undefined || Math.abs(end - start) < SWIPE_MIN_PX) return;
        goTo(active + (end < start ? 1 : -1));
      }}
    >
      <div className="grid">
        {slides.map((slide, index) => {
          const isActive = index === active;
          const Heading = index === 0 ? "h1" : "h2";
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${count}: ${slide.title}`}
              aria-hidden={!isActive}
              inert={!isActive}
              className={`relative [grid-area:1/1] transition-opacity duration-700 ease-out motion-reduce:transition-none ${isActive ? "z-10 opacity-100" : "z-0 opacity-0"}`}
            >
              <Image
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className={`-z-10 object-cover ${slide.imagePosition}`}
              />
              <div
                className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/55 to-black/15 md:bg-gradient-to-r md:from-black/75 md:via-black/45 md:to-black/5"
                aria-hidden="true"
              />
              <div className="container-page flex min-h-[560px] items-end pb-28 pt-20 md:min-h-[680px] md:items-center md:pb-24">
                <div className={`max-w-xl text-white ${isActive ? "animate-fade-up" : ""}`}>
                  <span className="eyebrow text-[#e3cc9b]">{slide.eyebrow}</span>
                  <Heading className="mt-5 text-[2.6rem] leading-[1.04] text-white md:text-[4.25rem]">
                    {slide.title}
                  </Heading>
                  <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-white/85">{slide.text}</p>
                  {slide.primary || slide.secondary ? (
                    <div className="mt-10 flex flex-wrap gap-3">
                      {slide.primary ? (
                        <Link href={slide.primary.href} className="btn btn-light">
                          {slide.primary.label}
                        </Link>
                      ) : null}
                      {slide.secondary ? (
                        <Link href={slide.secondary.href} className="btn btn-ghost-light">
                          {slide.secondary.label}
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-6 z-20">
          <div className="container-page flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="Diapositiva anterior"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/15"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="Diapositiva siguiente"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/15"
            >
              <ArrowIcon direction="right" />
            </button>
            {reducedMotion ? null : (
              <button
                type="button"
                onClick={() => setUserPaused((paused) => !paused)}
                aria-label={userPaused ? "Reanudar el carrusel" : "Pausar el carrusel"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/15"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  {userPaused ? <path d="M7 4.5v15l13-7.5z" /> : <path d="M6 4h4v16H6zM14 4h4v16h-4z" />}
                </svg>
              </button>
            )}
            <ol className="ml-2 flex items-center" aria-label="Elegir diapositiva">
              {slides.map((slide, index) => (
                <li key={slide.id}>
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Ir a la diapositiva ${index + 1}: ${slide.title}`}
                    aria-current={index === active}
                    className="group inline-flex h-11 w-7 items-center justify-center"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-300 ${index === active ? "w-5 bg-white" : "w-1.5 bg-white/50 group-hover:bg-white/80"}`}
                    />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </section>
  );
}
