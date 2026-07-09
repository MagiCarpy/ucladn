# Real-time WebSocket Chat Architecture

This diagram visualizes how the application handles instant, real-time messaging using Socket.io, replacing the old, inefficient HTTP short-polling mechanism.

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
    
    Note over UserA,UserB: 2. Joining Isolated Chat Rooms
    UserA->>API: emit("join_room", { requestId: "123" })
    UserB->>API: emit("join_room", { requestId: "123" })

    Note over UserA,UserB: 3. Real-time Message Delivery (Zero Polling)
    UserA->>API: emit("send_message", { content: "I'm outside!" })
    
    API->>MySQL: INSERT INTO Messages (content, sender_id, request_id)
    MySQL-->>API: Row Created
    
    API->>UserB: broadcast.to("123").emit("receive_message", { content: "I'm outside!" })
    UserB-->>UserB: React State Updates UI Instantly
    
    API-->>UserA: Acknowledgment Callback (Message Sent & Saved)
```
