# Impelemenation Plan for the user

## 1. Finding and displaying users for friend requests

- **User Discovery**: Use an in-memory store (e.g., a Map or plain object) to track online users, mapping `userId` to their `socket.id`. This allows for quick lookups when a user searches for another user.
- **Search Interface**: In the "Friends & Requests" modal, implement a search bar. As the user types, filter the online users list to show potential matches based on username or userId.
- **User Not Found**: If a user is not found in the online list, display a "User not found" message. Avoid showing offline users in search results to prevent confusion.
- **Authentication Flow**:
  - **Signup**: On successful signup, generate and return `accessToken`, `refreshToken`, and `userId`. Store these securely (e.g., `localStorage` or secure cookies).
  - **Login**: Validate credentials against the stored user data. If valid, return tokens. If the user does not exist, return an error and redirect to the signup page.

## 2. Custom Room Creation and Messaging

- **Room Management**:
  - **Create Room**: When a user clicks "Create Room", generate a unique `roomId`. Store the room details (e.g., `roomId`, `ownerId`, `members`) in memory.
  - **Join Room**: Allow users to join a room by providing the `roomId`. Use `socket.join(roomId)` to add the user to the room's socket group.
  - **Exit Room**: Provide an "Exit Room" button that calls `socket.leave(roomId)` to remove the user from the room.
- **Server-Side Messaging**:
  - **Verification**: When a client emits a chat message, the server should first verify that the user is a member of the specified room.
  - **Broadcast**: If the user is a member, broadcast the message to all sockets in the room using `io.to(roomId).emit('roomMessage', data)`.
- **Client-Side Display**:
  - **Receive Message**: Listen for the `roomMessage` event.
  - **Append Message**: Append the received message to the chat interface for the corresponding room.
- **Troubleshooting**:
  - **Check Reception**: Use server-side logs (`console.log`) to verify if the server is receiving the message. If logs show the message but it's not appearing on the client, check the client's event listener and rendering logic.

## 3. Display Username and Profile Picture

Display username instead of id and also create a profile picture of random colors for each user on the basis of name. Also just show the online users in the friend list.
