import { NavLink } from "react-router-dom";

const tab = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? "bg-primary-500 text-white" : "bg-white text-primary-600 ring-1 ring-primary-100 hover:bg-primary-50"}`;

export default function AdminTabs() {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <NavLink to="/admin/recipes" className={tab}>
        مراجعة الوصفات
      </NavLink>
      <NavLink to="/admin/orders" className={tab}>
        إدارة الطلبات
      </NavLink>
    </div>
  );
}
