import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";

/**
 * <img> يعرض صورةً مؤقتة بلون أخضر ناعم إذا فشل رابط الصورة في التحميل، بحيث لا يترك الرابط المعطّل مربعًا فارغًا وغير جميل على الصفحة.
 */
export default function RecipeImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center bg-primary-100 text-primary-300 ${className}`}>
        <UtensilsCrossed size={28} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
