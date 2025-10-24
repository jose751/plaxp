import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LoginPage, PasswordRecoveryPage } from './features/security'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/password-recovery" element={<PasswordRecoveryPage />} />
      </Routes>
    </Router>
  )
}

export default App
