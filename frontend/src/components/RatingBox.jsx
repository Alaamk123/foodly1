import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMyRating, rateRecipe, errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { StarInput } from "./StarRating";


export default function RatingBox({ recipeId, onRated }) {
  const { user } = useAuth();
  const location = useLocation();
  const [myRating, setMyRating] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }

  useEffect(() => {
    setMyRating(null);
    setMessage(null);
    if (!user) return;
    fetchMyRating(recipeId)
      .then((r) => setMyRating(r.myRating))
      .catch(() => {}); // not critical: the stars simply start empty
  }, [recipeId, user]);

  const handleRate = async (value) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await rateRecipe(recipeId, value);
      setMyRating(res.myRating);
      onRated?.({ ratingAverage: res.ratingAverage, ratingCount: res.ratingCount });
      setMessage({ type: "ok", text: myRating ? "تم تحديث تقييمك." : "شكراً! تم حفظ تقييمك." });
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err, "تعذّر حفظ التقييم.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card mt-6 p-5" dir="rtl" aria-labelledby="rating-title">
      <h2 id="rating-title" className="font-display text-lg font-bold text-primary-900">
        قيّم هذه الوصفة
      </h2>

      {!user ? (
        <p className="mt-2 text-sm text-primary-600">
          يجب{" "}
          <Link to="/login" state={{ from: location.pathname }} className="font-bold text-accent-600 underline">
            تسجيل الدخول
          </Link>{" "}
          لتتمكن من تقييم الوصفة.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-primary-500">{myRating ? `تقييمك الحالي: ${myRating} من 5 — يمكنك تعديله.` : "اضغط على عدد النجوم الذي تراه مناسباً."}</p>
          <div className="mt-2">
            <StarInput value={myRating || 0} onChange={handleRate} disabled={saving} />
          </div>
          {message && (
            <p role="status" className={`mt-2 text-sm font-semibold ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
        </>
      )}
    </section>
  );
}
