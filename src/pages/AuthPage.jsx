import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, registerUser } from '../services/auth'

const modeConfig = {
  signup: {
    title: 'Create your account',
    subtitle: 'Start chatting in minutes.',
    buttonLabel: 'Sign up',
    switchText: 'Already have an account?',
    switchLink: '/login',
    switchLabel: 'Log in',
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Pick up where you left off.',
    buttonLabel: 'Log in',
    switchText: 'New here?',
    switchLink: '/signup',
    switchLabel: 'Create account',
  },
}

function AuthPage({ mode = 'login' }) {
  const config = modeConfig[mode]
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload =
        mode === 'signup'
          ? {
              fullName: formData.name,
              email: formData.email,
              password: formData.password,
              username: formData.email.split('@')[0],
            }
          : {
              email: formData.email,
              password: formData.password,
            }

      if (mode === 'signup') {
        await registerUser(payload)
      } else {
        await loginUser(payload)
      }

      navigate('/home')
    } catch (err) {
      setError(err.message || 'Unable to complete request right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/30 lg:flex-row lg:items-center lg:justify-between lg:p-10">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold text-white">{config.title}</h1>
        <p className="text-slate-300">{config.subtitle}</p>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-200">
          The UI is ready for your API server. Authentication requests will be sent to the configured backend endpoint.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        {mode === 'signup' && (
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-0"
              placeholder="Alex Morgan"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm text-slate-300" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-0"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-0"
            placeholder="Enter a strong password"
          />
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Working...' : config.buttonLabel}
        </button>

        <p className="text-center text-sm text-slate-400">
          {config.switchText}{' '}
          <Link to={config.switchLink} className="font-medium text-cyan-300 hover:text-cyan-200">
            {config.switchLabel}
          </Link>
        </p>
      </form>
    </section>
  )
}

export default AuthPage
