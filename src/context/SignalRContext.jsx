import { createContext, useEffect, useState } from 'react'
import { chatHub } from '../services/signalr/chatHub'
import { isAuthenticated } from '../services/auth'

export const SignalRContext = createContext({
  isConnected: false,
  connection: null,
})

export function SignalRProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const handleConnectionState = (state) => {
      setIsConnected(state === 'connected')
    }

    const handleAuthLoggedIn = async () => {
      try {
        await chatHub.addConsumer()
      } catch (error) {
        console.error('[SignalRProvider] Connection error after login:', error)
        setIsConnected(false)
      }
    }

    const handleAuthLoggedOut = async () => {
      console.log('[SignalRProvider] Logged out, disconnecting SignalR')
      try {
        await chatHub.stop()
        setIsConnected(false)
      } catch (error) {
        console.error('[SignalRProvider] Error disconnecting on logout:', error)
      }
    }

    const handleSessionExpired = async () => {
      console.log('[SignalRProvider] Session expired, disconnecting SignalR')
      try {
        await chatHub.stop()
        setIsConnected(false)
      } catch (error) {
        console.error('[SignalRProvider] Error disconnecting on session expiration:', error)
      }
    }

    chatHub.addConnectionStateListener(handleConnectionState)
    window.addEventListener('auth:logged-in', handleAuthLoggedIn)
    window.addEventListener('auth:logged-out', handleAuthLoggedOut)
    window.addEventListener('auth:session-expired', handleSessionExpired)

    if (isAuthenticated()) {
      handleAuthLoggedIn()
    }

    return () => {
      chatHub.removeConnectionStateListener(handleConnectionState)
      window.removeEventListener('auth:logged-in', handleAuthLoggedIn)
      window.removeEventListener('auth:logged-out', handleAuthLoggedOut)
      window.removeEventListener('auth:session-expired', handleSessionExpired)
      chatHub.removeConsumer()
    }
  }, [])

  const value = {
    isConnected,
    connection: chatHub.connection,
  }

  return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>
}
