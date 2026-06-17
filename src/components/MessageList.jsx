import { useEffect, useRef } from 'react'
import { MessageItem } from './MessageItem'
import { MessageStatus } from './MessageStatus'

export function MessageList({
  messages,
  activeConversation,
  isMessageMine,
  markMessageSeen,
}) {
  const messagesListRef = useRef(null)
  const seenRequestsRef = useRef(new Set())

  useEffect(() => {
    const container = messagesListRef.current
    if (!container || !activeConversation?.conversationId || !markMessageSeen) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          const messageId = entry.target.dataset.messageId
          const message = messages.find((item) => item.messageId === messageId)

          if (
            !message ||
            isMessageMine(message) ||
            message.status === MessageStatus.Seen ||
            seenRequestsRef.current.has(messageId)
          ) {
            return
          }

          seenRequestsRef.current.add(messageId)
          markMessageSeen(activeConversation.conversationId, messageId)
            .catch((error) => {
              console.error('[MessageList] Error marking visible message seen:', error)
              seenRequestsRef.current.delete(messageId)
            })
        })
      },
      { threshold: 0.6 }
    )

    const nodes = container.querySelectorAll('.message-item')
    nodes.forEach((node) => observer.observe(node))

    return () => observer.disconnect()
  }, [activeConversation?.conversationId, isMessageMine, markMessageSeen, messages])

  return (
    <div ref={messagesListRef} className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_35%)] px-3 py-4 sm:px-4">
      <div className="space-y-3">
        {messages.map((message) => (
          <MessageItem
            key={message.messageId || message.sentAtUtc}
            message={message}
            isMine={isMessageMine(message)}
          />
        ))}
      </div>
    </div>
  )
}
