# Request & Chat State Lifecycle

This diagram maps out the complete lifecycle of a Delivery Request and how it affects the state of the Chat functionality, from its initial creation as an "Open" order to the final Archival process where the chat is permanently locked and soft-deleted.

```mermaid
stateDiagram-v2
    direction TB

    [*] --> Status_Open : User Creates Request

    note right of Status_Open
      db.status = "open"
      db.helperId = null
      Chat is Disabled (Locked)
    end note

    Status_Open --> Status_Accepted : Helper clicks "Accept"

    state "Active Delivery & Chat Phase" as Status_Accepted {
        [*] --> Chat_Active

        note right of Chat_Active
            Real-time WSS Messaging
            and location sharing are enabled
            for Requester & Helper
        end note

        Chat_Active --> Delivery_Pending : Helper picks up food
    }

    note left of Status_Accepted
      db.status = "accepted"
      db.helperId = UUID assigned
    end note

    Status_Accepted --> Status_Completed : Requester confirms "Received"

    note right of Status_Completed
      db.status = "completed"
      db.deliveryStatus = "received"
      Chat is Locked (Read-Only)
    end note

    Status_Completed --> Paranoid_Archive : Immediately triggers .destroy()

    state "Paranoid Mode Database Archival" as Paranoid_Archive {
        [*] --> Soft_Delete_Messages
        Soft_Delete_Messages --> Soft_Delete_Request
        
        note right of Soft_Delete_Request
          db.deletedAt = Current Timestamp
          Messages are hidden but kept for audits
        end note
    }

    Paranoid_Archive --> [*] : Transaction Finished
```
