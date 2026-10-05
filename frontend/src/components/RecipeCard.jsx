import { Link } from "react-router-dom";
import { Clock, Flame } from "lucide-react";
import DietBadge from "./DietBadge";
import RecipeImage from "./RecipeImage";

export default function RecipeCard({ recipe, actionSlot }) {
  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <div className="card group flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-card-hover">
      <Link to={`/recipes/${recipe._id}`} className="block">
        <div className="relative h-44 w-full overflow-hidden bg-primary-100">
          <RecipeImage src={recipe.image} alt={recipe.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {recipe.dietTags?.slice(0, 2).map((tag) => (
              <DietBadge key={tag} tag={tag} />
            ))}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link to={`/recipes/${recipe._id}`}>
          <h3 className="font-display text-base font-bold leading-snug text-primary-900 line-clamp-2">
            {recipe.title}
          </h3>
        </Link>

        <div className="flex items-center gap-4 text-sm text-primary-500">
          <span className="flex items-center gap-1">
            <Clock size={15} /> {totalTime} min
          </span>
          <span className="flex items-center gap-1">
            <Flame size={15} /> {recipe.calories} cal
          </span>
        </div>

        {actionSlot && <div className="mt-auto pt-1">{actionSlot}</div>}
      </div>
    </div>
  );
}
