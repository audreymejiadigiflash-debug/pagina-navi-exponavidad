"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 ? (
        <div role="group" aria-label="Fotos del producto" className="flex gap-3 md:flex-col">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-pressed={index === activeIndex}
              aria-label={`Ver foto ${index + 1} de ${images.length}`}
              className={`relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-ivory md:w-20 ${index === activeIndex ? "outline outline-1 outline-offset-2 outline-ink" : "opacity-70 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-ivory">
        {active ? (
          <Image
            key={active}
            src={active}
            alt={name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-fade-up object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" role="img" aria-label={name}>
            <span className="font-serif text-7xl text-line-strong" aria-hidden="true">
              N
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
