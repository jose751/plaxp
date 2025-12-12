import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './shared/contexts/AuthContext'
import { LoadingProvider } from './shared/contexts/LoadingContext'
import { PasswordRecoveryProvider } from './features/security/context/PasswordRecoveryContext'
import { ThemeProvider } from './shared/contexts/ThemeContext'
import { ToastProvider } from './shared/contexts/ToastContext'
import { AppContent } from './AppContent'

function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <ToastProvider>
          <AuthProvider>
            <PasswordRecoveryProvider>
              <Router>
                <AppContent />
              </Router>
            </PasswordRecoveryProvider>
          </AuthProvider>
        </ToastProvider>
      </LoadingProvider>
    </ThemeProvider>
  )
}

export default App
