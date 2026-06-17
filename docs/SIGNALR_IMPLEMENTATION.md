# SignalR Real-Time Chat Implementation Guide

## Overview
This document describes the SignalR implementation for real-time messaging in the Chat Application frontend.

## Architecture

### 1. **ChatHub Service** (`src/services/signalr/chatHub.js`)
The core SignalR service that handles connection management.

**Features:**
- Creates HubConnection with automatic reconnect policy
- JWT authentication via accessTokenFactory
- Connection state management
- Event subscription/unsubscription
- Reconnection handling with exponential backoff

**Key Methods:**
- `createConnection()` - Creates the HubConnection
- `start()` - Initiates the connection
- `stop()` - Closes the connection
- `on(methodName, callback)` - Subscribes to server events
- `off(methodName, callback)` - Unsubscribes from server events
- `isConnected()` - Returns connection status

**Reconnection Strategy:**
- 0ms delay on first attempt
- 2s delay on second attempt
- 5s delay on third attempt
- 10s delay on fourth attempt
- 30s delay on fifth attempt
- 60s delay on subsequent attempts

### 2. **SignalRContext** (`src/context/SignalRContext.jsx`)
React Context that manages the lifecycle of the SignalR connection.

**Responsibilities:**
- Creates connection once when component mounts
- Automatically connects when authenticated (access token exists)
- Handles disconnection on logout (listens to `auth:session-expired` event)
- Provides connection state to all child components
- Manages cleanup on unmount

**Exposed Values:**
```javascript
{
  isConnected: boolean,     // True when connected to SignalR hub
  connection: HubConnection // The underlying connection instance
}
```

### 3. **useChatHub Hook** (`src/hooks/useChatHub.js`)
Custom React hook for managing message subscriptions.

**Features:**
- Easy message subscription/unsubscription
- Automatic cleanup to prevent duplicate subscriptions
- Error handling in callbacks
- Subscription tracking

**API:**
```javascript
const { isConnected, subscribeToMessages, unsubscribeFromMessages } = useChatHub()

// Subscribe to messages
const unsubscribe = subscribeToMessages((message) => {
  // Handle message
})

// Unsubscribe (called automatically on unmount)
unsubscribe()
```

### 4. **HomePage Integration** (`src/pages/HomePage.jsx`)
The chat interface where messages are displayed and sent.

**SignalR Integration:**
- Uses `useChatHub()` hook to access SignalR
- Subscribes to `MessageReceived` events when conversation is active
- On message arrival:
  - Checks if message belongs to current conversation
  - If yes: appends to messages state
  - If no: updates conversation list only
- Updates conversation list (last message, timestamp, position)

## Data Flow

### Sending a Message
```
User types message
    ↓
Click Send button
    ↓
POST to /api/chat/conversations/{conversationId}/messages
    ↓
Server processes message
    ↓
Server publishes MessageReceived event to SignalR
    ↓
Recipients receive event via SignalR
```

### Receiving a Message (Real-time)
```
Server publishes MessageReceived event to SignalR hub
    ↓
ChatHub receives MessageReceived event
    ↓
useChatHub hook callback triggered
    ↓
HomePage component checks if message is for current conversation
    ↓
If yes: Add to messages state + Update conversation list
If no: Update conversation list only
    ↓
UI updates immediately (no page refresh needed)
```

## Event Format

**MessageReceived Event Payload:**
```javascript
{
  messageId: "guid",           // Unique message identifier
  conversationId: "guid",      // Conversation identifier
  senderId: "guid",            // User who sent the message
  content: "Hello",            // Message text
  sentAtUtc: "2025-01-01T12:00:00Z"  // ISO 8601 timestamp
}
```

## Connection Setup

### Hub Connection URL
```
https://localhost:7226/hubs/chat
```

### Authentication
JWT access token from `localStorage.getItem('chat_app_access_token')` is automatically sent with the connection via `accessTokenFactory`.

### Transport Options
- Primary: WebSockets
- Fallback: LongPolling

## Reconnection Handling

The implementation automatically handles disconnections:

**Events Logged:**
- `[ChatHub] Connecting...` - Starting connection
- `[ChatHub] Connected to SignalR` - Successfully connected
- `[ChatHub] Reconnecting to SignalR...` - Attempting to reconnect
- `[ChatHub] Reconnected to SignalR` - Successfully reconnected
- `[ChatHub] Disconnected from SignalR` - Connection closed
- `[SignalRProvider] Connection error:` - Connection failed

## Cleanup & Memory Management

**Automatic Cleanup:**
- When component unmounts: unsubscribe from all events
- On logout: disconnect from SignalR hub
- Subscription callbacks tracked with unique IDs to prevent duplicates
- useEffect cleanup functions remove event listeners

## Integration Steps

### 1. App.jsx
```javascript
import { SignalRProvider } from './context/SignalRContext'

function App() {
  return (
    <BrowserRouter>
      <SignalRProvider>
        <AppShell />
      </SignalRProvider>
    </BrowserRouter>
  )
}
```

### 2. HomePage.jsx
```javascript
import { useChatHub } from '../hooks/useChatHub'

function HomePage() {
  const { isConnected, subscribeToMessages } = useChatHub()
  
  useEffect(() => {
    // Subscribe to messages when conversation changes
    const unsubscribe = subscribeToMessages((message) => {
      if (message.conversationId === activeConversation.conversationId) {
        setMessages(prev => [...prev, message])
      }
    })
    
    return () => unsubscribe()
  }, [isConnected, activeConversation])
}
```

## Key Features

✅ **Automatic Reconnection** - Exponential backoff strategy
✅ **JWT Authentication** - Secure token-based auth
✅ **Real-time Updates** - Messages appear instantly
✅ **Conversation Management** - List updates with new messages
✅ **No Polling** - Pure push-based updates via SignalR
✅ **Memory Safe** - Proper cleanup and subscription tracking
✅ **Error Handling** - Graceful error management
✅ **Session Awareness** - Disconnects on logout

## Testing Checklist

- [ ] User A and User B can send/receive messages in real-time
- [ ] Messages appear immediately without page refresh
- [ ] Conversation list updates with latest message
- [ ] Active conversation moves to top of list
- [ ] Reconnection works if connection drops
- [ ] No duplicate messages displayed
- [ ] Logout disconnects SignalR
- [ ] Console shows proper log messages
- [ ] Browser DevTools Network tab shows WebSocket connection to /hubs/chat

## Debugging

### Enable Console Logging
All SignalR events are logged to console with `[ChatHub]`, `[SignalRProvider]`, or `[useChatHub]` prefixes.

### Common Issues

**Messages not appearing:**
1. Check SignalR connection status: `console.log(isConnected)`
2. Verify access token exists: `localStorage.getItem('chat_app_access_token')`
3. Check browser console for errors
4. Verify hub URL is correct: `https://localhost:7226/hubs/chat`

**Reconnection not working:**
1. Check automatic reconnect policy is enabled
2. Review browser DevTools Network tab
3. Check server is running and accessible

**Multiple subscriptions:**
1. Check useEffect cleanup functions are being called
2. Verify component is not remounting unnecessarily
3. Review component subscription IDs in console

## Package Dependencies

```json
{
  "@microsoft/signalr": "^8.x.x"
}
```

## Files Created/Modified

**Created:**
- `src/services/signalr/chatHub.js`
- `src/context/SignalRContext.jsx`
- `src/hooks/useChatHub.js`

**Modified:**
- `src/App.jsx` - Added SignalRProvider
- `src/pages/HomePage.jsx` - Added SignalR integration

**No changes needed to:**
- `src/services/auth.js`
- Other components
