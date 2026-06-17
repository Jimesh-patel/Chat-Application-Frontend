import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7226'
const HUB_URL = `${API_BASE_URL}/hubs/chat`
const ACCESS_TOKEN_KEY = 'chat_app_access_token'
const STOP_DELAY_MS = 100

class ChatHub {
  constructor() {
    this.connection = null
    this.startPromise = null
    this.stopPromise = null
    this.stopRequested = false
    this.consumerCount = 0
    this.stopTimer = null
    this.stateListeners = new Set()
  }

  createConnection() {
    if (this.connection) {
      return this.connection
    }

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem(ACCESS_TOKEN_KEY),
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryCount) => {
          if (retryCount === 0) return 0
          if (retryCount === 1) return 2000
          if (retryCount === 2) return 5000
          if (retryCount === 3) return 10000
          if (retryCount === 4) return 30000
          return 60000
        },
      })
      .configureLogging(LogLevel.Information)
      .build()

    this.setupConnectionHandlers(connection)
    this.connection = connection
    return connection
  }

  setupConnectionHandlers(connection) {
    connection.onreconnecting(() => {
      console.log('[ChatHub] Reconnecting to SignalR...')
      this.emitConnectionState('reconnecting')
    })

    connection.onreconnected(() => {
      console.log('[ChatHub] Reconnected to SignalR')
      this.emitConnectionState('connected')
    })

    connection.onclose(() => {
      console.log('[ChatHub] Disconnected from SignalR')
      this.emitConnectionState('disconnected')
    })
  }

  emitConnectionState(state) {
    this.stateListeners.forEach((listener) => {
      try {
        listener(state)
      } catch (error) {
        console.error('[ChatHub] Connection state listener error:', error)
      }
    })
  }

  addConnectionStateListener(listener) {
    this.stateListeners.add(listener)
  }

  removeConnectionStateListener(listener) {
    this.stateListeners.delete(listener)
  }

  async start() {
    if (!this.connection) {
      this.createConnection()
    }

    if (this.connection.state === 'Connected') {
      return this.connection
    }

    if (this.startPromise) {
      return this.startPromise
    }

    this.stopRequested = false
    this.isConnecting = true

    const startPromise = this.connection.start()
    this.startPromise = startPromise

    try {
      await startPromise
      console.log('[ChatHub] Connected to SignalR')
      this.emitConnectionState('connected')
      return this.connection
    } catch (error) {
      console.error('[ChatHub] Failed to connect:', error)
      throw error
    } finally {
      this.isConnecting = false
      this.startPromise = null

      if (this.stopRequested) {
        await this.stop()
      }
    }
  }

  async stop() {
    if (!this.connection) {
      return
    }

    this.stopRequested = true

    if (this.startPromise) {
      await this.startPromise.catch(() => {})
    }

    if (!this.connection || this.connection.state !== 'Connected') {
      this.stopRequested = false
      return
    }

    if (this.stopPromise) {
      return this.stopPromise
    }

    this.stopPromise = this.connection
      .stop()
      .then(() => {
        console.log('[ChatHub] SignalR connection stopped')
        this.emitConnectionState('disconnected')
      })
      .catch((error) => {
        console.error('[ChatHub] Error stopping connection:', error)
        throw error
      })
      .finally(() => {
        this.stopPromise = null
        this.stopRequested = false
        this.connection = null
        this.consumerCount = 0
      })

    return this.stopPromise
  }

  async addConsumer() {
    this.consumerCount += 1

    if (this.stopTimer) {
      clearTimeout(this.stopTimer)
      this.stopTimer = null
    }

    try {
      await this.start()
    } catch (error) {
      console.error('[ChatHub] Could not start hub for consumer:', error)
      throw error
    }
  }

  removeConsumer() {
    this.consumerCount = Math.max(0, this.consumerCount - 1)

    if (this.consumerCount > 0) {
      return
    }

    if (this.stopTimer) {
      clearTimeout(this.stopTimer)
    }

    this.stopTimer = setTimeout(() => {
      this.stopTimer = null
      if (this.consumerCount === 0) {
        this.stop().catch(() => {})
      }
    }, STOP_DELAY_MS)
  }

  on(methodName, callback) {
    if (!this.connection) {
      throw new Error('Connection not initialized')
    }

    this.connection.on(methodName, callback)
    console.log(`[ChatHub] Registered listener for: ${methodName}`)
  }

  off(methodName, callback) {
    if (!this.connection) {
      return
    }

    this.connection.off(methodName, callback)
    console.log(`[ChatHub] Unregistered listener for: ${methodName}`)
  }

  async invoke(methodName, ...args) {
    if (!this.connection) {
      throw new Error('Connection not initialized')
    }

    return this.connection.invoke(methodName, ...args)
  }

  async sendMessage(command) {
    return this.invoke('SendMessage', command)
  }

  async markMessageDelivered(conversationId, messageId) {
    return this.invoke('MarkMessageDelivered', conversationId, messageId)
  }

  async markMessageSeen(conversationId, messageId) {
    return this.invoke('MarkMessageSeen', conversationId, messageId)
  }

  getState() {
    return this.connection?.state || 'Disconnected'
  }

  isConnected() {
    return this.connection?.state === 'Connected'
  }
}

export const chatHub = new ChatHub()
