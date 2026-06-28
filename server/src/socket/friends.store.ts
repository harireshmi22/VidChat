/*
 * Friends & DM In-Memory Store
 */

interface FriendRequest {
  from: string;
  to: string;
  status: "pending" | "accepted";
}

interface Friendship {
  user1: string;
  user2: string;
}

interface DirectMessage {
  from: string;
  to: string;
  text: string;
  time: string;
}

const friendRequests: FriendRequest[] = [];
const friendships: Friendship[] = [];
const directMessages: DirectMessage[] = [];

// Send friend request
export function sendFriendRequest(from: string, to: string): boolean {
  // Check if they are already friends
  if (areFriends(from, to)) return false;

  // Check if request already exists
  const exists = friendRequests.some(
    (req) => (req.from === from && req.to === to) || (req.from === to && req.to === from)
  );
  if (exists) return false;

  friendRequests.push({ from, to, status: "pending" });
  console.log(`✉️ Friend request sent from ${from} to ${to}`);
  return true;
}

// Accept friend request
export function acceptFriendRequest(from: string, to: string): boolean {
  const reqIndex = friendRequests.findIndex(
    (req) => req.from === from && req.to === to && req.status === "pending"
  );
  if (reqIndex === -1) return false;

  // Mark request as accepted
  friendRequests[reqIndex].status = "accepted";

  // Add friendship
  friendships.push({ user1: from, user2: to });
  console.log(`🤝 Friendship accepted between ${from} and ${to}`);
  return true;
}

// Decline/Cancel friend request
export function declineFriendRequest(from: string, to: string): boolean {
  const reqIndex = friendRequests.findIndex(
    (req) =>
      ((req.from === from && req.to === to) || (req.from === to && req.to === from)) &&
      req.status === "pending"
  );
  if (reqIndex === -1) return false;

  friendRequests.splice(reqIndex, 1);
  console.log(`❌ Friend request from ${from} to ${to} declined`);
  return true;
}

// Check if they are already friends
export function areFriends(user1: string, user2: string): boolean {
  return friendships.some(
    (f) =>
      (f.user1 === user1 && f.user2 === user2) || (f.user1 === user2 && f.user2 === user1)
  );
}

// Get friend list for a user
export function getFriends(userId: string): string[] {
  const list: string[] = [];
  friendships.forEach((f) => {
    if (f.user1 === userId) list.push(f.user2);
    else if (f.user2 === userId) list.push(f.user1);
  });
  return list;
}

// Get pending incoming requests
export function getPendingIncomingRequests(userId: string): string[] {
  return friendRequests
    .filter((req) => req.to === userId && req.status === "pending")
    .map((req) => req.from);
}

// Get pending outgoing requests
export function getPendingOutgoingRequests(userId: string): string[] {
  return friendRequests
    .filter((req) => req.from === userId && req.status === "pending")
    .map((req) => req.to);
}

// Store a Direct Message
export function addDirectMessage(from: string, to: string, text: string): DirectMessage {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const msg: DirectMessage = { from, to, text, time };
  directMessages.push(msg);
  return msg;
}

// Get message history between two users
export function getDirectMessages(user1: string, user2: string): DirectMessage[] {
  return directMessages.filter(
    (msg) =>
      (msg.from === user1 && msg.to === user2) || (msg.from === user2 && msg.to === user1)
  );
}
