import { getStoredUser } from '../services/auth'

function ProfilePage() {
  const user = getStoredUser() || {}

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
      <div>
        <p className="text-sm font-medium text-cyan-300">User profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{user.username || 'Profile'}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Username</p>
          <p className="mt-2 break-words text-lg font-semibold text-white">{user.username || '-'}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Email id</p>
          <p className="mt-2 break-words text-lg font-semibold text-white">{user.email || '-'}</p>
        </div>
      </div>
    </section>
  )
}

export default ProfilePage
