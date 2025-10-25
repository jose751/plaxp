import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LoginPage, PasswordRecoveryPage, VerifyCodePage, ResetPasswordPage } from './features/security'
import { UsersPage } from './features/users'
import { AuthProvider } from './shared/contexts/AuthContext'
import { LoadingProvider } from './shared/contexts/LoadingContext'
import { PasswordRecoveryProvider } from './features/security/context/PasswordRecoveryContext'
import { MainLayout } from './shared/layouts/MainLayout'
import { ProtectedRoute } from './shared/components/ProtectedRoute'
import { PublicRoute } from './shared/components/PublicRoute'

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <PasswordRecoveryProvider>
          <Router>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="/password-recovery" element={
                <PublicRoute>
                  <PasswordRecoveryPage />
                </PublicRoute>
              } />
              <Route path="/verify-code" element={
                <PublicRoute>
                  <VerifyCodePage />
                </PublicRoute>
              } />
              <Route path="/reset-password" element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              } />

              {/* Rutas protegidas */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout>
                    <div>
                      <h1 className="text-2xl font-bold text-neutral-900 mb-4">Dashboard</h1>
                      <p className="text-neutral-600">Bienvenido a Plaxp</p>
                    </div>
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/usuarios" element={
                <ProtectedRoute>
                  <MainLayout>
                    <UsersPage />
                  </MainLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </PasswordRecoveryProvider>
      </AuthProvider>
    </LoadingProvider>
  )
}

export default App
