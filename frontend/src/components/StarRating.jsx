import { useState } from "react";
import { Star } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

/** Read-only: "★ 4.5 (12)". Shows a muted message when nobody has rated yet. */
export function StarDisplay({ average = 0, count = 0, size = 15, className = "" }) {
  const { t } = useLanguage();
  if (!count) {
    return <span className={`text-xs text-primary-400 ${className}`}>{t("stars.none")}</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 text-sm ${className}`} aria-label={t("stars.avgAria", { avg: average, count })}>
      <Star size={size} className="fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="font-bold text-primary-800">{Number(average).toFixed(1)}</span>
      <span className="text-primary-400">({count})</span>
    </span>
  );
}

/** Five clickable stars (works with mouse, touch and keyboard). */
export function StarInput({ value = 0, onChange, disabled = false, size = 32 }) {
  const { t } = useLanguage();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={t("stars.pick")} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t("stars.starAria", { n })}
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
