/**
 * context/AuthContext.jsx — Global authentication state
 *
 * Provides: user, token, login(), logout(), loading
 *
 * Storage strategy: JWT is kept in localStorage for simplicity.
 * Limitation: localStorage is accessible to JavaScript, so an XSS attack
 * could steal the token. The spec §5 notes this and acknowledges that an
 * httpOnly-cookie approach would be more secure but is out of scope here.
 *
 * On mount, the context reads the stored token and re-fetches the current
 * user from the API to validate it's still valid (not expired, not revoked).
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.js';

// Create the context with a default shape matching what consumers expect
const AuthContext = createContext({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  loading: true,
});

/**
 * AuthProvider — wrap the app with this to provide auth state.
 * Place it above BrowserRouter so all pages can access auth.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // True until initial auth check completes

  /**
   * On mount: check if there's a stored token and validate it by calling /api/auth/me.
   * If the token is expired or invalid, clear storage and treat as logged out.
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('mc_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    // Validate the stored token with the server
    authApi.getMe(storedToken)
      .then((data) => {
        setToken(storedToken);
        setUser(data.user);
      })
      .catch(() => {
        // Token is invalid/expired — clear it
        localStorage.removeItem('mc_token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /**
   * login — called after successful /api/auth/login.
   * Persists the token and sets user state.
   *
   * @param {string} newToken - JWT from the server
   * @param {Object} newUser  - User object from the server
   */
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('mc_token', newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  /**
   * logout — clears all auth state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('mc_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — hook for consuming auth context in any component.
 * Throws if used outside <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
