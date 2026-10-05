import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

/**
 * Fictional testimonials written for this demo project — NOT real people.
 * Reusing a real person's name/quote to promote a different, unaffiliated
 * product would misrepresent them, so every reviewer here is made up on
 * purpose. Feel free to swap these for real feedback once Foodly has users.
 */
const TESTIMONIALS = [
  {
    quote:
      "I used to dread the \u201cwhat's for dinner\u201d question every single night. Foodly just tells me, and the grocery list is already sorted by the time I get to the store.",
    name: "Lina K.",
    role: "Home cook",
    rating: 5,
  },
  {
    quote:
      "The allergy filter alone sold me. I can finally browse recipes without reading every ingredient list twice.",
    name: "Dana R.",
    role: "Nutrition coach",
    rating: 5,
  },
  {
    quote:
      "Planning my week takes maybe five minutes now, and I stopped buying three of the same spice because I forgot I already had it.",
    name: "Marcus T.",
    role: "Software engineer",
    rating: 4,
  },
  {
    quote:
      "As a student I don't have time to think about food. Foodly basically runs that part of my life for me.",
    name: "Yara H.",
    role: "University student",
    rating: 4,
  },
];

/** Renders `rating` filled stars out of 5 (rating is 4 or 5 in practice here). */
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const go = (dir) => setIndex((i) => (i + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
  const current = TESTIMONIALS[index];

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
        aria-label="Previous testimonial"
        className="absolute left-0 top-1/2 hidden -translate-x-4 -translate-y-1/2 rounded-full bg-white p-2 text-primary-500 shadow-card hover:bg-primary-50 sm:flex"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next testimonial"
        className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-4 rounded-full bg-white p-2 text-primary-500 shadow-card hover:bg-primary-50 sm:flex"
      >
        <ChevronRight size={20} />
      </button>

      <div className="mt-5 flex items-center justify-center gap-2">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show testimonial ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-primary-500" : "w-2 bg-primary-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
