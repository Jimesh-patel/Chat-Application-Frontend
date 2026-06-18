import React from 'react'
import { MessageList } from '../MessageList'
import { MessageInput } from './MessageInput'
import { formatDisplayName } from '../../utils/formatters'

export function ChatArea({
  activeConversation,
  messages,
  loadingMessages,
  isMessageMine,
  markMessageSeen,
  isActiveParticipantTyping,
  participantPresence,
  draft,
  onDraftChange,
  onSendMessage,
  sending,
  onBack,
  statusMessage
}) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-violet-500/10 bg-slate-950/80 px-4 py-3 sm:px-5 backdrop-blur-sm z-10 h-[73px]">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <button 
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <span className="text-lg font-bold">
                {activeConversation?.participantB ? formatDisplayName(activeConversation.participantB).charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-base font-semibold leading-tight text-white">
                {activeConversation?.participantB ? formatDisplayName(activeConversation.participantB) : 'Select a conversation'}
              </h3>
              <div className="mt-0.5 flex h-4 items-center">
                {isActiveParticipantTyping ? (
                  <p className="text-xs font-medium text-violet-300 animate-pulse">Typing...</p>
                ) : activeConversation ? (
                  <p className="text-xs text-slate-400">Tap to view info</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        {activeConversation && participantPresence?.isOnline && (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            Online
          </div>
        )}
        {activeConversation && !participantPresence?.isOnline && participantPresence?.lastSeenAtUtc && (
          <div className="flex items-center gap-1.5 rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-400 shadow-sm">
            Last seen {new Date(participantPresence.lastSeenAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 overflow-y-auto bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.05),_transparent_60%)] px-3 py-4 sm:px-4 custom-scrollbar">
        {statusMessage ? (
          <div className="sticky top-0 z-10 mx-auto mb-3 w-fit max-w-[90%] rounded-full border border-violet-500/20 bg-slate-900/95 px-4 py-1.5 text-center text-xs font-medium text-violet-200 shadow-sm backdrop-blur">
            {statusMessage}
          </div>
        ) : null}

        {!activeConversation ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 border border-violet-500/10 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-200">Your Messages</p>
            <p className="mt-2 max-w-xs text-sm text-slate-400">Select a contact from the sidebar or search to start chatting.</p>
          </div>
        ) : loadingMessages ? (
          <div className="flex h-full items-center justify-center">
             <div className="flex items-center gap-2 text-sm text-violet-300">
               <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400/20 border-t-violet-400" />
               Loading messages...
             </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-violet-500/10 bg-slate-900/40 p-6 text-center shadow-sm">
            <p className="text-base font-semibold text-white">No messages yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-400">Say hello and start the conversation!</p>
          </div>
        ) : (
          <div className="pb-6">
            <MessageList
              messages={messages}
              activeConversation={activeConversation}
              isMessageMine={isMessageMine}
              markMessageSeen={markMessageSeen}
            />
            <div 
              className={`mt-4 overflow-hidden transition-all duration-300 ease-in-out ${
                isActiveParticipantTyping ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-2.5 shadow-sm">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <MessageInput
        draft={draft}
        onDraftChange={onDraftChange}
        onSendMessage={onSendMessage}
        loading={sending}
        disabled={!activeConversation}
      />
    </>
  )
}
