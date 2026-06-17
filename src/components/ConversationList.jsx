import { formatDisplayName } from '../utils/formatters'

export function ConversationList({ conversations, activeConversationId, loading, onSelect }) {
  return (
    <div className="space-y-2">
      {conversations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sky-200/10 bg-slate-900/70 px-3 py-3 text-sm text-slate-400">
          Start a conversation to see it here.
        </p>
      ) : (
        conversations.map((conversation) => (
          <button
            key={conversation.conversationId}
            onClick={() => onSelect(conversation)}
            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
              activeConversationId === conversation.conversationId
                ? 'border-sky-400/40 bg-sky-400/10'
                : 'border-sky-200/10 bg-slate-900/70 hover:border-sky-300/40 hover:bg-slate-800'
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{formatDisplayName(conversation.participantB)}</p>
              <p className="truncate text-sm text-slate-400">
                {conversation.lastMessageAtUtc ? `Last active ${new Date(conversation.lastMessageAtUtc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'New conversation'}
              </p>
            </div>
            {!!conversation.messageCount ? (
              <span className="rounded-full bg-sky-400 px-2.5 py-1 text-xs font-semibold text-slate-950">
                {conversation.messageCount}
              </span>
            ) : null}
          </button>
        ))
      )}
    </div>
  )
}
