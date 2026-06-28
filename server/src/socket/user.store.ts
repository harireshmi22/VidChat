export interface User {
  userId: string;
  email: string;
  password?: string;
  name: string;
  avatarColor: string;
}

export interface RoomDetails {
  roomId: string;
  ownerId: string;
  members: Set<string>;
}

// In-memory databases
export const registeredUsers = new Map<string, User>();
export const customRoomsStore = new Map<string, RoomDetails>();

// Seed initial users for testing compatibility
const seedUsers: User[] = [
  {
    userId: "HariReshmi",
    email: "HariReshmi@example.com",
    password: "password123",
    name: "Hari Reshmi",
    avatarColor: "#3b82f6"
  },
  {
    userId: "userB",
    email: "userB@example.com",
    password: "password123",
    name: "User B",
    avatarColor: "#10b981"
  },
  {
    userId: "userC",
    email: "userC@example.com",
    password: "password123",
    name: "User C",
    avatarColor: "#f59e0b"
  }
];

seedUsers.forEach(u => registeredUsers.set(u.userId, u));
