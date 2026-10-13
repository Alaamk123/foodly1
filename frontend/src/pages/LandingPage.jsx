import { Link } from "react-router-dom";
import {
  ArrowRight,
  Settings2,
  BookOpen,
  CalendarDays,
  ShoppingBasket,
  Leaf,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PhoneMockup from "../components/PhoneMockup";
import StatCounter from "../components/StatCounter";
import TestimonialCarousel from "../components/TestimonialCarousel";
import FaqAccordion from "../components/FaqAccordion";
import AppStoreBadges from "../components/AppStoreBadges";
import CookingVideoSection from "../components/CookingVideoSection";
import { useLanguage } from "../i18n/LanguageContext";

// Icons only — all text comes from i18n/translations.js (landing.how.steps / landing.features.items)
const STEP_ICONS = [Settings2, BookOpen, CalendarDays, ShoppingBasket];
const FEATURE_ICONS = [Leaf, ShieldCheck, Clock, ShoppingBasket, CalendarDays, Sparkles];

export default function LandingPage() {
  const { t, isRTL } = useLanguage();
  const steps = t("landing.how.steps");
  const features = t("landing.features.items");

  return (
    <div className="flex flex-col">
      {/* ---------------- Hero ---------------- */}
      <section className="overflow-hidden bg-gradient-to-b from-primary-50 to-cream-50 px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="badge mb-5 inline-flex">
              <Sparkles size={13} /> {t("landing.hero.badge")}
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-primary-900 sm:text-5xl">
              {t("landing.hero.title")}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-primary-600">
              {t("landing.hero.text")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="btn-primary">
                {t("landing.hero.cta")} <ArrowRight size={18} className={isRTL ? "rotate-180" : ""} />
              </Link>
              <Link to="/recipes" className="btn-secondary">
                {t("landing.hero.browse")}
              </Link>
            </div>
            <p className="mt-4 text-xs text-primary-400">{t("landing.hero.note")}</p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section className="bg-primary-600 px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
          <StatCounter value={26} suffix="+" label={t("landing.stats.recipes")} />
          <StatCounter value={7} label={t("landing.stats.diets")} />
          <StatCounter value={8} label={t("landing.stats.allergens")} />
          <StatCounter value={100} suffix="%" label={t("landing.stats.free")} />
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="section-title">{t("landing.how.title")}</h2>
            <p className="mt-3 text-primary-500">
              {t("landing.how.sub")}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ title, text }, i) => {
              const Icon = STEP_ICONS[i];
              return (
              <div key={i} className="card relative p-6">
                <span className="absolute -top-3 -start-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 font-display text-sm font-bold text-white shadow-card">
                  {i + 1}
                </span>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <Icon size={22} />
                </span>
                <h3 className="font-display font-bold text-primary-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-500">{text}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>
      <CookingVideoSection />
      
      {/* ---------------- Features ---------------- */}
      <section className="bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="section-title">{t("landing.features.title")}</h2>
            <p className="mt-3 text-primary-500">
              {t("landing.features.sub")}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, text }, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
              <div key={i} className="flex gap-4 rounded-xl2 p-5 transition-colors hover:bg-primary-50">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="font-display font-bold text-primary-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-primary-500">{text}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Testimonials ---------------- */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="section-title">{t("landing.testimonials.title")}</h2>
            <p className="mt-3 text-primary-500">{t("landing.testimonials.sub")}</p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="section-title">{t("landing.faq.title")}</h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ---------------- Download CTA ---------------- */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 rounded-xl2 bg-primary-900 px-6 py-14 text-white sm:px-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              {t("landing.cta.title")}
            </h2>
            <p className="mt-4 max-w-md text-primary-100">
              {t("landing.cta.text")}
            </p>
            <AppStoreBadges className="mt-8" />
            <p className="mt-3 text-xs text-primary-300">
              {t("landing.cta.note")}
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>
    </div>
  );
}
