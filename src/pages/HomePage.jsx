import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { request, getCurrentUserId } from '../services/auth'
import { useChatHub } from '../hooks/useChatHub'
import { MessageStatus, normalizeStatus } from '../components/MessageStatus'
import { formatDisplayName } from '../utils/formatters'
import { ChatLayout } from '../components/chat/ChatLayout'
import { Sidebar } from '../components/chat/Sidebar'
import { ChatArea } from '../components/chat/ChatArea'

const TYPING_STOP_DELAY_MS = 1500

function HomePage() {
  const [users, setUsers] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('')
  const [typingByConversation, setTypingByConversation] = useState({})
  const [loading, setLoading] = useState({ users: false, conversations: false, messages: false, sending: false })
  const currentUserId = useMemo(() => getCurrentUserId(), [])
  const activeConversationId = activeConversation?.conversationId
  const typingStopTimerRef = useRef(null)
  const typingSentRef = useRef(false)
  const typingConversationIdRef = useRef(null)

  // Initialize SignalR connection
  const {
    isConnected,
    subscribeToMessages,
    subscribeToSeenUpdates,
    subscribeToUserTyping,
    subscribeToStopTyping,
    sendMessage,
    markMessageSeen,
    userTyping,
    stopTyping,
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

  const loadMessages = useCallback(async (conversationId) => {
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
  }, [normalizeMessage])

  useEffect(() => {
    queueMicrotask(() => {
      loadUsers()
      loadConversations()
    })
  }, [])

  useEffect(() => {
    if (activeConversationId) {
      queueMicrotask(() => {
        loadMessages(activeConversationId)
      })
    }
  }, [activeConversationId, loadMessages])

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

  const activeTypingUserIds = useMemo(() => {
    if (!activeConversationId) {
      return []
    }

    return typingByConversation[activeConversationId] || []
  }, [activeConversationId, typingByConversation])

  const isActiveParticipantTyping = activeConversation?.participantB?.id
    ? activeTypingUserIds.includes(activeConversation.participantB.id)
    : false

  const isParticipantTyping = useCallback(
    (conversation) => {
      const conversationTypingUsers = typingByConversation[conversation.conversationId] || []
      return conversation.participantB?.id
        ? conversationTypingUsers.includes(conversation.participantB.id)
        : conversationTypingUsers.length > 0
    },
    [typingByConversation]
  )

  const clearTypingTimer = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current)
      typingStopTimerRef.current = null
    }
  }, [])

  const notifyStopTyping = useCallback(
    async (conversationId = typingConversationIdRef.current) => {
      clearTypingTimer()

      if (!typingSentRef.current || !conversationId || !currentUserId) {
        return Promise.resolve()
      }

      typingSentRef.current = false
      typingConversationIdRef.current = null

      try {
        return await stopTyping({ conversationId, userId: currentUserId })
      } catch (error) {
        console.error('[HomePage] Error sending StopTyping:', error)
      }
    },
    [clearTypingTimer, currentUserId, stopTyping]
  )

  const scheduleStopTyping = useCallback(
    (conversationId) => {
      clearTypingTimer()
      typingStopTimerRef.current = setTimeout(() => {
        notifyStopTyping(conversationId)
      }, TYPING_STOP_DELAY_MS)
    },
    [clearTypingTimer, notifyStopTyping]
  )

  const notifyUserTyping = useCallback(
    (conversationId) => {
      if (!conversationId || !currentUserId || !isConnected) {
        return
      }

      const isAlreadyTypingHere =
        typingSentRef.current && typingConversationIdRef.current === conversationId

      if (!isAlreadyTypingHere) {
        if (typingSentRef.current && typingConversationIdRef.current !== conversationId) {
          notifyStopTyping(typingConversationIdRef.current)
        }

        typingSentRef.current = true
        typingConversationIdRef.current = conversationId
        userTyping({ conversationId, userId: currentUserId }).catch((error) => {
          console.error('[HomePage] Error sending UserTyping:', error)
          typingSentRef.current = false
          typingConversationIdRef.current = null
        })
      }

      scheduleStopTyping(conversationId)
    },
    [currentUserId, isConnected, notifyStopTyping, scheduleStopTyping, userTyping]
  )

  const removeTypingUser = useCallback((conversationId, userId) => {
    if (!conversationId || !userId) {
      return
    }

    setTypingByConversation((current) => {
      const existingUsers = current[conversationId] || []
      const nextUsers = existingUsers.filter((id) => id !== userId)

      if (nextUsers.length === existingUsers.length) {
        return current
      }

      const next = { ...current }
      if (nextUsers.length) {
        next[conversationId] = nextUsers
      } else {
        delete next[conversationId]
      }
      return next
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
      removeTypingUser(normalizedMessage.conversationId, normalizedMessage.senderId)
      const isActiveMessageConversation = normalizedMessage.conversationId === activeConversationId

      if (isActiveMessageConversation) {
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
        const nextMessages = prev.map((message) => {
          const isMatchingMessage = String(message.messageId) === String(messageId)
          const isMatchingConversation =
            !conversationId || String(message.conversationId) === String(conversationId)

          if (isMatchingMessage && isMatchingConversation) {
            return { ...message, status: MessageStatus.Seen, seenAtUtc }
          }
          return message
        })
        return nextMessages
      })
    }

    const handleUserTyping = (payload) => {
      if (!payload?.conversationId || !payload?.userId || payload.userId === currentUserId) {
        return
      }

      setTypingByConversation((current) => {
        const existingUsers = current[payload.conversationId] || []
        if (existingUsers.includes(payload.userId)) {
          return current
        }

        return {
          ...current,
          [payload.conversationId]: [...existingUsers, payload.userId],
        }
      })
    }

    const handleStopTyping = (payload) => {
      removeTypingUser(payload?.conversationId, payload?.userId)
    }

    const unsubscribeMessageReceived = subscribeToMessages(handleMessageReceived)
    const unsubscribeMessageSeen = subscribeToSeenUpdates(handleMessageSeen)
    const unsubscribeUserTyping = subscribeToUserTyping(handleUserTyping)
    const unsubscribeStopTyping = subscribeToStopTyping(handleStopTyping)

    return () => {
      unsubscribeMessageReceived?.()
      unsubscribeMessageSeen?.()
      unsubscribeUserTyping?.()
      unsubscribeStopTyping?.()
    }
  }, [
    isConnected,
    activeConversationId,
    currentUserId,
    normalizeMessage,
    removeTypingUser,
    updateConversationWithMessage,
    subscribeToMessages,
    subscribeToSeenUpdates,
    subscribeToUserTyping,
    subscribeToStopTyping,
  ])

  useEffect(() => {
    return () => {
      notifyStopTyping()
    }
  }, [activeConversationId, notifyStopTyping])

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

  const handleDraftChange = (event) => {
    const nextDraft = event.target.value
    setDraft(nextDraft)

    if (!nextDraft.trim()) {
      notifyStopTyping(activeConversation?.conversationId)
      return
    }

    notifyUserTyping(activeConversation?.conversationId)
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()

    if (!draft.trim() || !activeConversation?.conversationId || !activeConversation?.participantB?.id) {
      return
    }

    const content = draft.trim()
    await notifyStopTyping(activeConversation.conversationId)
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

  const [isMobileChatActive, setIsMobileChatActive] = useState(false)

  const handleSelectConversation = useCallback((conversation) => {
    setActiveConversation(conversation)
    setIsMobileChatActive(true)
  }, [])

  const handleBackToList = useCallback(() => {
    setIsMobileChatActive(false)
  }, [])

  const handleStartConversationWrapper = async (user) => {
    await handleStartConversation(user)
    setIsMobileChatActive(true)
  }

  return (
    <ChatLayout 
      isChatActive={isMobileChatActive}
      sidebar={
        <Sidebar 
          search={search}
          onSearchChange={setSearch}
          filteredUsers={filteredUsers}
          loading={loading}
          onStartConversation={handleStartConversationWrapper}
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          isParticipantTyping={isParticipantTyping}
        />
      }
      chatArea={
        <ChatArea 
          activeConversation={activeConversation}
          messages={messages}
          loadingMessages={loading.messages}
          isMessageMine={isMessageMine}
          markMessageSeen={markMessageSeen}
          isActiveParticipantTyping={isActiveParticipantTyping}
          draft={draft}
          onDraftChange={handleDraftChange}
          onSendMessage={handleSendMessage}
          sending={loading.sending}
          onBack={handleBackToList}
          statusMessage={status}
        />
      }
    />
  )
}

export default HomePage
