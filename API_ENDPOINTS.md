# API Endpoints Documentation

This document describes the available API endpoints for building custom chat UIs.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: Set via `VITE_CHAT_API_URL` environment variable

## Authentication

All endpoints require authentication. Include credentials in requests:

```typescript
fetch(url, {
  credentials: 'include', // Important for cookies
});
```

## Endpoints

### 1. Chat Stream

**POST** `/api/chat`

Start a new chat conversation or continue an existing one.

**Request Body:**
```typescript
{
  id: string;                    // Chat ID (use nanoid() to generate)
  message: {
    id: string;                  // Message ID (use nanoid())
    role: 'user';
    parts: Array<{
      type: 'text';
      text: string;
    }>;
  };
  selectedChatModel: string;     // e.g., 'chat-model-basic'
  selectedVisibilityType: 'private' | 'public';
}
```

**Response:**
Server-Sent Events (SSE) stream with chat messages

**Example:**
```typescript
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: chatId,
    message: {
      id: nanoid(),
      role: 'user',
      parts: [{ type: 'text', text: 'Hello!' }]
    },
    selectedChatModel: 'chat-model-basic',
    selectedVisibilityType: 'private'
  })
});
```

---

### 2. Chat History

**GET** `/api/history`

Get user's chat history with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `perPage` (optional): Items per page (default: 10)

**Response:**
```typescript
{
  chats: Array<{
    id: string;
    title: string;
    createdAt: string;
    visibility: 'private' | 'public';
  }>;
  hasMore: boolean;
}
```

**Example:**
```typescript
const response = await fetch('http://localhost:3000/api/history?page=0', {
  credentials: 'include',
});
const data = await response.json();
```

---

### 3. Get Chat by ID

**GET** `/api/chat?id={chatId}`

Get a specific chat conversation.

**Query Parameters:**
- `id`: Chat ID

**Response:**
```typescript
{
  id: string;
  title: string;
  createdAt: string;
  userId: string;
  visibility: 'private' | 'public';
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    parts: Array<{
      type: 'text';
      text: string;
    }>;
    createdAt: string;
  }>;
}
```

---

### 4. Delete Chat

**DELETE** `/api/chat?id={chatId}`

Delete a specific chat.

**Query Parameters:**
- `id`: Chat ID

**Response:**
```typescript
{
  id: string;
  deleted: boolean;
}
```

---

### 5. File Upload

**POST** `/api/files/upload`

Upload images for chat context.

**Request:**
- Content-Type: `multipart/form-data`
- Body: FormData with `file` field

**File Requirements:**
- Max size: 5MB
- Allowed types: image/jpeg, image/png

**Response:**
```typescript
{
  url: string;  // URL to uploaded file
}
```

**Example:**
```typescript
const formData = new FormData();
formData.append('file', fileBlob);

const response = await fetch('http://localhost:3000/api/files/upload', {
  method: 'POST',
  credentials: 'include',
  body: formData,
});
const { url } = await response.json();
```

---

### 6. Suggestions

**GET** `/api/suggestions?documentId={id}`

Get AI suggestions for a document.

**Query Parameters:**
- `documentId`: Document ID

**Response:**
```typescript
{
  suggestions: Array<{
    id: string;
    originalText: string;
    suggestedText: string;
    description: string;
    isResolved: boolean;
  }>;
}
```

---

### 7. Vote on Message

**PATCH** `/api/vote`

Upvote or downvote an AI message.

**Request Body:**
```typescript
{
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}
```

**Response:**
```typescript
{
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}
```

---

## Using with @ai-sdk/react

The easiest way to use these APIs is with the Vercel AI SDK:

```typescript
import { useChat } from '@ai-sdk/react';

function ChatComponent() {
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: 'http://localhost:3000/api/chat',
    credentials: 'include',
  });

  return (
    // Your UI
  );
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200`: Success
- `400`: Bad request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not found
- `500`: Server error

Error Response Format:
```typescript
{
  error: string;  // Error message
  code?: string;  // Error code (optional)
}
```

## Rate Limiting

- Free users: 10 messages per day
- Guest users: 5 messages per day

Rate limit response:
```typescript
{
  error: "rate_limit:chat",
  message: "Daily message limit exceeded"
}
```

## Available Models

- `chat-model-basic`: Standard GPT-4
- `chat-model-reasoning`: Deep reasoning mode
- More models available in `/lib/ai/models.ts`

