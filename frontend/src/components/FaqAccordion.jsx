import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";


export default function FaqAccordion() {
  const { t } = useLanguage();
  const FAQS = t("landing.faq.items");
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      {FAQS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="card overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
              aria-expanded={isOpen}
            >
              <span className="font-display font-semibold text-primary-900">{item.q}</span>
              <ChevronDown
                size={18}
                className={`flex-shrink-0 text-primary-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-primary-600">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
