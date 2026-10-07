import { Languages } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

/** One site-wide English/Arabic switch (lives in the Navbar). */
export default function LanguageToggle({ className = "" }) {
  const { t, toggleLang } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t("common.switchAria")}
      className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 ${className}`}
    >
      <Languages size={16} />
      <span>{t("common.switchLabel")}</span>
    </button>
  );
}
