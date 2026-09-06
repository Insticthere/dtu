import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  ShieldCheck,
  Bell,
  LogOut,
  User,
  PlusCircle,
  FileCheck,
  Layers,
  LayoutDashboard,
  QrCode,
  Menu,
  X
} from 'lucide-react';
import NotificationsModal from './NotificationsModal';

export default function Navbar() {
  const { user, logout, unreadNotifications } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 uppercase">Admin HQ</span>;
      case 'lmo':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 uppercase">LMO Inspector</span>;
      case 'gatc':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">GATC Lab</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 uppercase">Instrument Owner</span>;
    }
  };

  return (
    <>
      {/* Top Government Tricolor Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 border-b border-slate-200"></div>

      <header className="bg-gov-navy text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & National Portal Title */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-900 shadow-md group-hover:scale-105 transition-transform">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-lg text-white font-sans">e-Metrology</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.2 rounded border border-amber-500/30">GOVT OF INDIA</span>
                </div>
                <p className="text-[11px] text-slate-300 hidden sm:block">Legal Metrology Verification & Certification System</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/verify"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname.startsWith('/verify')
                    ? 'bg-blue-900/60 text-amber-300 border border-amber-400/30'
                    : 'text-slate-200 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Verify Certificate</span>
              </Link>

              {user ? (
                <>
                  {user.role === 'user' && (
                    <>
                      <Link
                        to="/dashboard"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          location.pathname === '/dashboard' ? 'bg-blue-900 text-white' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        My Instruments
                      </Link>
                      <Link
                        to="/instruments/new"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          location.pathname === '/instruments/new' ? 'bg-blue-900 text-white' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Instrument
                      </Link>
                      <Link
                        to="/apply"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          location.pathname === '/apply' ? 'bg-amber-600 text-white' : 'text-amber-300 hover:bg-slate-800'
                        }`}
                      >
                        <FileCheck className="w-4 h-4" />
                        Apply for Verification
                      </Link>
                    </>
                  )}

                  {(user.role === 'lmo' || user.role === 'gatc') && (
                    <>
                      <Link
                        to="/officer"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          location.pathname === '/officer' ? 'bg-blue-900 text-white' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Inspection Queue
                      </Link>
                    </>
                  )}

                  {user.role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          location.pathname === '/admin' ? 'bg-blue-900 text-white' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                      <Link
                        to="/admin/categories"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          location.pathname === '/admin/categories' ? 'bg-blue-900 text-white' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        Category Schemas
                      </Link>
                    </>
                  )}
                </>
              ) : null}
            </nav>

            {/* Right Side: Auth / Profile / Alerts */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Notifications Bell */}
                  <button
                    onClick={() => setNotifModalOpen(true)}
                    className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-gov-navy">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {/* Profile info & role */}
                  <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5 justify-end">
                        {user.name}
                        {getRoleBadge()}
                      </div>
                      <div className="text-[11px] text-slate-400">{user.email}</div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-amber-300 hover:bg-slate-800"
            >
              Verify Certificate (Public)
            </Link>
            {user ? (
              <>
                {user.role === 'user' && (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                      My Instruments
                    </Link>
                    <Link
                      to="/instruments/new"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                      Add Instrument
                    </Link>
                    <Link
                      to="/apply"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-amber-300 hover:bg-slate-800"
                    >
                      Apply for Verification
                    </Link>
                  </>
                )}
                {(user.role === 'lmo' || user.role === 'gatc') && (
                  <Link
                    to="/officer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800"
                  >
                    Officer Queue
                  </Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/categories"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                      Category Schemas
                    </Link>
                  </>
                )}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">{user.name} ({user.role.toUpperCase()})</div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="text-sm text-rose-400 font-medium py-1"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 bg-slate-800 rounded-lg text-sm text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 bg-amber-400 rounded-lg text-sm text-slate-900 font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Notifications Modal Component */}
      <NotificationsModal isOpen={notifModalOpen} onClose={() => setNotifModalOpen(false)} />
    </>
  );
}
