import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-primary-500">
      <Loader2 className="animate-spin" size={36} />
      <p className="font-display text-sm font-semibold">{label}</p>
    </div>
  );
}
