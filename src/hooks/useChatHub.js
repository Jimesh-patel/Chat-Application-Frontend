import { useContext, useCallback, useEffect, useRef, useMemo } from 'react'
import { SignalRContext } from '../context/signalRContextValue'
import { chatHub } from '../services/signalr/chatHub'

/**
 * Custom hook to manage SignalR chat hub connections and event subscriptions
 * Provides methods to subscribe to and unsubscribe from chat messages
 */
export function useChatHub() {
  const { isConnected } = useContext(SignalRContext)
  const subscriptionsRef = useRef(new Map())

  const unsubscribeFromEvent = useCallback((callbackId) => {
    const subscription = subscriptionsRef.current.get(callbackId)
    if (!subscription) {
      return
    }

    try {
      chatHub.off(subscription.eventName, subscription.callback)
      subscriptionsRef.current.delete(callbackId)
      console.log(`[useChatHub] Unsubscribed from ${subscription.eventName} (ID: ${callbackId})`)
    } catch (error) {
      console.error(`[useChatHub] Error unsubscribing from ${subscription.eventName}:`, error)
    }
  }, [])

  const subscribeToEvent = useCallback(
    (eventName, callback) => {
      if (!callback || typeof callback !== 'function') {
        console.warn(`[useChatHub] Invalid callback provided to subscribe to ${eventName}`)
        return () => {}
      }

      const callbackId = Math.random().toString(36)
      const wrappedCallback = (...args) => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`[useChatHub] Error in ${eventName} callback:`, error)
        }
      }

      subscriptionsRef.current.set(callbackId, { eventName, callback: wrappedCallback })

      try {
        if (!chatHub.connection) {
          chatHub.createConnection()
        }
        chatHub.on(eventName, wrappedCallback)
        console.log(`[useChatHub] Subscribed to ${eventName} (ID: ${callbackId})`)
      } catch (error) {
        console.error(`[useChatHub] Error subscribing to ${eventName}:`, error)
        subscriptionsRef.current.delete(callbackId)
        throw error
      }

      return () => {
        unsubscribeFromEvent(callbackId)
      }
    },
    [unsubscribeFromEvent]
  )

  const subscribeToMessages = useCallback(
    (callback) => subscribeToEvent('MessageReceived', callback),
    [subscribeToEvent]
  )

  const subscribeToDeliveryUpdates = useCallback(
    (callback) => subscribeToEvent('MessageDelivered', callback),
    [subscribeToEvent]
  )

  const subscribeToSeenUpdates = useCallback(
    (callback) => subscribeToEvent('MessageSeen', callback),
    [subscribeToEvent]
  )

  const subscribeToUserTyping = useCallback(
    (callback) => subscribeToEvent('UserTyping', callback),
    [subscribeToEvent]
  )

  const subscribeToStopTyping = useCallback(
    (callback) => subscribeToEvent('StopTyping', callback),
    [subscribeToEvent]
  )

  const subscribeToPresenceOnline = useCallback(
    (callback) => subscribeToEvent('PresenceOnline', callback),
    [subscribeToEvent]
  )

  const subscribeToPresenceOffline = useCallback(
    (callback) => subscribeToEvent('PresenceOffline', callback),
    [subscribeToEvent]
  )

  /**
   * Clean up all subscriptions when component unmounts
   */
  useEffect(() => {
    const subscriptions = subscriptionsRef.current

    return () => {
      subscriptions.forEach((subscription, callbackId) => {
        try {
          chatHub.off(subscription.eventName, subscription.callback)
          console.log(`[useChatHub] Cleaned up ${subscription.eventName} subscription (ID: ${callbackId})`)
        } catch (error) {
          console.error('[useChatHub] Error cleaning up subscription:', error)
        }
      })
      subscriptions.clear()
    }
  }, [])

  const apiMethods = useMemo(() => ({
    sendMessage: chatHub.sendMessage.bind(chatHub),
    markMessageDelivered: chatHub.markMessageDelivered.bind(chatHub),
    markMessageSeen: chatHub.markMessageSeen.bind(chatHub),
    userTyping: chatHub.userTyping.bind(chatHub),
    stopTyping: chatHub.stopTyping.bind(chatHub),
    subscribeToPresence: chatHub.subscribeToPresence.bind(chatHub),
    unsubscribeFromPresence: chatHub.unsubscribeFromPresence.bind(chatHub),
  }), [])

  return {
    isConnected,
    connection: chatHub.connection,
    subscribeToMessages,
    subscribeToDeliveryUpdates,
    subscribeToSeenUpdates,
    subscribeToUserTyping,
    subscribeToStopTyping,
    subscribeToPresenceOnline,
    subscribeToPresenceOffline,
    ...apiMethods
  }
}
