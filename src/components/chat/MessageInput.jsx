import React from 'react'

export function MessageInput({ draft, onDraftChange, onSendMessage, loading, disabled }) {
  return (
    <form onSubmit={onSendMessage} className="border-t border-violet-500/10 bg-slate-950/80 px-3 py-3 sm:px-4">
      <div className="flex items-center gap-2 rounded-3xl border border-violet-500/20 bg-slate-900/90 px-2 py-1.5 transition-colors focus-within:border-violet-500/50 focus-within:bg-slate-900">
        <input
          value={draft}
          onChange={onDraftChange}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
          placeholder={disabled ? 'Select a conversation first' : 'Type your message...'}
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim() || loading}
          className="flex h-10 min-w-[80px] items-center justify-center rounded-full bg-violet-500 px-4 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:bg-violet-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            'Send'
          )}
        </button>
      </div>
    </form>
  )
}
