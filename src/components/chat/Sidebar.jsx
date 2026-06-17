import React from 'react'
import { UserSearchList } from '../UserSearchList'
import { ConversationList } from '../ConversationList'

export function Sidebar({
  search,
  onSearchChange,
  filteredUsers,
  loading,
  onStartConversation,
  conversations,
  activeConversation,
  onSelectConversation,
  isParticipantTyping
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 custom-scrollbar">
        {/* Search Section */}
        <div className="mb-5">
          <label className="mb-2 block px-1 text-sm font-semibold text-slate-300" htmlFor="user-email-search">
            Search Contacts
          </label>
          <div className="relative">
            <input
              id="user-email-search"
              type="email"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-2xl border border-violet-200/10 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-violet-400/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-violet-400/50"
              placeholder="Enter email address..."
            />
          </div>
          <div className="mt-3">
            {search.trim() ? (
              <UserSearchList
                users={filteredUsers}
                loading={loading.users}
                onStartConversation={onStartConversation}
              />
            ) : null}
          </div>
        </div>

        {/* Conversations List */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-slate-300">Recent</p>
            {loading.conversations ? (
              <span className="flex items-center gap-1.5 text-xs text-violet-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"></span>
                Syncing
              </span>
            ) : null}
          </div>
          <ConversationList 
            conversations={conversations} 
            activeConversationId={activeConversation?.conversationId} 
            onSelect={onSelectConversation}
            isParticipantTyping={isParticipantTyping}
          />
        </div>
      </div>
    </>
  )
}
