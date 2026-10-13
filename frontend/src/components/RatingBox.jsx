import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMyRating, fetchReviews, rateRecipe } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Star } from "lucide-react";
import { StarInput } from "./StarRating";

const MAX_COMMENT = 1000;

/** Rating form (stars + optional comment) and the list of written reviews. */
export default function RatingBox({ recipeId, onRated }) {
  const { user } = useAuth();
  const { t, apiError, locale } = useLanguage();
  const location = useLocation();

  const [savedRating, setSavedRating] = useState(null); // what the server has for this user
  const [stars, setStars] = useState(0); // what the user is choosing now
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }

  const [reviews, setReviews] = useState([]);
  const [reviewsError, setReviewsError] = useState(false);

  const loadReviews = useCallback(() => {
    setReviewsError(false);
    fetchReviews(recipeId)
      .then(setReviews)
      .catch(() => setReviewsError(true));
  }, [recipeId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setSavedRating(null);
    setStars(0);
    setComment("");
    setMessage(null);
    if (!user) return;
    fetchMyRating(recipeId)
      .then((r) => {
        setSavedRating(r.myRating);
        setStars(r.myRating || 0);
        setComment(r.myComment || "");
      })
      .catch(() => {}); // not critical: the form simply starts empty
  }, [recipeId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stars) {
      setMessage({ type: "error", text: t("rating.pickStars") });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await rateRecipe(recipeId, stars, comment.trim());
      setMessage({ type: "ok", text: savedRating ? t("rating.updated") : t("rating.saved") });
      setSavedRating(res.myRating);
      onRated?.({ ratingAverage: res.ratingAverage, ratingCount: res.ratingCount });
      loadReviews();
    } catch (err) {
      setMessage({ type: "error", text: apiError(err, "rating.saveError") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card mt-6 p-5" aria-labelledby="rating-title">
      <h2 id="rating-title" className="font-display text-lg font-bold text-primary-900">
        {t("rating.title")}
      </h2>

      {!user ? (
        <p className="mt-2 text-sm text-primary-600">
          {t("rating.loginPre")}{" "}
          <Link to="/login" state={{ from: location.pathname }} className="font-bold text-accent-600 underline">
            {t("rating.loginLink")}
          </Link>{" "}
          {t("rating.loginPost")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-1">
          <p className="text-sm text-primary-500">
            {savedRating ? t("rating.current", { n: savedRating }) : t("rating.prompt")}
          </p>
          <div className="mt-2">
            <StarInput value={stars} onChange={setStars} disabled={saving} />
          </div>

          <label htmlFor="rating-comment" className="mt-4 block text-sm font-semibold text-primary-800">
            {t("rating.commentLabel")}
          </label>
          <textarea
            id="rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
            maxLength={MAX_COMMENT}
            rows={3}
            disabled={saving}
            placeholder={t("rating.commentPlaceholder")}
            className="mt-1 w-full rounded-xl border border-primary-200 bg-white p-3 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <p className="mt-1 text-xs text-primary-400">{t("rating.charsLeft", { n: MAX_COMMENT - comment.length })}</p>

          <button type="submit" disabled={saving} className="btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-60">
            {savedRating ? t("rating.update") : t("rating.submit")}
          </button>

          {message && (
            <p role="status" className={`mt-2 text-sm font-semibold ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
        </form>
      )}

      <div className="mt-6 border-t border-primary-100 pt-4">
        <h3 className="font-display text-base font-bold text-primary-900">{t("rating.reviewsTitle")}</h3>
        {reviewsError ? (
          <p className="mt-2 text-sm text-red-600">{t("rating.reviewsLoadError")}</p>
        ) : reviews.length === 0 ? (
          <p className="mt-2 text-sm text-primary-500">{t("rating.noReviews")}</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl bg-primary-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-primary-900">{r.author || t("rating.anonymous")}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-800">
                    <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                    {r.value}/5
                  </span>
                  <span className="text-xs text-primary-400">{new Date(r.createdAt).toLocaleDateString(locale)}</span>
                </div>
                {/* React escapes the text, so a comment can never inject HTML */}
                <p className="mt-1 whitespace-pre-line break-words text-sm text-primary-700">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
