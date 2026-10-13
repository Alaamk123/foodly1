import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import RecipeCatalog from "./pages/RecipeCatalog";
import RecipeDetail from "./pages/RecipeDetail";
import WeeklyPlanner from "./pages/WeeklyPlanner";
import GroceryList from "./pages/GroceryList";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./i18n/LanguageContext";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import SubmitRecipe from "./pages/SubmitRecipe";
import MyRecipes from "./pages/MyRecipes";
import AdminRecipes from "./pages/AdminRecipes";
import AdminOrders from "./pages/AdminOrders";

export default function App() {
  const { authLoading, user } = useAuth();
  const { t } = useLanguage();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <LoadingSpinner label={t("common.loading")} />
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
          <Route
          path="/checkout"
          element={
             <ProtectedRoute>
             <Checkout />
             </ProtectedRoute>
           }
         />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/submit-recipe" element={<ProtectedRoute><SubmitRecipe /></ProtectedRoute>} />
          <Route path="/my-recipes" element={<ProtectedRoute><MyRecipes /></ProtectedRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/recipes" replace />} />
          <Route path="/admin/recipes" element={<AdminRoute><AdminRecipes /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/recipes" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
