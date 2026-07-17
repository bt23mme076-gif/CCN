'use client';

import { useEffect, useRef, useState } from 'react';

interface SponsorSlideshowProps {
  businessName: string;
  images: string[];
  phone: string | null;
}

export default function SponsorSlideshow({ businessName, images, phone }: SponsorSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (idx: number) => {
    if (idx === current || fading) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 250);
  };

  const next = () => goTo((current + 1) % images.length);
  const prev = () => goTo((current - 1 + images.length) % images.length);

  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % images.length);
        setFading(false);
      }, 250);
    }, 3500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, images.length]);

  return (
    <div className="group relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* Image area */}
      <div className="relative aspect-video overflow-hidden bg-gray-50">
        <img
          src={images[current]}
          alt={`${businessName} — photo ${current + 1}`}
          className="w-full h-full object-cover transition-opacity duration-250"
          style={{ opacity: fading ? 0 : 1 }}
        />

        {/* Prev / Next arrows — only if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 text-sm font-bold"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 text-sm font-bold"
              aria-label="Next photo"
            >
              ›
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); goTo(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    i === current ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                  aria-label={`Go to photo ${i + 1}`}
                />
              ))}
            </div>

            {/* Photo counter badge */}
            <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {current + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {/* Info row */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{businessName}</p>
          {phone && (
            <a href={`tel:${phone}`} className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {phone}
            </a>
          )}
        </div>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Sponsored</span>
      </div>
    </div>
  );
}
