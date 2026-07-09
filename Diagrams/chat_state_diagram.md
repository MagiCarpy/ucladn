# Request & Chat State Lifecycle

This diagram maps out the complete lifecycle of a Delivery Request, from its initial creation as an "Open" order to the final Archival process where the chat is permanently deleted.

```mermaid
stateDiagram-v2
    direction TB
    
    [*] --> Status_Open : User Creates Request
    
    note right of Status_Open
      db.status = "open"
      db.helperId = null
      Chat is Disabled
    end note

    Status_Open --> Status_Accepted : Helper clicks "Accept"
    
    state "Active Delivery & Chat Phase" as Status_Accepted {
        [*] --> Chat_Active
        
        note right of Chat_Active
            Real-time WSS Messaging
            occurs during this phase
        end note
        
        Chat_Active --> Delivery_Pending : Helper picks up food
    }
    
    note left of Status_Accepted
      db.status = "accepted"
      db.helperId = UUID assigned
      Chat & Location Tracking Enabled
    end note

    Status_Accepted --> Status_Completed : Requester confirms "Received"
    
    note right of Status_Completed
      db.status = "completed"
      db.deliveryStatus = "received"
      Chat is Locked (Read-Only)
    end note
    
    Status_Completed --> Archival : Server Cleanup Process
    
    state "Database Archival" as Archival {
        [*] --> Copy_To_ArchivedRequest
        Copy_To_ArchivedRequest --> Delete_Original_Request
        Delete_Original_Request --> Cascade_Delete_Messages
    }
    
    Archival --> [*] : Transaction Finished
```
