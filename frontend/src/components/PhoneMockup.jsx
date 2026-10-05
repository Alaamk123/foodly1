import { Flame, Carrot, Beef, Milk, CheckCircle2, Circle } from "lucide-react";

/**
 * A hand-built, CSS-only phone frame with a miniature recreation of the
 * grocery list screen inside. No screenshot image is used — this keeps the
 * hero section fast and reliable (nothing to fail to load) while still
 * giving visitors a concrete sense of the product.
 */
export default function PhoneMockup({ className = "" }) {
  const rows = [
    { icon: Carrot, label: "Spinach", qty: "2 cup", done: true },
    { icon: Carrot, label: "Avocado", qty: "3 unit", done: true },
    { icon: Beef, label: "Chicken breast", qty: "4 unit", done: false },
    { icon: Milk, label: "Greek yogurt", qty: "1 cup", done: false },
  ];

  return (
    <div className={`relative mx-auto w-[260px] select-none sm:w-[300px] ${className}`}>
      <div className="rounded-[2.5rem] border-[10px] border-primary-900 bg-primary-900 shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.8rem] bg-cream-50">
          {/* Notch */}
          <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-primary-900" />

          <div className="flex h-[520px] flex-col pt-7">
            {/* Mini status bar */}
            <div className="flex items-center justify-between px-5 pb-2">
              <span className="font-display text-xs font-bold text-primary-900">Grocery List</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-400">
                <Flame size={11} /> 1,840 kcal
              </span>
            </div>

            {/* Progress bar */}
            <div className="mx-5 mb-3 h-1.5 overflow-hidden rounded-full bg-primary-100">
              <div className="h-full w-1/2 rounded-full bg-primary-500" />
            </div>

            {/* Category block */}
            <div className="mx-3 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-1.5 border-b border-primary-50 bg-primary-50/70 px-3 py-2">
                <Carrot size={13} className="text-primary-500" />
                <span className="text-[11px] font-bold text-primary-800">Produce</span>
              </div>
              {rows.slice(0, 2).map((r) => (
                <Row key={r.label} {...r} />
              ))}
            </div>

            <div className="mx-3 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-1.5 border-b border-primary-50 bg-primary-50/70 px-3 py-2">
                <Beef size={13} className="text-primary-500" />
                <span className="text-[11px] font-bold text-primary-800">Meat &amp; Dairy</span>
              </div>
              {rows.slice(2).map((r) => (
                <Row key={r.label} {...r} />
              ))}
            </div>

            <div className="mt-auto flex items-center justify-around border-t border-primary-100 bg-white py-3">
              {[Carrot, Flame, Beef].map((Icon, i) => (
                <span
                  key={i}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    i === 1 ? "bg-primary-500 text-white" : "text-primary-300"
                  }`}
                >
                  <Icon size={15} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-4 top-10 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary-700 shadow-card sm:-right-8">
        <CheckCircle2 size={14} className="text-primary-500" /> Synced
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, qty, done }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {done ? (
        <CheckCircle2 size={14} className="flex-shrink-0 text-primary-500" />
      ) : (
        <Circle size={14} className="flex-shrink-0 text-primary-200" />
      )}
      <Icon size={12} className="flex-shrink-0 text-primary-300" />
      <span className={`flex-1 text-[11px] ${done ? "text-primary-300 line-through" : "text-primary-700"}`}>
        {label}
      </span>
      <span className="text-[10px] font-semibold text-primary-400">{qty}</span>
    </div>
  );
}
