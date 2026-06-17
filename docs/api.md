# Chat Application API Documentation

This document provides the necessary API endpoints, their inputs, outputs, and examples for the frontend developers to integrate with the backend Chat Application.

**Base URL**: `http://localhost:<PORT>` (e.g. `http://localhost:5000`)

---

## Authentication & Authorization

Most endpoints in the Chat and Identity modules (except Login and Register) require authentication. You must include the JWT token in the `Authorization` header of your HTTP requests.

```http
Authorization: Bearer <your-access-token>
```

---

## Identity Module

### 1. Register User

Registers a new user in the system.

- **URL:** `/api/identity/register`
- **Method:** `POST`
- **Auth Required:** No

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "Password123!"
}
```

**Response (200 OK):**
Returns the newly created user's unique `Guid` identifier.

```json
"3fa85f64-5717-4562-b3fc-2c963f66afa6"
```

---

### 2. Login User

Authenticates a user and returns a JWT Access Token. The Refresh Token is securely set as an HTTP-Only Cookie (`refreshToken`).

- **URL:** `/api/identity/login`
- **Method:** `POST`
- **Auth Required:** No

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5...",
  "userId": "cwbiybvwcmcw...",
  "username": "se...",
  "email": "cidncw...."
}
```

---

### 3. Get All Users

Retrieves a list of all registered users in the platform. Useful for searching or starting conversations.

- **URL:** `/api/identity/users`
- **Method:** `GET`
- **Auth Required:** Yes

**Response (200 OK):**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe"
  }
]
```

---

## Chat Module

### 4. Create or Get Conversation

Starts a new conversation with another user, or returns the existing conversation ID if one already exists between the two users.

- **URL:** `/api/chat/conversations`
- **Method:** `POST`
- **Auth Required:** Yes

**Request Body:**
Provide the `Guid` of the target user you want to chat with.

```json
{
  "participantB": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Response (200 OK):**
Returns the `ConversationId` and the full profile of Participant B.

```json
{
  "conversationId": "b1b85f64-1111-2222-3333-2c963f66afa6",
  "participantB": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe"
  }
}
```

---

### 5. Get User Conversations

Retrieves all active conversations for the logged-in user, sorted by the last message sent.

- **URL:** `/api/chat/conversations`
- **Method:** `GET`
- **Auth Required:** Yes

**Response (200 OK):**

```json
[
  {
    "conversationId": "b1b85f64-1111-2222-3333-2c963f66afa6",
    "createdAtUtc": "2026-06-15T12:00:00Z",
    "lastMessageAtUtc": "2026-06-15T12:30:00Z",
    "unseenMessageCount": 15,
    "participantB": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe"
    }
  }
]
```

---

### 6. Send Message

Sends a new message within a specific conversation.

- **URL:** `/api/chat/conversations/{conversationId}/messages`
- **Method:** `POST`
- **Auth Required:** Yes

**URL Parameters:**

- `conversationId`: The Guid of the conversation.

**Request Body:**
Provide the recipient's `Guid` and the content of the message.

```json
{
  "recipientId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "content": "Hello! How are you?"
}
```

**Response (200 OK):**
Returns the newly created message's unique `Guid` identifier.

```json
{
  "messageId": "f9a85f64-9999-8888-7777-2c963f66a123"
}
```

---

### 7. Get Conversation Messages

Retrieves all historical messages for a specific conversation, ordered chronologically.

- **URL:** `/api/chat/conversations/{conversationId}/messages`
- **Method:** `GET`
- **Auth Required:** Yes

**URL Parameters:**

- `conversationId`: The Guid of the conversation.

**Response (200 OK):**

```json
[
  {
    "messageId": "f9a85f64-9999-8888-7777-2c963f66a123",
    "conversationId": "b1b85f64-1111-2222-3333-2c963f66afa6",
    "senderId": "11111111-2222-3333-4444-555555555555",
    "content": "Hello! How are you?",
    "sentAtUtc": "2026-06-15T12:30:00Z"
  }
]
```
