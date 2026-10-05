import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import RecipeCatalog from "./pages/RecipeCatalog";
import RecipeDetail from "./pages/RecipeDetail";
import WeeklyPlanner from "./pages/WeeklyPlanner";
import GroceryList from "./pages/GroceryList";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { authLoading, user } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <LoadingSpinner label="Loading..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/recipes" replace /> : <LandingPage />} />
          <Route path="/recipes" element={<RecipeCatalog />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <WeeklyPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grocery-list"
            element={
              <ProtectedRoute>
                <GroceryList />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/recipes" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
