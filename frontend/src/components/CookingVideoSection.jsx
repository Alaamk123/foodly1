
import { useLanguage } from "../i18n/LanguageContext";

export default function CookingVideoSection() {
  const { t } = useLanguage();
  return (
    <section className="bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="section-title">
          {t("landing.video.title")}
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-primary-500">
          {t("landing.video.text")}
        </p>

        <div className="relative mx-auto mt-10 aspect-video max-w-3xl overflow-hidden rounded-xl2 bg-primary-900 shadow-card-hover">
          <video
            className="h-full w-full object-cover"
            src="/videos/my-video.mp4"
            controls
            preload="metadata"
          >
            {t("landing.video.unsupported")}
          </video>
        </div>
      </div>
    </section>
  );
}

