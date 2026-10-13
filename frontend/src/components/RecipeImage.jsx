import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { assetUrl } from "../api/client";

/**
 * <img> that shows a soft green placeholder when the image fails to load,
 * so a broken link never leaves an ugly empty box on the page.
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
  return <img src={assetUrl(src)} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
