import { NavLink, Link } from "react-router-dom";
import { ChefHat, CalendarDays, ShoppingBasket, BookOpen, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/recipes", label: "Recipes", icon: BookOpen },
  { to: "/planner", label: "Meal Planner", icon: CalendarDays },
  { to: "/grocery-list", label: "Grocery List", icon: ShoppingBasket },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors sm:px-4 ${
    isActive ? "bg-primary-500 text-white" : "text-primary-600 hover:bg-primary-50"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-primary-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white shadow-card">
            <ChefHat size={20} />
          </span>
          <span className="hidden lg:inline">Foodly</span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-white p-1 shadow-card ring-1 ring-black/5">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={16} />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}

          {/* Right next to "Grocery List" */}
          {user ? (
            <>
              <span className="hidden items-center gap-1.5 px-3 text-sm font-semibold text-primary-700 sm:flex">
                <User size={16} /> {user.name.split(" ")[0]}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-accent-600 hover:bg-accent-400/10"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <NavLink
                to="/signup"
                className="rounded-full bg-accent-500 px-3 py-2 text-sm font-semibold text-white hover:bg-accent-600 sm:px-4"
              >
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
