import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is Foodly free to use?",
    a: "Yes. Creating an account, browsing recipes, planning your week, and building your grocery list are all free.",
  },
  {
    q: "Do I need to download an app?",
    a: "No — Foodly runs entirely in your browser and works on phone, tablet, or desktop. The app store badges below are part of this project's design concept for future native apps.",
  },
  {
    q: "Can Foodly handle food allergies and specific diets?",
    a: "Yes. During setup you can exclude allergens like dairy, gluten, nuts, or shellfish, and filter recipes by diets such as Keto, Vegetarian, Vegan, Paleo, or Low Carb.",
  },
  {
    q: "How does the grocery list get built?",
    a: "Every recipe you add to your weekly plan contributes its ingredients. Foodly merges duplicates, scales quantities to your servings, and groups everything by supermarket aisle automatically.",
  },
  {
    q: "Can I change my meal plan after I've added recipes?",
    a: "Yes, any time. Remove a meal from a slot, swap in a different recipe, or clear the whole week and start over.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      {FAQS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className="card overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
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
