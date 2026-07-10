# Real-time WebSocket Chat Architecture

This diagram visualizes how the application handles instant, real-time messaging using a hybrid approach: HTTP POST requests for sending messages (to support file uploads) and Socket.io global broadcasts for real-time delivery.

```mermaid
sequenceDiagram
    participant UserA as 📱 User A (Frontend)
    participant API as 🟢 Node.js Socket.io Server
    participant MySQL as 🐬 MySQL DB
    participant UserB as 📱 User B (Frontend)

    Note over UserA,UserB: 1. Connection Initialization
    UserA->>API: HTTP GET /socket.io (Handshake)
    API-->>UserA: 101 Switching Protocols (Upgrade to WSS)
    UserB->>API: HTTP GET /socket.io (Handshake)
    API-->>UserB: 101 Switching Protocols (Upgrade to WSS)
    
    Note over UserA,UserB: 2. Joining Chat Session
    UserA->>API: emit("join_chat", "123")
    UserB->>API: emit("join_chat", "123")
    API-->>API: socket.join("123")

    Note over UserA,UserB: 3. Hybrid Message Delivery (HTTP Send -> WSS Receive)
    UserA->>API: HTTP POST /api/messages/123<br/>(content: "I'm outside!", attachment: file)
    
    API->>MySQL: INSERT INTO messages (content, attachment, sender_id, request_id)
    MySQL-->>API: Row Created
    
    API->>UserB: io.emit("message:sent", message_data)<br/>(Global Broadcast)
    UserB-->>UserB: React filters by requestId and Updates UI
    
    API-->>UserA: HTTP 201 Created (Message Sent & Saved)
```
