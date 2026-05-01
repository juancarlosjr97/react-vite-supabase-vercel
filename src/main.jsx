import { StrictMode, useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createRoot } from "react-dom/client";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CssBaseline from "@mui/material/CssBaseline";
import ThemeProvider from "@mui/material/styles/ThemeProvider";
import { Toaster } from "react-hot-toast";

import "./index.css";

const App = lazy(() => import("./App.jsx"));
const Home = lazy(() => import("./pages/Home"));
const Reports = lazy(() => import("./pages/Reports"));
const Goals = lazy(() => import("./pages/Goals"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budgets = lazy(() => import("./pages/Budgets"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));

import AppBar from "./containers/AppBar";
import AuthProvider from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import QuickAddModal from "./components/QuickAddModal";
import getAppTheme from "./theme";
import { AuthSkeleton } from "./components/Skeleton";
import ErrorBoundary from "./components/ErrorBoundary";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <AuthSkeleton />;
  if (!user) return <Navigate to="/" />;

  return children;
}

function ScrollProgress() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setWidth(max > 0 ? (doc.scrollTop / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div className="scroll-progress" style={{ width: `${width}%` }} aria-hidden="true" />;
}

function Layout({ mode, onToggleTheme }) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="bg-orbs" aria-hidden="true" />
      <ScrollProgress />
      <div style={{ position: "relative", zIndex: 1 }}>
      <AppBar mode={mode} onToggleTheme={onToggleTheme} />

      <div className="container">
        <Suspense fallback={<AuthSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/sign-in" element={<SignIn />} />
            <Route path="/auth/sign-up" element={<SignUp />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <App />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Reports />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Transactions />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="/budgets"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Budgets />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Goals />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>

      {user && (
        <>
          <button className="fab" onClick={() => setShowModal(true)} title="Add expense" aria-label="Add expense">
            <AddRoundedIcon />
          </button>
          {showModal && <QuickAddModal onClose={() => setShowModal(false)} />}
        </>
      )}
      </div>
    </div>
  );
}

function AppRoot() {
  const [mode, setMode] = useState(() => localStorage.getItem("theme-mode") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  const theme = getAppTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Layout mode={mode} onToggleTheme={() => setMode((current) => (current === "light" ? "dark" : "light"))} />
        </AuthProvider>
      </BrowserRouter>
      <Toaster
        toastOptions={{
          style: {
            background: mode === "light" ? "#fbf5ea" : "#1d1713",
            color: mode === "light" ? "#181512" : "#f3e8d5",
            border: mode === "light" ? "1px solid rgba(33, 27, 23, 0.16)" : "1px solid rgba(243, 232, 213, 0.18)",
            boxShadow: mode === "light" ? "6px 6px 0 rgba(33, 27, 23, 0.12)" : "6px 6px 0 rgba(0, 0, 0, 0.3)",
          },
        }}
      />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>
);
