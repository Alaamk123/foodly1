import { useState } from "react";
import { Link } from "react-router-dom";
import { ChefHat, Plus, Trash2, ImagePlus, Loader2, CheckCircle2 } from "lucide-react";
import { uploadRecipeImage, submitRecipe, assetUrl } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";

// These lists mirror the backend enums (backend/models/Recipe.js). The backend re-validates everything.
const DIET_TAGS = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Low-Carb", "Keto", "Paleo", "Pescatarian", "Other"];
const ALLERGENS = ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Gluten", "Soy", "Fish", "Shellfish"];
// Shown through term("difficulty" | "categories" | "diets" | "allergens", value) so they follow the site language.
const DIFFICULTIES = ["Easy", "Medium", "Advanced"];
const CATEGORIES = ["Produce", "Dairy & Eggs", "Meat & Seafood", "Pantry", "Frozen", "Snacks", "Bakery", "Spices & Seasonings", "Other"];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const emptyIngredient = () => ({ name: "", quantity: "", unit: "", category: "Other" });
const emptyForm = () => ({
  title: "",
  description: "",
  image: "",
  prepTimeMinutes: "",
  cookTimeMinutes: "",
  servings: "4",
  calories: "",
  difficulty: "Easy",
  dietTags: [],
  allergens: [],
  ingredients: [emptyIngredient()],
  steps: [""],
  tips: "",
});

const inputClass =
  "w-full rounded-xl border border-primary-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

// Quick checks so people get instant feedback. The server is the real validator.
function validate(f, t) {
  const e = {};
  if (f.title.trim().length < 3 || f.title.trim().length > 100) e.title = t("submit.vTitle");
  if (f.description.length > 500) e.description = t("submit.vDesc");
  if (!f.image) e.image = t("submit.vImage");
  const int = (v, min, max) => /^\d+$/.test(String(v).trim()) && Number(v) >= min && Number(v) <= max;
  if (!int(f.prepTimeMinutes, 0, 1440)) e.prepTimeMinutes = t("submit.vRange", { min: 0, max: 1440 });
  if (!int(f.cookTimeMinutes, 0, 1440)) e.cookTimeMinutes = t("submit.vRange", { min: 0, max: 1440 });
  if (!int(f.servings, 1, 50)) e.servings = t("submit.vServings");
  if (!int(f.calories, 0, 5000)) e.calories = t("submit.vCalories");
  f.ingredients.forEach((ing, i) => {
    if (!ing.name.trim()) e[`ingredients[${i}].name`] = t("submit.vIngName");
    if (!/^\d+(\.\d+)?$/.test(ing.quantity.trim())) e[`ingredients[${i}].quantity`] = t("submit.vIngQty");
    if (!ing.unit.trim()) e[`ingredients[${i}].unit`] = t("submit.vIngUnit");
  });
  f.steps.forEach((s, i) => {
    if (!s.trim()) e[`steps[${i}]`] = t("submit.vStep");
  });
  return e;
}

export default function SubmitRecipe() {
  const { t, term, apiError, translateMessage } = useLanguage();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (field, value) =>
    set({ [field]: form[field].includes(value) ? form[field].filter((v) => v !== value) : [...form[field], value] });
  const setIngredient = (i, patch) => set({ ingredients: form.ingredients.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) });
  const setStep = (i, value) => set({ steps: form.steps.map((x, idx) => (idx === i ? value : x)) });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return setErrors((p) => ({ ...p, image: t("submit.imageType") }));
    }
    if (file.size > MAX_IMAGE_BYTES) return setErrors((p) => ({ ...p, image: t("submit.imageSize") }));

    setUploading(true);
    setErrors((p) => ({ ...p, image: undefined }));
    try {
      const { url } = await uploadRecipeImage(file);
      set({ image: url });
    } catch (err) {
      setErrors((p) => ({ ...p, image: apiError(err, "submit.uploadError") }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const local = validate(form, t);
    setErrors(local);
    if (Object.keys(local).length) {
      setFormError(t("submit.fixErrors"));
      return;
    }

    setSubmitting(true);
    try {
      await submitRecipe({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        prepTimeMinutes: Number(form.prepTimeMinutes),
        cookTimeMinutes: Number(form.cookTimeMinutes),
        servings: Number(form.servings),
        calories: Number(form.calories),
        ingredients: form.ingredients.map((i) => ({ ...i, name: i.name.trim(), quantity: i.quantity.trim(), unit: i.unit.trim() })),
        steps: form.steps.map((s) => s.trim()),
        tips: form.tips.trim(),
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // The backend lists which field is wrong: show it next to the field.
      const list = err.response?.data?.errors;
      if (Array.isArray(list)) setErrors(Object.fromEntries(list.map((x) => [x.field, translateMessage(x.message)])));
      setFormError(apiError(err, "submit.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="card p-8">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white">
            <CheckCircle2 size={28} />
          </span>
          <h1 className="font-display text-2xl font-extrabold text-primary-900">{t("submit.doneTitle")}</h1>
          <p className="mt-2 text-sm text-primary-600">{t("submit.doneText")}</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link to="/my-recipes" className="btn-primary">
              {t("submit.myRecipes")}
            </Link>
            <button
              className="btn-secondary"
              onClick={() => {
                setForm(emptyForm());
                setErrors({});
                setDone(false);
              }}
            >
              {t("submit.another")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="section-title flex items-center gap-2">
        <ChefHat size={24} /> {t("submit.title")}
      </h1>
      <p className="mb-6 mt-1 text-sm text-primary-500">{t("submit.subtitle")}</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {/* ---- basics ---- */}
        <section className="card flex flex-col gap-4 p-5">
          <Field label={t("submit.name")} error={errors.title}>
            <input className={inputClass} value={form.title} maxLength={100} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label={t("submit.description")} error={errors.description} hint={`${form.description.length}/500`}>
            <textarea className={inputClass} rows={3} maxLength={500} value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>

          <Field label={t("submit.image")} error={errors.image}>
            <div className="flex flex-wrap items-center gap-4">
              {form.image ? (
                <img src={assetUrl(form.image)} alt={t("submit.imagePreview")} className="h-24 w-32 rounded-xl object-cover ring-1 ring-black/5" />
              ) : (
                <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-primary-100 text-primary-300">
                  <ImagePlus size={28} />
                </div>
              )}
              <label className="btn-secondary cursor-pointer !px-4 !py-2 text-sm">
                {uploading ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />}
                {uploading ? t("submit.uploading") : form.image ? t("submit.changeImage") : t("submit.chooseImage")}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFile} disabled={uploading} />
              </label>
              <span className="text-xs text-primary-400">{t("submit.imageHint")}</span>
            </div>
          </Field>
        </section>

        {/* ---- numbers ---- */}
        <section className="card grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <Field label={t("submit.prep")} error={errors.prepTimeMinutes}>
            <input className={inputClass} inputMode="numeric" value={form.prepTimeMinutes} onChange={(e) => set({ prepTimeMinutes: e.target.value })} />
          </Field>
          <Field label={t("submit.cook")} error={errors.cookTimeMinutes}>
            <input className={inputClass} inputMode="numeric" value={form.cookTimeMinutes} onChange={(e) => set({ cookTimeMinutes: e.target.value })} />
          </Field>
          <Field label={t("submit.servings")} error={errors.servings}>
            <input className={inputClass} inputMode="numeric" value={form.servings} onChange={(e) => set({ servings: e.target.value })} />
          </Field>
          <Field label={t("submit.calories")} error={errors.calories}>
            <input className={inputClass} inputMode="numeric" value={form.calories} onChange={(e) => set({ calories: e.target.value })} />
          </Field>
          <Field label={t("submit.difficulty")}>
            <select className={inputClass} value={form.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {term("difficulty", d)}
                </option>
              ))}
            </select>
          </Field>
        </section>

        {/* ---- categories ---- */}
        <section className="card flex flex-col gap-4 p-5">
          <ChipGroup title={t("submit.dietTitle")} display={(v) => term("diets", v)} options={DIET_TAGS} selected={form.dietTags} onToggle={(v) => toggle("dietTags", v)} error={errors.dietTags} />
          <ChipGroup title={t("submit.allergenTitle")} display={(v) => term("allergens", v)} options={ALLERGENS} selected={form.allergens} onToggle={(v) => toggle("allergens", v)} error={errors.allergens} />
        </section>

        {/* ---- ingredients ---- */}
        <section className="card flex flex-col gap-3 p-5">
          <h2 className="font-display font-bold text-primary-900">{t("submit.ingredientsTitle")}</h2>
          {errors.ingredients && <p className="text-xs font-semibold text-red-600">{errors.ingredients}</p>}
          {form.ingredients.map((ing, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-primary-50/60 p-3 sm:grid-cols-12">
              <div className="col-span-2 sm:col-span-4">
                <input className={inputClass} placeholder={t("submit.ingName")} aria-label={t("submit.ingNameAria")} value={ing.name} onChange={(e) => setIngredient(i, { name: e.target.value })} />
                <FieldError text={errors[`ingredients[${i}].name`]} />
              </div>
              <div className="sm:col-span-2">
                <input className={inputClass} placeholder={t("submit.qty")} aria-label={t("submit.qty")} inputMode="decimal" value={ing.quantity} onChange={(e) => setIngredient(i, { quantity: e.target.value })} />
                <FieldError text={errors[`ingredients[${i}].quantity`]} />
              </div>
              <div className="sm:col-span-2">
                <input className={inputClass} placeholder={t("submit.unitPh")} aria-label={t("submit.unitAria")} value={ing.unit} onChange={(e) => setIngredient(i, { unit: e.target.value })} />
                <FieldError text={errors[`ingredients[${i}].unit`]} />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <select className={inputClass} aria-label={t("submit.catAria")} value={ing.category} onChange={(e) => setIngredient(i, { category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {term("categories", c)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                aria-label={t("submit.removeIng")}
                disabled={form.ingredients.length === 1}
                onClick={() => set({ ingredients: form.ingredients.filter((_, idx) => idx !== i) })}
                className="col-span-2 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-30 sm:col-span-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary self-start !px-4 !py-2 text-sm" disabled={form.ingredients.length >= 60} onClick={() => set({ ingredients: [...form.ingredients, emptyIngredient()] })}>
            <Plus size={16} /> {t("submit.addIng")}
          </button>
        </section>

        {/* ---- steps ---- */}
        <section className="card flex flex-col gap-3 p-5">
          <h2 className="font-display font-bold text-primary-900">{t("submit.stepsTitle")}</h2>
          {errors.steps && <p className="text-xs font-semibold text-red-600">{errors.steps}</p>}
          {form.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">{i + 1}</span>
              <div className="flex-1">
                <textarea className={inputClass} rows={2} maxLength={1000} aria-label={t("submit.stepAria", { n: i + 1 })} value={step} onChange={(e) => setStep(i, e.target.value)} />
                <FieldError text={errors[`steps[${i}]`]} />
              </div>
              <button
                type="button"
                aria-label={t("submit.removeStep")}
                disabled={form.steps.length === 1}
                onClick={() => set({ steps: form.steps.filter((_, idx) => idx !== i) })}
                className="mt-2 rounded-xl p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary self-start !px-4 !py-2 text-sm" disabled={form.steps.length >= 40} onClick={() => set({ steps: [...form.steps, ""] })}>
            <Plus size={16} /> {t("submit.addStep")}
          </button>
        </section>

        <section className="card p-5">
          <Field label={t("submit.tips")} error={errors.tips}>
            <textarea className={inputClass} rows={2} maxLength={1000} value={form.tips} onChange={(e) => set({ tips: e.target.value })} />
          </Field>
        </section>

        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {formError}
          </p>
        )}

        <button type="submit" disabled={submitting || uploading} className="btn-accent self-start">
          {submitting && <Loader2 className="animate-spin" size={18} />}
          {submitting ? t("submit.submitting") : t("submit.submit")}
        </button>
      </form>
    </div>
  );
}

function FieldError({ text }) {
  return text ? <p className="mt-1 text-xs font-semibold text-red-600">{text}</p> : null;
}

function Field({ label, error, hint, children }) {
  return (
    <label className="block text-sm font-semibold text-primary-800">
      <span className="mb-1 flex items-center justify-between">
        {label}
        {hint && <span className="text-xs font-normal text-primary-400">{hint}</span>}
      </span>
      {children}
      <FieldError text={error} />
    </label>
  );
}

function ChipGroup({ title, options, selected, onToggle, error, display }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-primary-800">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${on ? "bg-primary-500 text-white ring-primary-500" : "bg-white text-primary-600 ring-primary-200 hover:bg-primary-50"}`}
            >
              {display ? display(o) : o}
            </button>
          );
        })}
      </div>
      <FieldError text={error} />
    </fieldset>
  );
}
