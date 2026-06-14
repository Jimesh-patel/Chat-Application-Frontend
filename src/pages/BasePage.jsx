import { Link } from 'react-router-dom'

const features = [
  'Secure register and login flows',
  'Real-time chat workspace experience',
  'Persistent session support with local storage',
]

function BasePage() {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="space-y-6">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-300">
          Modern chat experience
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Connect instantly with a polished chat app experience.
          </h1>
          <p className="max-w-xl text-lg text-slate-300">
            Build conversations, stay signed in across sessions, and enjoy a clean interface designed for simple collaboration.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30">
        <h2 className="text-xl font-semibold text-white">What you get</h2>
        <ul className="mt-6 space-y-3">
          {features.map((item) => (
            <li key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/70 p-3 text-sm text-slate-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default BasePage
