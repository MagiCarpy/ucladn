# Chat Implementation Notes

Overview
The chat feature allows communication between a requester and a helper for a specific request. 
It is implemented using a polling mechanism (every 3 seconds) to fetch new messages.
I don't know if the polling mechanism is the best way to do this, but it works for now.
There were alot of error and bug with the chat feature, but it works now.\

Past bugs:
-the routing for the chat feature was not working
-the chat were not updating even after 3 seconds
-the name of the user was not shown
-the user interface didn't show up
-I asked chagpt to create a testfile to find some of the above issues

Design flaw right now:
The message site is showing the message id in the URLS, I need to remove that to increase user security.

Backend changes:
- **Model**: `Message` (id, requestId, senderId, content, createdAt)
- **Controller**: `messageController.js`
  - `sendMessage`: Validates input, checks authorization (must be requester or helper), and saves the message.
  - `getMessages`: Retrieves all messages for a request, ordered by time.
- **Routes**: `/api/messages/:requestId` (GET and POST). Protected by `requireAuth`.

Frontend changes:
- **Component**: `Chat.jsx`
  - Handles message display and sending.
  - Uses `setInterval` for polling.
  - Auto-scrolls to the bottom on new messages.
- **Page**: `RequestDetails.jsx`
  - Displays request information.
  - Embeds the `Chat` component if the current user is a participant.
- **Navigation**: Added "Chat / Details" button in `RequestsList.jsx` and a route in `App.jsx`.

sendMessage(req, res): Save new message. Check that user is either requester or helper.
getMessages(req, res): Fetch messages for a request.
POST /:requestId -> sendMessage
GET /:requestId -> getMessages

Database changes:
- New table `Messages` created via Sequelize model.

//I asked ChatGPT to help me write this test file
//Prompt:
/*
I'm now investigating the broken redirect in RequestsList.jsx. 
I previously replaced window.location.href with navigate(). 
Behavior: The user's feedback, "when I click on it now it doesn't redirect," suggests a potential issue with the navigate() implementation.

Task:Create a test file for RequestsList.jsx that tests the redirect functionality.
*/