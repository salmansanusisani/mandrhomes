"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const slides = [
  {
    image: "/brand/hero-gallery.jpg",
    alt: "A gallery wall layered with art, sculptural objects and warm lighting",
    eyebrow: "The M&R home edit · Abuja",
    title: "Turning spaces",
    accent: "into masterpieces.",
    copy: "Sculptural plants, hand-finished planters and quiet objects — curated for rooms that feel personal, layered and lived in.",
    href: "/products",
    label: "Shop the collection",
    secondaryHref: "/products?category=decor",
    secondaryLabel: "Explore décor",
  },
  {
    image: "/brand/hero-living.avif",
    alt: "A layered living room with sculptural furniture and greenery",
    eyebrow: "The living edit",
    title: "Blending elegance",
    accent: "with excellence.",
    copy: "Considered furniture, soft rugs and statement seating chosen to work together — and to grow with the way you actually live.",
    href: "/products?category=furniture",
    label: "Shop furniture",
    secondaryHref: "/products?category=rugs",
    secondaryLabel: "Browse rugs",
  },
  {
    image: "/brand/hero-plants.jpg",
    alt: "A shelf of lush plants and textured planters",
    eyebrow: "The green edit",
    title: "Redefining interiors",
    accent: "with expertise.",
    copy: "Layer leaf shape, height and texture rather than simply filling a corner. Our greenery is chosen to be sculptural on its own and richer as a collection.",
    href: "/products?category=plants",
    label: "Shop plants",
    secondaryHref: "/products?category=planters",
    secondaryLabel: "Find a planter",
  },
] as const;

export function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [active, paused]);

  const goTo = (index: number) => setActive((index + slides.length) % slides.length);

  return (
    <section
      className="relative isolate overflow-hidden bg-brand-dark text-cream"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="M&R Homes highlights"
    >
      <div className="relative min-h-[540px] sm:min-h-[620px] lg:min-h-[690px]">
        {slides.map((slide, index) => {
          const isActive = index === active;
          return (
            <article
              key={slide.image}
              aria-hidden={!isActive}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className={`object-cover transition-transform duration-[7000ms] ease-out ${
                  isActive ? "scale-105" : "scale-100"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/30 via-brand-dark/5 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/20 via-transparent to-transparent" />

              <div className="container-page relative flex h-full items-end pb-20 pt-28 sm:pb-24 lg:pb-28">
                <div className="max-w-2xl">
                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-cream/90 [text-shadow:0_1px_6px_rgba(10,17,48,0.95)]">
                    <Sparkles className="h-3.5 w-3.5" /> {slide.eyebrow}
                  </p>
                  <h1 className="display mt-5 text-[2.8rem] font-semibold leading-[0.98] [text-shadow:0_2px_4px_rgba(10,17,48,0.95),0_6px_20px_rgba(10,17,48,0.85),0_14px_48px_rgba(10,17,48,0.7)] sm:text-6xl xl:text-7xl">
                    {slide.title}
                    <br />
                    <span className="text-cream/90">{slide.accent}</span>
                  </h1>
                  <p className="mt-6 max-w-lg text-sm leading-relaxed text-cream/95 [text-shadow:0_1px_3px_rgba(10,17,48,0.95),0_4px_18px_rgba(10,17,48,0.9),0_10px_40px_rgba(10,17,48,0.75)] sm:text-base">{slide.copy}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href={slide.href}
                      tabIndex={isActive ? 0 : -1}
                      className="btn h-12 bg-cream px-7 text-[15px] text-brand-dark hover:bg-white"
                    >
                      {slide.label} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={slide.secondaryHref}
                      tabIndex={isActive ? 0 : -1}
                      className="btn h-12 border border-white/30 bg-brand-dark/35 px-6 text-cream backdrop-blur-sm hover:bg-brand-dark/55"
                    >
                      {slide.secondaryLabel}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        <button
          type="button"
          onClick={() => goTo(active - 1)}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-brand-dark/40 text-white backdrop-blur transition hover:border-white/40 hover:bg-brand-dark/70 sm:left-5 lg:left-8"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-brand-dark/40 text-white backdrop-blur transition hover:border-white/40 hover:bg-brand-dark/70 sm:right-5 lg:right-8"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="container-page absolute inset-x-0 bottom-7 z-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose a slide">
            {slides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === active ? "w-10 bg-white" : "w-4 bg-white/35 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/50">
            {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </section>
  );
}
