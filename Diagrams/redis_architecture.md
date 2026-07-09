# Redis Session Management Architecture

This diagram visualizes how Redis is utilized as an extremely fast, in-memory cache to handle JWT Refresh Token sessions without overloading the primary MySQL database.

```mermaid
sequenceDiagram
    participant User as 🌍 Client Browser
    participant API as 🟢 Node.js API (Backend)
    participant Redis as ⚡ Redis Cache (In-Memory)
    participant MySQL as 🐬 MySQL DB (Disk)

    Note over User,MySQL: Authentication & Session Caching Flow
    
    User->>API: POST /api/users/login (Credentials)
    API->>MySQL: Validate Username & Password
    MySQL-->>API: Returns User Data
    
    API->>API: Generate JWT Access & Refresh Tokens
    API->>Redis: SET session:{user_id} = refresh_token (Expires in 7 days)
    Redis-->>API: OK
    
    API-->>User: Returns Access Token & Refresh Token (HTTP Only Cookie)
    
    Note over User,MySQL: Token Refresh Flow (Zero MySQL Queries!)
    User->>API: POST /api/users/refresh (Cookie: Refresh Token)
    API->>Redis: GET session:{user_id}
    Redis-->>API: Returns Stored Refresh Token
    
    alt Tokens Match
        API->>API: Generate New Access Token
        API-->>User: Returns New Access Token
    else Token Missing or Mismatch
        API-->>User: 401 Unauthorized (Force Re-Login)
    end
    
    Note over User,MySQL: Logout Flow
    User->>API: POST /api/users/logout
    API->>Redis: DEL session:{user_id}
    Redis-->>API: Token Deleted from RAM
    API-->>User: 200 OK (Cleared Cookies)
```
