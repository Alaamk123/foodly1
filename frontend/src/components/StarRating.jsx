import { useState } from "react";
import { Star } from "lucide-react";

/** Read-only: "★ 4.5 (12)". Shows a muted message when nobody has rated yet. */
export function StarDisplay({ average = 0, count = 0, size = 15, className = "" }) {
  if (!count) {
    return <span className={`text-xs text-primary-400 ${className}`}>لا توجد تقييمات بعد</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 text-sm ${className}`} aria-label={`متوسط التقييم ${average} من 5 من ${count} تقييم`}>
      <Star size={size} className="fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="font-bold text-primary-800">{Number(average).toFixed(1)}</span>
      <span className="text-primary-400">({count})</span>
    </span>
  );
}

/** Five clickable stars (works with mouse, touch and keyboard). */
export function StarInput({ value = 0, onChange, disabled = false, size = 32 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="اختر تقييمك من 1 إلى 5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} من 5`}
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(n)}
          onFocus={() => !disabled && setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded-full p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star size={size} className={n <= shown ? "fill-amber-400 text-amber-400" : "text-primary-200"} />
        </button>
      ))}
    </div>
  );
}
