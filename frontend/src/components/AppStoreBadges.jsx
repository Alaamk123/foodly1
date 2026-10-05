import { Link } from "react-router-dom";
import { Apple, PlayCircle } from "lucide-react";

/**
 * Styled like App Store / Google Play badges, but Foodly isn't actually
 * published on either store — this is a design concept for the project.
 * Both buttons route to Sign Up, the one real action available today.
 */
export default function AppStoreBadges({ className = "" }) {
  const badgeClass =
    "flex items-center gap-3 rounded-2xl bg-primary-900 px-5 py-3 text-white shadow-card transition-transform hover:-translate-y-0.5 hover:bg-primary-800";

  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <Link to="/signup" className={badgeClass}>
        <Apple size={26} />
        <span className="text-left leading-tight">
          <span className="block text-[10px] text-primary-200">Download on the</span>
          <span className="block font-display text-base font-bold">App Store</span>
        </span>
      </Link>
      <Link to="/signup" className={badgeClass}>
        <PlayCircle size={26} />
        <span className="text-left leading-tight">
          <span className="block text-[10px] text-primary-200">Get it on</span>
          <span className="block font-display text-base font-bold">Google Play</span>
        </span>
      </Link>
    </div>
  );
}
