# MySQL Entity-Relationship Diagram

This diagram visualizes the relational schema and associations for the primary MySQL database.

```mermaid
erDiagram
    User {
        UUID id PK
        STRING username "Unique, length 2-50"
        STRING email "Unique"
        STRING password
        STRING pfp "Default: default.jpg"
        DATETIME createdAt
        DATETIME updatedAt
    }

    Request {
        UUID id PK
        UUID user_id FK
        STRING item
        STRING size "Nullable"
        STRING pickup_location
        STRING dropoff_location
        ENUM status "open, accepted, completed"
        UUID helperId FK "Nullable"
        STRING paymentUrl "Nullable"
        ENUM deliveryStatus "pending, received"
        DOUBLE dropoff_lat "Nullable"
        DOUBLE dropoff_lng "Nullable"
        DOUBLE pickup_lat "Nullable"
        DOUBLE pickup_lng "Nullable"
        BOOLEAN isArchived "Default: false"
        DATETIME createdAt
        DATETIME updatedAt
        DATETIME deletedAt "Paranoid Mode Archive"
    }

    Message {
        UUID id PK
        UUID request_id FK
        UUID sender_id FK
        TEXT content
        DATETIME timestamp "Default: NOW"
        BOOLEAN is_helper "Default: false"
        DATETIME createdAt
        DATETIME updatedAt
        DATETIME deletedAt "Paranoid Mode Archive"
    }

    User ||--o{ Request : "creates (user_id)"
    User ||--o{ Request : "accepts (helperId)"
    User ||--o{ Message : "sends (sender_id)"
    Request ||--o{ Message : "contains (request_id)"
```
