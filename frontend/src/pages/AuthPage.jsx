import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChefHat, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/** One page used for both /login and /signup (mode = "login" | "signup"). */
export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate(location.state?.from || "/planner", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-primary-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-card">
          <ChefHat size={24} />
        </span>
        <h1 className="section-title">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="text-sm text-primary-500">
          {isSignup ? "Sign up to plan your week and build your grocery list." : "Log in to see your meal plan."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6">
        {isSignup && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-primary-700">Name</label>
            <input className={inputClass} value={form.name} onChange={update("name")} required />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-semibold text-primary-700">Email</label>
          <input type="email" className={inputClass} value={form.email} onChange={update("email")} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-primary-700">Password</label>
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={update("password")}
            minLength={6}
            required
          />
          {isSignup && <p className="mt-1 text-xs text-primary-400">At least 6 characters.</p>}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {isSignup ? <UserPlus size={18} /> : <LogIn size={18} />}
          {loading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-primary-500">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link to={isSignup ? "/login" : "/signup"} className="font-semibold text-primary-600 hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
