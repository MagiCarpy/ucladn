import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config";

function LoginSignup({ signingUp }) {
  const { login, user } = useAuth();
  const [loggingIn, setLoggingIn] = useState(!signingUp);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  useEffect(() => setLoggingIn(!signingUp), [signingUp]);

  if (user) return <Navigate to="/Dashboard" replace />;

  async function handleLogin(e) {
    e.preventDefault();
    const resp = await login(formData.email, formData.password);

    // if login fails, set error and return (do not redirect)
    if (resp.success === false) {
      setErr(resp.error || "Login Failed. Try Again.");
      return null;
    }

    navigate("/dashboard", { replace: true });
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (isSubmitting) return;

    // Client-side password validation
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
    if (!strongRegex.test(formData.password)) {
      setErr(
        "Password must have: ≥8 characters, uppercase letter, lowercase letter, special character: @$!%*?&."
      );
      return;
    }

    setIsSubmitting(true);

    const resp = await fetch(`${API_BASE_URL}/api/user/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!resp.ok) {
      let errorMsg = "Signup Failed. Try Again.";
      try {
        const errorData = await resp.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        console.error("Failed to parse error response", e);
      }
      setErr(errorMsg);
      setIsSubmitting(false);
      return null;
    }

    const data = await resp.json();

    // if signup is successful, auto-login (can change this)
    if (data) {
      setLoggingIn(!loggingIn);
      // Auto-login after successful signup
      const loginResp = await login(formData.email, formData.password);

      if (loginResp.success) {
        navigate("/home", { replace: true });
      } else {
        // Fallback if auto-login fails for some reason
        setLoggingIn(true);
      }
    }

    setIsSubmitting(false);
  }

  const handleSwitch = (e, type) => {
    e.preventDefault();
    setLoggingIn(type === "login");
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <Card className="w-full max-w-md border border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-blue-700 dark:text-blue-300">
            {loggingIn ? "Welcome Back" : "Create an Account"}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* Switcher */}
          <div className="flex gap-2 mb-2">
            <Button
              variant={!loggingIn ? "default" : "ghost"}
              className={`flex-1 ${
                loggingIn ? "text-muted-foreground hover:text-foreground" : ""
              }`}
              onClick={() => setLoggingIn(true)}
            >
              Login
            </Button>

            <Button
              variant={loggingIn ? "default" : "ghost"}
              className={`flex-1 ${
                !loggingIn ? "text-muted-foreground hover:text-foreground" : ""
              }`}
              onClick={() => setLoggingIn(false)}
            >
              Sign Up
            </Button>
          </div>

          <form
            onSubmit={loggingIn ? handleLogin : handleSignup}
            className="flex flex-col gap-6"
          >
            {!loggingIn && (
              <div>
                <p className="text-sm font-medium mb-1">Username</p>
                <Input
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">Email</p>
              <Input
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Password</p>
              <Input
                type="password"
                autoComplete={loggingIn ? "current-password" : "new-password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            {err && (
              <div className="text-destructive text-sm text-center">{err}</div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {loggingIn ? "Login" : isSubmitting ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginSignup;
