import { formatDisplayName } from '../utils/formatters'

export function UserSearchList({ users, loading, onStartConversation }) {
  if (loading) {
    return (
      <p className="rounded-xl border border-sky-200/10 bg-slate-900/70 px-3 py-3 text-sm text-sky-200">
        Searching users...
      </p>
    )
  }

  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-sky-200/10 bg-slate-900/70 px-3 py-3 text-sm text-slate-400">
        No user matched that email id.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onStartConversation(user)}
          className="flex w-full items-center justify-between rounded-2xl border border-sky-200/10 bg-slate-900/70 px-3 py-3 text-left transition hover:border-sky-300/40 hover:bg-slate-800"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{formatDisplayName(user)}</p>
            <p className="truncate text-sm text-slate-400">{user.email}</p>
          </div>
          <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-semibold text-slate-200">Chat</span>
        </button>
      ))}
    </div>
  )
}
