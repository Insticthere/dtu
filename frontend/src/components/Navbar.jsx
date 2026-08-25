import { Icon } from '../components/ui/index.js';
/**
 * components/Navbar.jsx — Vercel-style top navigation
 *
 * Design: minimal, clean border-bottom, monochrome.
 * Includes the dark/light mode toggle (sun/moon icon).
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

/* ── Icon components (inline SVG — no icon library needed) ─── */
const SunIcon = () => <Icon name="sun" size={16} />;

const MoonIcon = () => <Icon name="moon" size={16} />;

const MenuIcon = () => <Icon name="menu" size={20} />;

const CloseIcon = () => <Icon name="close" size={20} />;

/* ── Nav link — highlights if current route matches ────────── */
const NavLink = ({ to, children }) => {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors duration-150 ${
        active
          ? 'text-gray-900 dark:text-white'
          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
};

const ROLE_LINKS = {
  student: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/mentors', label: 'Find Mentors' },
    { to: '/my-bookings', label: 'Bookings' },
  ],
  mentor: [
    { to: '/mentor/dashboard', label: 'Dashboard' },
    { to: '/mentor/availability', label: 'Availability' },
    { to: '/mentor/bookings', label: 'Bookings' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/applications', label: 'Applications' },
  ],
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const links = user ? (ROLE_LINKS[user.role] || []) : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-black/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded-md flex items-center justify-center">
              <span className="text-white dark:text-black text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">MentorConnect</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center space-x-6">
            {links.map(({ to, label }) => (
              <NavLink key={to} to={to}>{label}</NavLink>
            ))}
          </nav>

          {/* Right side: theme toggle + auth */}
          <div className="flex items-center space-x-2">
            {/* Dark/light toggle */}
            <button
              onClick={toggleTheme}
              className="btn-ghost p-2 rounded-md"
              aria-label="Toggle dark mode"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {!user && (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login" className="btn-ghost px-3 py-1.5">Log in</Link>
                <Link to="/register" className="btn-primary px-3 py-1.5">Sign up</Link>
              </div>
            )}

            {user && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-900 dark:text-white leading-none">{user.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">{user.role}</p>
                </div>
                <button onClick={handleLogout} className="btn-secondary px-3 py-1.5 text-xs">
                  Sign out
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden btn-ghost p-2"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                {label}
              </Link>
            ))}
            {!user && (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900">Log in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-bold text-gray-900 dark:text-white">Sign up →</Link>
              </>
            )}
            {user && (
              <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
