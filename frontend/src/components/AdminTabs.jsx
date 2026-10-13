import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

const tab = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? "bg-primary-500 text-white" : "bg-white text-primary-600 ring-1 ring-primary-100 hover:bg-primary-50"}`;

export default function AdminTabs() {
  const { t } = useLanguage();
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <NavLink to="/admin/recipes" className={tab}>
        {t("adminTabs.recipes")}
      </NavLink>
      <NavLink to="/admin/orders" className={tab}>
        {t("adminTabs.orders")}
      </NavLink>
    </div>
  );
}
