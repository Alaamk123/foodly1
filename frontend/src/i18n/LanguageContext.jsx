import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translations, SUPPORTED_LANGS } from "./translations";
import recipeTranslationsAr from "./recipeTranslation.ar.js";

const LANG_KEY = "foodly_lang";

const LanguageContext = createContext(null);

function getInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (SUPPORTED_LANGS.includes(saved)) return saved;
  } catch {
    /* localStorage unavailable */
  }
  return "en"; // the site opens in English by default; the Navbar toggle switches to Arabic
}

const lookup = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);
  const isRTL = lang === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  // "-u-nu-latn" keeps Latin digits (1, 2, 3) inside Arabic text, matching prices and kcal values
  const locale = isRTL ? "ar-u-nu-latn" : "en-US";

  // Whole-page language + direction (this is what makes the layout flip to RTL)
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.title = lookup(translations[lang], "meta.title");
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang, dir]);

  const toggleLang = useCallback(() => setLang((l) => (l === "en" ? "ar" : "en")), []);

  /** t("nav.recipes"), t("footer.rights", { year }), or arrays/objects (t("landing.faq.items")) */
  const t = useCallback(
    (path, params = {}) => {
      let value = lookup(translations[lang], path);
      if (value === undefined) value = lookup(translations.en, path); // fall back to English
      if (value === undefined) return path; // visible hint for a missing key
      if (typeof value === "function") return value(params);
      if (typeof value === "string") return value.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? `{${k}}`));
      return value;
    },
    [lang]
  );

  /** Translate a value that comes from the DB: term("diets", "Gluten-Free") */
  const term = useCallback(
    (group, value) => translations[lang][group]?.[value] ?? translations.en[group]?.[value] ?? value,
    [lang]
  );

  /** Ingredient names come back title-cased from the API ("Chicken Breast") */
  const ingredient = useCallback(
    (name) => translations[lang].ingredients?.[String(name).toLowerCase().trim()] ?? name,
    [lang]
  );

  /** Translate one backend message (exact text first, then the few messages that contain numbers/statuses). */
  const translateMessage = useCallback(
    (msg) => {
      if (lang !== "ar" || typeof msg !== "string") return msg;
      const exact = translations.ar.errors?.[msg];
      if (exact) return exact;
      let m = msg.match(/^You already have (\d+) recipes waiting for review\.$/);
      if (m) return `لديك بالفعل ${m[1]} وصفات بانتظار المراجعة.`;
      m = msg.match(/^This order is already (\w+) and can no longer be changed\.$/);
      if (m) return `هذا الطلب ${translations.ar.status.order[m[1]] ?? m[1]} ولا يمكن تغييره بعد الآن.`;
      return msg;
    },
    [lang]
  );

  /** Backend error -> translated text. Uses the server's message when there is one, otherwise the fallback key. */
  const apiError = useCallback(
    (err, fallbackKey = "common.serverError") => {
      const msg = err?.response?.data?.message;
      if (!msg) return t(fallbackKey);
      return translateMessage(msg);
    },
    [t, translateMessage]
  );

  /** Returns the recipe with title/description/tips/steps in the current language (if available) */
  const localizeRecipe = useCallback(
    (recipe) => {
      if (!recipe || lang !== "ar") return recipe;
      const tr = recipeTranslationsAr[recipe.title];
      if (!tr) return recipe;
      return {
        ...recipe,
        title: tr.title || recipe.title,
        description: tr.description || recipe.description,
        tips: tr.tips || recipe.tips,
        steps: tr.steps && tr.steps.length === recipe.steps?.length ? tr.steps : recipe.steps,
      };
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, isRTL, dir, locale, t, term, ingredient, apiError, translateMessage, localizeRecipe }),
    [lang, toggleLang, isRTL, dir, locale, t, term, ingredient, apiError, translateMessage, localizeRecipe]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
