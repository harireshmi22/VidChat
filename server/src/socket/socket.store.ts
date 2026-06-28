/*

* Socket store 

* _____________________________

* userId -> socket.id
* Example: 
* 101 -> aBcd12345

*/


const socketMap = new Map<string, string>();

// Add or Update User
export function addUser(userId: string, socketId: string) {
    socketMap.set(userId, socketId);
}


// Get Socket Id 
export function getSocketId(userId: string) {
    console.log(`🔍 [getSocketId] Looking for userId: ${userId}`);
    const socketId = socketMap.get(userId);
    console.log(`🔍 [getSocketId] Found socketId: ${socketId}`);
    return socketId
}


// Remove user 
export function removeUser(userId: string) {
    socketMap.delete(userId);
    console.log(`🔌 User ${userId} disconnected`);
}

// Check Online Status 
export function isUserOnline(userId: string) { return socketMap.has(userId); }


// Get All Online Users (optional)
export function getOnlineUsers() { return Array.from(socketMap.keys()); }

// Export map if needed for debugging 
export { socketMap };