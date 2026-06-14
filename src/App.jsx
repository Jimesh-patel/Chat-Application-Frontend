
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom'
import BasePage from './pages/BasePage'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import { isAuthenticated, logoutUser } from './services/auth'

function AppShell() {
  const navigate = useNavigate()
  const authenticated = isAuthenticated()

  useEffect(() => {
    const handleSessionExpired = () => {
      navigate('/login')
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired)
    }
  }, [navigate])

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {
      // The UI can still proceed to the login page even if the server logout fails.
    } finally {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to={authenticated ? '/home' : '/'} className="text-xl font-semibold text-white">
            ChatWave
          </Link>

          <nav className="flex items-center gap-3">
            {authenticated ? (
              <>
                <Link to="/home" className="rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                  Home
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                  Login
                </Link>
                <Link to="/signup" className="rounded-full bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Routes>
          <Route path="/" element={<BasePage />} />
          <Route path="/signup" element={authenticated ? <Navigate to="/home" replace /> : <AuthPage mode="signup" />} />
          <Route path="/login" element={authenticated ? <Navigate to="/home" replace /> : <AuthPage mode="login" />} />
          <Route path="/home" element={authenticated ? <HomePage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
