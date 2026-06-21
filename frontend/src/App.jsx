import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Package,
  PlusCircle,
  HomeIcon,
  User,
  BarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import Cover from "./pages/Cover/Cover";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginSignup from "./pages/LoginSignup/LoginSignup";
import RequestsList from "./pages/Requests/RequestsList";
import NewRequest from "./pages/Requests/NewRequest";
import Stats from "./pages/Stats/Stats";
import RequestDetails from "./pages/Requests/RequestDetails";
import { useAuth } from "./context/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";
import { useToast } from "@/context/toastContext";
import uclaLogo from "@/assets/cover/Logo.jpg";

function App() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path) =>
    location.pathname === path
      ? "text-primary font-semibold"
      : "text-foreground dark:text-white hover:text-primary";

  return (
    <>
      {/* GLOBAL NAVBAR */}
      <header className="sticky top-0 z-[2000] w-full border-b bg-background/95 backdrop-blur shadow-sm">
        <div className="w-full flex h-14 items-center justify-between px-4 md:px-8">
          {/* LEFT — Brand */}
          <Link
            className="flex items-center gap-1.5 transition hover:opacity-80"
            to="/"
            onClick={closeMenu}
          >
            <img src={uclaLogo} alt="UCLA Logo" className="h-6 md:h-7 w-auto" />
            <span className="font-semibold tracking-tight text-xl -mt-[2px]">
              Delivery Network
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex flex-1 items-center justify-end space-x-6">
            {user && (
              <>
                <Link to="/dashboard" className={isActive("/dashboard")}>
                  <div className="flex items-center gap-1">
                    <HomeIcon className="w-4 h-4" /> Dashboard
                  </div>
                </Link>

                <Link to="/requests" className={isActive("/requests")}>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" /> Requests
                  </div>
                </Link>

                <Link to="/requests/new" className={isActive("/requests/new")}>
                  <div className="flex items-center gap-1">
                    <PlusCircle className="w-4 h-4" /> New Request
                  </div>
                </Link>

                <Link to="/stats" className={isActive("/stats")}>
                  <div className="flex items-center gap-1">
                    <BarChart className="w-4 h-4" /> Stats
                  </div>
                </Link>

                <Link to="/profile" className={isActive("/profile")}>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" /> Profile
                  </div>
                </Link>

                <Button onClick={logout} variant="destructive">
                  Logout
                </Button>
              </>
            )}

            {!user && (
              <>
                <Link to="/login" className={isActive("/login")}>
                  Login
                </Link>
                <Link to="/signup" className={isActive("/signup")}>
                  Sign Up
                </Link>
              </>
            )}

            <ModeToggle />
          </nav>

          {/* MOBILE NAV TOGGLE */}
          <div className="flex md:hidden items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {isMenuOpen && (
          <div className="md:hidden border-t p-4 bg-background">
            <nav className="flex flex-col space-y-4">
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={closeMenu}
                    className={isActive("/dashboard")}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/requests"
                    onClick={closeMenu}
                    className={isActive("/requests")}
                  >
                    Requests
                  </Link>

                  <Link
                    to="/requests/new"
                    onClick={closeMenu}
                    className={isActive("/requests/new")}
                  >
                    New Request
                  </Link>

                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className={isActive("/profile")}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/stats"
                    onClick={closeMenu}
                    className={isActive("/stats")}
                  >
                    Stats
                  </Link>
                  <Link onClick={logout} className="text-destructive">
                    Logout
                  </Link>
                </>
              )}

              {!user && (
                <>
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className={isActive("/login")}
                  >
                    Login
                  </Link>

                  <Link
                    to="/signup"
                    onClick={closeMenu}
                    className={isActive("/signup")}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ROUTES */}
      <Routes>
        <Route path="/" element={<Cover />} />
        <Route
          path="/dashboard"
          element={<Dashboard showToast={showToast} />}
        />

        <Route path="/login" element={<LoginSignup signingUp={false} />} />
        <Route path="/signup" element={<LoginSignup signingUp={true} />} />

        <Route element={<ProtectedRoute redirect="/login" />}>
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/requests"
            element={<RequestsList showToast={showToast} />}
          />
          <Route
            path="/requests/new"
            element={<NewRequest showToast={showToast} />}
          />
          <Route
            path="/requests/:id"
            element={<RequestDetails showToast={showToast} />}
          />
          <Route path="/stats" element={<Stats />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
