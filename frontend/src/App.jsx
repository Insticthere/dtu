import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import AddInstrumentPage from './pages/AddInstrumentPage';
import ApplyVerificationPage from './pages/ApplyVerificationPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import OfficerDashboard from './pages/OfficerDashboard';
import PerformInspectionPage from './pages/PerformInspectionPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import CertificatePage from './pages/CertificatePage';
import PublicVerifyPage from './pages/PublicVerifyPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify" element={<PublicVerifyPage />} />
              <Route path="/verify/:qrToken" element={<PublicVerifyPage />} />
              <Route path="/certificates/:certNumber" element={<CertificatePage />} />

              {/* Trader / User Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instruments/new"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <AddInstrumentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/apply"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <ApplyVerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:id"
                element={
                  <ProtectedRoute allowedRoles={['user', 'lmo', 'gatc', 'admin']}>
                    <ApplicationDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* LMO / GATC Officer Routes */}
              <Route
                path="/officer"
                element={
                  <ProtectedRoute allowedRoles={['lmo', 'gatc', 'admin']}>
                    <OfficerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inspection/:applicationId"
                element={
                  <ProtectedRoute allowedRoles={['lmo', 'gatc', 'admin']}>
                    <PerformInspectionPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminCategoriesPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
