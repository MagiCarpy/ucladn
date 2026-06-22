import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/user/auth`, {
          method: "POST",
          credentials: "include",
        });

        if (resp.ok) {
          const data = await resp.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAuth();
  }, []);

  const login = async (email, password) => {
    const resp = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (resp.ok) {
      const authResp = await fetch(`${API_BASE_URL}/api/user/auth`, {
        method: "POST",
        credentials: "include",
      });

      if (!authResp.ok) {
        return { success: false };
      }

      const data = await authResp.json();
      setUser(data.user);
      return { success: true };
    } else {
      const error = await resp.json();
      return { success: false, error: error.error || "Login failed" };
    }
  };

  const logout = async () => {
    await fetch(`${API_BASE_URL}/api/user/logout`, {
      method: "GET",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
    navigate("/dashboard", { replace: true });
  };

  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      credentials: "include",
    });

    if (res.status >= 400 && res.status < 500) {
      setUser(null);
      navigate("/login", { replace: true });
    }

    return res;
  }, [navigate]);

  const updateUser = useCallback((updates) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, ...updates } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUser, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
