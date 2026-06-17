# SignalR Implementation - Quick Testing Guide

## Prerequisites
- Backend running on `https://localhost:7226`
- Frontend running on `http://localhost:5173`
- Two user accounts created for testing

## Manual Testing Steps

### Test 1: Basic Connection
1. Open browser DevTools (F12)
2. Go to Console tab
3. Log in to the application
4. Check for `[ChatHub] Connected to SignalR` message
5. Go to Network tab → Filter by "WS"
6. Should see WebSocket connection to `/hubs/chat`

### Test 2: Send & Receive Messages
1. Open two browser windows (different users)
2. User A: Start a conversation with User B
3. User B: Accept/open the conversation
4. User A: Type a message and send
5. **Expected:** Message appears on User B's screen **instantly** without refresh
6. Check console logs show `[HomePage] MessageReceived event`

### Test 3: Conversation List Update
1. Repeat Test 2
2. When User B receives message:
   - Conversation should move to **top** of list
   - Last message timestamp should update
   - Message count should increment
3. Check `[HomePage] Message added to current conversation` in console

### Test 4: Message for Different Conversation
1. User A and User B have two conversations (with User C)
2. User A has Conversation 1 open
3. User C sends message to Conversation 2
4. **Expected:** Conversation 2 updates in list but message doesn't appear in Conversation 1
5. Check console shows `[HomePage] Message is for a different conversation`

### Test 5: Reconnection
1. Open DevTools → Network tab
2. Send a message successfully
3. Throttle network or toggle offline mode
4. Connection should attempt to reconnect
5. Check console for `[ChatHub] Reconnecting to SignalR...`
6. Go back online
7. Check console for `[ChatHub] Reconnected to SignalR`

### Test 6: Logout/Cleanup
1. Send a message (verify SignalR works)
2. Click Logout
3. Check Network tab - WebSocket should close
4. Check console for `[SignalRProvider] Disconnected from SignalR`
5. Go back to login page

### Test 7: No Message Duplication
1. Send multiple messages quickly
2. Count messages displayed
3. Should match exact count sent
4. No messages should appear twice

### Test 8: Message Formatting
1. Receive a message
2. Verify message displays with:
   - Sender name (or "You")
   - Message content
   - Timestamp in local time
   - Correct background color (outgoing = sky-400, incoming = slate-900)

## Console Monitoring

Open browser console and watch for these log messages:

### Connection Lifecycle
```
[SignalRProvider] Starting SignalR connection...
[ChatHub] Connected to SignalR
[ChatHub] Reconnecting to SignalR...
[ChatHub] Reconnected to SignalR
[ChatHub] Disconnected from SignalR
```

### Message Events
```
[useChatHub] Subscribed to messages (ID: xxx)
[useChatHub] Unsubscribed from messages (ID: xxx)
[HomePage] MessageReceived event: {...}
[HomePage] Message added to current conversation
```

### Errors
```
[ChatHub] Failed to connect: ...
[SignalRProvider] Connection error: ...
[useChatHub] Error in message callback: ...
```

## Debugging Tools

### Check Connection Status
```javascript
// In browser console:
localStorage.getItem('chat_app_access_token')  // Should not be empty when logged in
```

### Monitor WebSocket
1. DevTools → Network tab
2. Filter: "WS"
3. Click on "chat" WebSocket connection
4. View "Messages" tab to see real-time data flow

### Check Reconnection Config
```javascript
// Reconnect delays (in ms):
// Attempt 1: 0
// Attempt 2: 2000
// Attempt 3: 5000
// Attempt 4: 10000
// Attempt 5: 30000
// Attempt 6+: 60000
```

## Known Limitations

- Messages are only persisted if sent before the user closes the connection
- If both users disconnect, no queuing of messages (expected behavior)
- Offline mode not explicitly tested (relies on browser's offline detection)

## Success Criteria

✅ All tests pass without errors
✅ Messages appear instantly without page refresh
✅ Conversation list updates in real-time
✅ Reconnection works automatically
✅ Logout properly disconnects
✅ Console shows proper log messages
✅ No duplicate messages or subscriptions
✅ WebSocket stays connected during chat

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No messages received | Check backend is running; verify access token exists; check console for errors |
| WebSocket not connecting | Verify backend URL and hub path; check firewall/SSL settings |
| Reconnection loop | Check network stability; verify backend is handling reconnects |
| Multiple subscriptions | Check component not remounting; ensure cleanup functions called |
| Messages appearing twice | Check no duplicate subscriptions; review subscription cleanup |
| Conversation list not updating | Verify message is received first; check updateConversationWithMessage logic |
