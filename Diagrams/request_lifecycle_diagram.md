# Request Lifecycle Diagram

This diagram maps out the complete flow of a Delivery Request, covering the standard path (Open -> Accepted -> Completed), as well as edge cases like manual deletion, cancellation, and disputed drop-offs ("Not Received").

```mermaid
stateDiagram-v2
    direction TB

    [*] --> Status_Open : User Creates Request

    note right of Status_Open
      db.status = "open"
      db.helperId = null
    end note

    Status_Open --> Status_Accepted : Helper clicks "Accept"
    Status_Open --> Deleted : Requester clicks "Delete"

    state "Active Delivery Phase" as Status_Accepted {
        [*] --> Delivery_In_Progress

        Delivery_In_Progress --> Photo_Verification : Helper drops off food & uploads photo
    }

    note left of Status_Accepted
      db.status = "accepted"
      db.helperId = UUID assigned
    end note

    %% Dispute and Cancellation Logic
    Status_Accepted --> Status_Open : Requester clicks "Not Received"\n(Drops Helper & Reopens)
    Status_Accepted --> Status_Open : Helper clicks "Cancel Delivery"\n(Drops Helper & Reopens)

    %% Success Logic
    Status_Accepted --> Status_Completed : Requester confirms "Received"

    note right of Status_Completed
      db.status = "completed"
      db.receiverConfirmed = "received"
    end note

    Status_Completed --> Paranoid_Archive : Immediately triggers .destroy()
    Deleted --> Paranoid_Archive : Immediately triggers .destroy()

    state "Paranoid Mode Soft Deletion" as Paranoid_Archive {
        [*] --> Soft_Delete_Messages
        Soft_Delete_Messages --> Soft_Delete_Request

        note right of Soft_Delete_Request
          db.deletedAt = Current Timestamp
          (Hidden from active map queries, kept for history)
        end note
    }

    Paranoid_Archive --> [*] : Transaction Finished
```
