import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * Fictional testimonials written for this demo project — NOT real people.
 * The text/names live in i18n/translations.js (landing.testimonials.items);
 * only the star ratings are defined here.
 */
const RATINGS = [5, 5, 4, 4];

/** Renders `rating` filled stars out of 5 (rating is 4 or 5 in practice here). */
function StarRating({ rating }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-1" aria-label={t("landing.testimonials.stars", { n: rating })}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={18}
          className={i < rating ? "fill-accent-500 text-accent-500" : "text-primary-100"}
        />
      ))}
    </div>
  );
}

export default function TestimonialCarousel() {
  const { t, isRTL } = useLanguage();
  const TESTIMONIALS = t("landing.testimonials.items");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, [TESTIMONIALS.length]);

  const go = (dir) => setIndex((i) => (i + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
  const current = { ...TESTIMONIALS[index], rating: RATINGS[index] };
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="card flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-14">
        <Quote size={32} className="text-accent-400" />
        <StarRating rating={current.rating} />
        <p className="font-display text-lg font-semibold leading-relaxed text-primary-900 sm:text-xl">
          “{current.quote}”
        </p>
        <div>
          <p className="font-display font-bold text-primary-800">{current.name}</p>
          <p className="text-sm text-primary-400">{current.role}</p>
        </div>
      </div>

      <button
        onClick={() => go(-1)}
        aria-label={t("landing.testimonials.prev")}
        className="absolute start-0 top-1/2 hidden -translate-y-1/2 rounded-full ltr:-translate-x-4 rtl:translate-x-4 bg-white p-2 text-primary-500 shadow-card hover:bg-primary-50 sm:flex"
      >
        <PrevIcon size={20} />
      </button>
      <button
        onClick={() => go(1)}
        aria-label={t("landing.testimonials.next")}
        className="absolute end-0 top-1/2 hidden -translate-y-1/2 rounded-full ltr:translate-x-4 rtl:-translate-x-4 bg-white p-2 text-primary-500 shadow-card hover:bg-primary-50 sm:flex"
      >
        <NextIcon size={20} />
      </button>

      <div className="mt-5 flex items-center justify-center gap-2">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={t("landing.testimonials.show", { n: i + 1 })}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-primary-500" : "w-2 bg-primary-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
