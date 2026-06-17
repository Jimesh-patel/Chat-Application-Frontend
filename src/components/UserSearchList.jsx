import { formatDisplayName } from '../utils/formatters'

export function UserSearchList({ users, loading, onStartConversation }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-violet-500/10 bg-slate-900/50 px-4 py-6">
        <span className="flex items-center gap-2 text-sm text-violet-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400/20 border-t-violet-400" />
          Searching contacts...
        </span>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-violet-500/20 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-400">
        No contacts matched that email.
      </p>
    )
  }

  return (
    <div className="space-y-1.5 mt-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onStartConversation(user)}
          className="group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-all hover:bg-slate-800/80 hover:ring-1 hover:ring-violet-500/10"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-violet-300 shadow-sm transition-colors group-hover:bg-violet-500 group-hover:text-white">
              {formatDisplayName(user).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-100">{formatDisplayName(user)}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <span className="flex h-7 items-center justify-center rounded-full bg-violet-500/10 px-3 text-xs font-semibold text-violet-300 transition-colors group-hover:bg-violet-500 group-hover:text-white">
            Chat
          </span>
        </button>
      ))}
    </div>
  )
}
