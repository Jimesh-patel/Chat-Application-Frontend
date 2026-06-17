import { formatDisplayName } from '../utils/formatters'

export function ConversationList({ conversations, activeConversationId, onSelect, isParticipantTyping }) {
  return (
    <div className="space-y-1.5">
      {conversations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-violet-500/20 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-400">
          No conversations yet. Start a chat above!
        </p>
      ) : (
        conversations.map((conversation) => {
          const isActive = activeConversationId === conversation.conversationId
          return (
            <button
              key={conversation.conversationId}
              onClick={() => onSelect(conversation)}
              className={`group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-all ${
                isActive
                  ? 'bg-violet-500/15 shadow-sm ring-1 ring-violet-500/30'
                  : 'hover:bg-slate-800/80 hover:ring-1 hover:ring-violet-500/10'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-colors ${
                  isActive 
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white' 
                    : 'bg-slate-800 text-violet-300 group-hover:bg-slate-700'
                }`}>
                  {formatDisplayName(conversation.participantB).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-100">{formatDisplayName(conversation.participantB)}</p>
                  <div className="relative h-4 overflow-hidden mt-0.5">
                    <p className={`absolute inset-0 truncate text-xs font-medium text-violet-400 transition-all duration-300 ${isParticipantTyping && isParticipantTyping(conversation) ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                      Typing...
                    </p>
                    <p className={`absolute inset-0 truncate text-xs text-slate-400 transition-all duration-300 ${isParticipantTyping && isParticipantTyping(conversation) ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
                      {conversation.lastMessageAtUtc 
                        ? `${new Date(conversation.lastMessageAtUtc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` 
                        : 'New conversation'}
                    </p>
                  </div>
                </div>
              </div>
              {conversation.unseenMessageCount > 0 ? (
                <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white shadow-sm shadow-violet-500/20">
                  {conversation.unseenMessageCount}
                </span>
              ) : null}
            </button>
          )
        })
      )}
    </div>
  )
}
