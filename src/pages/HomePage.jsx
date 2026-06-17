import { useEffect, useMemo, useState, useCallback } from 'react'
import { request, getCurrentUserId } from '../services/auth'
import { useChatHub } from '../hooks/useChatHub'
import { MessageList } from '../components/MessageList'
import { UserSearchList } from '../components/UserSearchList'
import { MessageStatus, normalizeStatus } from '../components/MessageStatus'
import { formatDisplayName } from '../utils/formatters'

function HomePage() {
  const [users, setUsers] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState({ users: false, conversations: false, messages: false, sending: false })
  const currentUserId = useMemo(() => getCurrentUserId(), [])

  // Initialize SignalR connection
  const {
    isConnected,
    subscribeToMessages,
    subscribeToSeenUpdates,
    sendMessage,
    markMessageSeen,
  } = useChatHub()

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return []
    }

    return users.filter((user) => user.email?.toLowerCase().includes(query))
  }, [search, users])

  const loadUsers = async () => {
    setLoading((current) => ({ ...current, users: true }))

    try {
      const data = await request('/api/identity/users', { method: 'GET' })
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      setStatus(error.message || 'Unable to load users')
    } finally {
      setLoading((current) => ({ ...current, users: false }))
    }
  }

  const loadConversations = async () => {
    setLoading((current) => ({ ...current, conversations: true }))

    try {
      const data = await request('/api/chat/conversations', { method: 'GET' })
      const nextConversations = Array.isArray(data) ? data : []
      setConversations(nextConversations)
      setActiveConversation((current) => {
        if (current?.conversationId) {
          return nextConversations.find((item) => item.conversationId === current.conversationId) || nextConversations[0] || null
        }

        return nextConversations[0] || null
      })
    } catch (error) {
      setStatus(error.message || 'Unable to load conversations')
    } finally {
      setLoading((current) => ({ ...current, conversations: false }))
    }
  }

  const normalizeMessage = useCallback(
    (message) => ({
      ...message,
      status: normalizeStatus(message.status),
      seenAtUtc: message.seenAtUtc || null,
    }),
    []
  )

  const isMessageMine = useCallback(
    (message) => {
      if (currentUserId) {
        return message.senderId === currentUserId
      }
      return message.senderId !== activeConversation?.participantB?.id
    },
    [activeConversation?.participantB?.id, currentUserId]
  )

  const loadMessages = async (conversationId) => {
    if (!conversationId) {
      setMessages([])
      return
    }

    setLoading((current) => ({ ...current, messages: true }))

    try {
      const data = await request(`/api/chat/conversations/${conversationId}/messages`, { method: 'GET' })
      setMessages(Array.isArray(data) ? data.map(normalizeMessage) : [])
    } catch (error) {
      setStatus(error.message || 'Unable to load messages')
    } finally {
      setLoading((current) => ({ ...current, messages: false }))
    }
  }

  useEffect(() => {
    loadUsers()
    loadConversations()
  }, [])

  useEffect(() => {
    if (activeConversation?.conversationId) {
      loadMessages(activeConversation.conversationId)
    }
  }, [activeConversation?.conversationId])

  const updateConversationWithMessage = useCallback((message) => {
    setConversations((current) => {
      const conversationIndex = current.findIndex(
        (conv) => conv.conversationId === message.conversationId
      )

      if (conversationIndex === -1) {
        return current
      }

      const updated = [...current]
      const conversation = { ...updated[conversationIndex] }

      conversation.lastMessageAtUtc = message.sentAtUtc
      conversation.messageCount = (conversation.messageCount || 0) + 1

      updated.splice(conversationIndex, 1)
      return [conversation, ...updated]
    })
  }, [])

  // Subscribe to SignalR MessageReceived events
  useEffect(() => {
    if (!isConnected) {
      return
    }

    const handleMessageReceived = (message) => {
      console.log('[HomePage] MessageReceived event:', message)

      const normalizedMessage = normalizeMessage(message)
      const activeConversationId = activeConversation?.conversationId
      const isActiveConversation = normalizedMessage.conversationId === activeConversationId

      if (isActiveConversation) {
        setMessages((prev) => {
          const existingIndex = prev.findIndex((item) => item.messageId === normalizedMessage.messageId)
          if (existingIndex !== -1) {
            return prev.map((item) =>
              item.messageId === normalizedMessage.messageId ? { ...item, ...normalizedMessage } : item
            )
          }
          return [...prev, normalizedMessage]
        })
        console.log('[HomePage] Message added to current conversation')
      } else {
        updateConversationWithMessage(normalizedMessage)
      }
    }

    const handleMessageSeen = (...args) => {
      const firstArg = args[0] || {}
      const isObjectPayload = typeof firstArg === 'object' && firstArg !== null
      const conversationId = isObjectPayload ? firstArg.conversationId : args[0]
      const messageId = isObjectPayload ? firstArg.messageId : args[1]
      const seenAtUtc = (isObjectPayload ? firstArg.seenAtUtc : args[2]) || new Date().toISOString()

      if (!messageId) {
        return
      }

      setMessages((prev) => {
        let matched = false
        const nextMessages = prev.map((message) => {
          const isMatchingMessage = String(message.messageId) === String(messageId)
          const isMatchingConversation =
            !conversationId || String(message.conversationId) === String(conversationId)

          if (isMatchingMessage && isMatchingConversation) {
            matched = true
            return { ...message, status: MessageStatus.Seen, seenAtUtc }
          }
          return message
        })
        return nextMessages
      })
    }

    const unsubscribeMessageReceived = subscribeToMessages(handleMessageReceived)
    const unsubscribeMessageSeen = subscribeToSeenUpdates(handleMessageSeen)

    return () => {
      unsubscribeMessageReceived?.()
      unsubscribeMessageSeen?.()
    }
  }, [
    isConnected,
    activeConversation?.conversationId,
    normalizeMessage,
    updateConversationWithMessage,
    subscribeToMessages,
    subscribeToSeenUpdates,
  ])

  const handleStartConversation = async (user) => {
    try {
      const data = await request('/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ participantB: user.id }),
      })

      const nextConversation = {
        conversationId: data?.conversationId,
        participantB: data?.participantB,
      }

      setConversations((current) => {
        const existing = current.find((item) => item.conversationId === nextConversation.conversationId)
        if (existing) {
          return current
        }

        return [nextConversation, ...current]
      })
      setActiveConversation(nextConversation)
      setSearch('')
      setStatus(`Started a chat with ${formatDisplayName(data?.participantB)}`)
      await loadMessages(data?.conversationId)
      await loadConversations()
    } catch (error) {
      setStatus(error.message || 'Unable to start a conversation')
    }
  }

const handleSendMessage = async (event) => {
    event.preventDefault()

    if (!draft.trim() || !activeConversation?.conversationId || !activeConversation?.participantB?.id) {
      return
    }

    const content = draft.trim()
    setLoading((current) => ({ ...current, sending: true }))

    try {
      var response = await sendMessage({
        conversationId: activeConversation.conversationId,
        recipientId: activeConversation.participantB.id,
        content
      })

       const Message = {
        messageId: response.messageId,
        conversationId: response.conversationId,
        senderId: response.senderId,
        recipientId: activeConversation.participantB.id,
        content: response.content,
        sentAtUtc: response.sentAtUtc,
        status: response.status,
        seenAtUtc: response.seenAtUtc,
      }
      setMessages((current) => [...current, Message])
      setStatus('Message sent')
    } catch (error) {
      console.log('[HomePage] Error sending message:', error)
      setStatus(error.message || 'Unable to send message')
    } finally {
      setDraft('')
      setLoading((current) => ({ ...current, sending: false }))
    }
  }
  return (
    <section className="flex h-[calc(100dvh-7.5rem)] flex-col overflow-hidden rounded-[2rem] border border-sky-200/20 bg-slate-900/75 shadow-[0_25px_120px_-40px_rgba(34,211,238,0.55)] lg:flex-row">
      <aside className="flex w-full flex-col border-b border-sky-200/10 bg-slate-950/70 lg:w-[360px] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-sky-200/10 px-4 py-4 sm:px-5">
          <div>
            <p className="text-sm text-sky-200/80">Workspace</p>
            <h2 className="text-xl font-semibold text-white">Chats</h2>
          </div>
          <div className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-sm font-medium text-sky-200">
            Live
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          <div className="mb-4 border-b border-sky-200/10 pb-4">
            <label className="mb-2 block px-1 text-sm font-semibold text-slate-300" htmlFor="user-email-search">
              Search user by email
            </label>
            <input
              id="user-email-search"
              type="email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-sky-200/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/50"
              placeholder="Enter email id"
            />
            <div className="mt-3">
              {search.trim() ? (
                <UserSearchList
                  users={filteredUsers}
                  loading={loading.users}
                  onStartConversation={handleStartConversation}
                />
              ) : (
                <p className="rounded-xl border border-dashed border-sky-200/10 bg-slate-900/50 px-3 py-3 text-sm text-slate-400">
                  Type an email id to find a user.
                </p>
              )}
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-slate-300">Conversations</p>
              {loading.conversations ? <span className="text-xs text-sky-200">Loading…</span> : null}
            </div>
            {conversations.length === 0 ? (
              <div className="text-sm text-slate-400">No conversations yet</div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.conversationId}
                    onClick={() => setActiveConversation(conversation)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      activeConversation?.conversationId === conversation.conversationId
                        ? 'border-sky-400/40 bg-sky-400/10'
                        : 'border-sky-200/10 bg-slate-900/50 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{formatDisplayName(conversation.participantB)}</p>
                      {conversation.unseenMessageCount > 0 && (
                        <span className="rounded-full bg-sky-400 px-2 py-0.5 text-xs font-semibold text-slate-950">
                          {conversation.unseenMessageCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessageAtUtc && (
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(conversation.lastMessageAtUtc).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col bg-slate-950/60">
        <div className="flex items-center justify-between border-b border-sky-200/10 px-4 py-4 sm:px-5">
          <div>
            <p className="text-sm text-sky-200/80">Active chat</p>
            <h3 className="text-lg font-semibold text-white">
              {activeConversation?.participantB ? formatDisplayName(activeConversation.participantB) : 'Select a conversation'}
            </h3>
          </div>
          <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
            Online
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_35%)] px-3 py-4 sm:px-4">
          {status ? <div className="mb-3 rounded-2xl border border-sky-200/10 bg-slate-900/80 px-3 py-2 text-sm text-sky-200">{status}</div> : null}

          {loading.messages ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-sky-200/10 bg-slate-900/70 p-6 text-center text-slate-400">
              <p className="text-lg font-medium text-white">No messages yet</p>
              <p className="mt-2 max-w-sm text-sm">Send the first message to start your conversation.</p>
            </div>
          ) : (
            <MessageList
              messages={messages}
              activeConversation={activeConversation}
              isMessageMine={isMessageMine}
              markMessageSeen={markMessageSeen}
            />
          )}
        </div>

        <form onSubmit={handleSendMessage} className="border-t border-sky-200/10 bg-slate-950/80 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2 rounded-[1.2rem] border border-sky-200/10 bg-slate-900/80 px-3 py-2.5">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-100 outline-none"
              placeholder={activeConversation ? 'Type a message' : 'Select a conversation first'}
              disabled={!activeConversation}
            />
            <button
              type="submit"
              disabled={!activeConversation || !draft.trim() || loading.sending}
              className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading.sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default HomePage
