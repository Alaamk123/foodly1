import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { fetchRecipes } from "../api/client";
import RecipeCard from "../components/RecipeCard";
import LoadingSpinner from "../components/LoadingSpinner";

const DIET_FILTERS = ["Keto", "Vegetarian", "Vegan", "Low Carb", "Paleo", "Gluten Free", "Dairy Free", "Pescatarian"];
const ALLERGEN_FILTERS = ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Gluten", "Soy", "Shellfish", "Fish"];

const toggleInList = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export default function RecipeCatalog() {
  const [recipes, setRecipes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeDiets, setActiveDiets] = useState([]);
  const [avoidAllergens, setAvoidAllergens] = useState([]);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = { page, limit: 12 };
    if (search) params.search = search;
    if (activeDiets.length) params.diet = activeDiets.join(",");
    if (avoidAllergens.length) params.excludeAllergens = avoidAllergens.join(",");

    fetchRecipes(params)
      .then((res) => {
        setRecipes(res.data);
        setPagination(res.pagination);
      })
      .catch(() => setError("Could not load recipes. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [search, activeDiets, avoidAllergens, page]);

  const hasFilters = activeDiets.length > 0 || avoidAllergens.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">Discover Recipes</h1>
          <p className="text-sm text-primary-500">
            {pagination ? `${pagination.total} recipes` : "Browse recipes"} — filter by diet or allergy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-card ring-1 ring-black/5">
            <Search size={16} className="text-primary-400" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search recipes..."
              className="w-40 bg-transparent text-sm outline-none placeholder:text-primary-300 sm:w-56"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`btn-secondary !px-4 ${showFilters ? "!bg-primary-500 !text-white" : ""}`}
            aria-label="Filters"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 flex flex-col gap-4 rounded-xl2 bg-white p-4 shadow-card ring-1 ring-black/5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-primary-400">Diet:</span>
            {DIET_FILTERS.map((diet) => (
              <button
                key={diet}
                onClick={() => {
                  setPage(1);
                  setActiveDiets((p) => toggleInList(p, diet));
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeDiets.includes(diet)
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-primary-100 text-primary-600 hover:border-primary-300"
                }`}
              >
                {diet}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-primary-400">Without:</span>
            {ALLERGEN_FILTERS.map((a) => (
              <button
                key={a}
                onClick={() => {
                  setPage(1);
                  setAvoidAllergens((p) => toggleInList(p, a));
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  avoidAllergens.includes(a)
                    ? "border-accent-500 bg-accent-500 text-white"
                    : "border-primary-100 text-primary-600 hover:border-primary-300"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={() => {
                setActiveDiets([]);
                setAvoidAllergens([]);
                setPage(1);
              }}
              className="flex items-center gap-1 self-start text-xs font-semibold text-accent-600 hover:underline"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Cooking up recipes..." />
      ) : error ? (
        <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
          <p className="font-display font-bold text-red-600">{error}</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
          <p className="font-display font-bold text-primary-800">No recipes match your filters.</p>
          <p className="mt-1 text-sm text-primary-500">Try clearing a filter or searching a different term.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                    p === page ? "bg-primary-500 text-white" : "bg-white text-primary-600 hover:bg-primary-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
