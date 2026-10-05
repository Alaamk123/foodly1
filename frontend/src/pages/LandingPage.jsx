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

const STEPS = [
  {
    icon: Settings2,
    title: "Tell us how you eat",
    text: "Pick a diet type and exclude any allergens — Foodly filters everything around it automatically.",
  },
  {
    icon: BookOpen,
    title: "Browse recipes you'll actually cook",
    text: "Every recipe shows prep time, calories, and clear step-by-step instructions.",
  },
  {
    icon: CalendarDays,
    title: "Plan your week in minutes",
    text: "Tap a slot, pick a recipe, done. See your daily calories add up as you go.",
  },
  {
    icon: ShoppingBasket,
    title: "Shop with one smart list",
    text: "Every ingredient from your whole week, merged and grouped by aisle — nothing missed, nothing doubled.",
  },
];

const FEATURES = [
  { icon: Leaf, title: "Built for your diet", text: "Keto, Vegetarian, Vegan, Low Carb, Paleo and more — filtered automatically, every time." },
  { icon: ShieldCheck, title: "Allergy-aware", text: "Exclude dairy, gluten, nuts, shellfish or any combination — those recipes simply never show up." },
  { icon: Clock, title: "Real prep times", text: "Every recipe lists honest prep and cook time, so you know exactly what you're signing up for." },
  { icon: ShoppingBasket, title: "Aisle-sorted grocery list", text: "Produce, meat, dairy, pantry — your list is grouped the way your supermarket is laid out." },
  { icon: CalendarDays, title: "A week at a glance", text: "See breakfast, lunch and dinner for all seven days, with running calorie totals per day." },
  { icon: Sparkles, title: "No clutter, no ads", text: "A clean, calm interface designed to get you back to your day faster, not keep you scrolling." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ---------------- Hero ---------------- */}
      <section className="overflow-hidden bg-gradient-to-b from-primary-50 to-cream-50 px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="badge mb-5 inline-flex">
              <Sparkles size={13} /> Personalized meal planning
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-primary-900 sm:text-5xl">
              Decide dinner in seconds, not every single night.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-primary-600">
              Foodly builds your weekly meal plan around your diet and allergies,
              then turns it into one smart, aisle-sorted grocery list — so cooking
              stops being the thing you have to think about.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="btn-primary">
                Start meal planning for free <ArrowRight size={18} />
              </Link>
              <Link to="/recipes" className="btn-secondary">
                Browse recipes first
              </Link>
            </div>
            <p className="mt-4 text-xs text-primary-400">No credit card needed — it's free.</p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section className="bg-primary-600 px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
          <StatCounter value={32} suffix="+" label="Recipes to explore" />
          <StatCounter value={7} label="Diet types supported" />
          <StatCounter value={8} label="Allergens filterable" />
          <StatCounter value={100} suffix="%" label="Free to start" />
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="section-title">How Foodly works</h2>
            <p className="mt-3 text-primary-500">
              Four simple steps between you and a week of food you don't have to think twice about.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="card relative p-6">
                <span className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 font-display text-sm font-bold text-white shadow-card">
                  {i + 1}
                </span>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <Icon size={22} />
                </span>
                <h3 className="font-display font-bold text-primary-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CookingVideoSection />
      
      {/* ---------------- Features ---------------- */}
      <section className="bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="section-title">Everything a weekly planner should do</h2>
            <p className="mt-3 text-primary-500">
              No fluff — just the features that actually save you time at the stove and the store.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-xl2 p-5 transition-colors hover:bg-primary-50">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="font-display font-bold text-primary-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-primary-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Testimonials ---------------- */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="section-title">What people are saying</h2>
            <p className="mt-3 text-primary-500">Illustrative feedback written for this project.</p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="section-title">Frequently asked questions</h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ---------------- Download CTA ---------------- */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 rounded-xl2 bg-primary-900 px-6 py-14 text-white sm:px-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Start meal planning for free
            </h2>
            <p className="mt-4 max-w-md text-primary-100">
              Create your account, set your diet and allergies once, and let Foodly
              handle the "what's for dinner" question from here on out.
            </p>
            <AppStoreBadges className="mt-8" />
            <p className="mt-3 text-xs text-primary-300">
              Design concept — Foodly is currently a web app; these badges represent planned native apps.
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
