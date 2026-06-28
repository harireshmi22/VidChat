"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hash, Volume2, Plus, LogOut, Video, MessageSquare, Settings, X, HelpCircle, Check, Users, UserPlus, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";

interface WorkspaceSidebarProps {
  activeChannel: string;
  activeType: "chat" | "video";
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function WorkspaceSidebar({ activeChannel, activeType, mobileOpen = false, onClose }: WorkspaceSidebarProps) {
  const router = useRouter();
  const [customRooms, setCustomRooms] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [avatarColor, setAvatarColor] = useState<string>("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsColor, setSettingsColor] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<{ userId: string; name: string; avatarColor: string; isOnline: boolean }[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<{ userId: string; name: string; avatarColor: string }[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<{ userId: string; name: string; avatarColor: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; name: string; avatarColor: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendUsernameInput, setFriendUsernameInput] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  // Load settings values when username/avatarColor changes
  useEffect(() => {
    setSettingsName(username);
    setSettingsColor(avatarColor);
  }, [username, avatarColor]);

  // Synchronize profiles and rooms across tabs
  useEffect(() => {
    const handleStorageUpdate = () => {
      const storedUsername = localStorage.getItem("auracall_username");
      const storedColor = localStorage.getItem("auracall_avatarColor");
      if (storedUsername) setUsername(storedUsername);
      if (storedColor) setAvatarColor(storedColor);

      try {
        const stored = localStorage.getItem("auracall_custom_rooms");
        if (stored) {
          setCustomRooms(JSON.parse(stored));
        }
      } catch (e) {}
    };

    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUserId = localStorage.getItem("auracall_userId");
    if (!storedUserId) {
      router.push("/login");
      return;
    }
    setUserId(storedUserId);
    
    const storedUsername = localStorage.getItem("auracall_username");
    const storedColor = localStorage.getItem("auracall_avatarColor");
    setUsername(storedUsername || storedUserId);
    setAvatarColor(storedColor || "#3b82f6");

    const socket = getSocket(storedUserId);

    // Request initial data
    socket.emit("getFriendsData");
    socket.emit("getOnlineUsers");

    // Listen for updates
    socket.on("friendsDataUpdated", (data: {
      friends: { userId: string; name: string; avatarColor: string; isOnline: boolean }[];
      pendingIncoming: { userId: string; name: string; avatarColor: string }[];
      pendingOutgoing: { userId: string; name: string; avatarColor: string }[];
    }) => {
      setFriends(data.friends);
      setPendingIncoming(data.pendingIncoming);
      setPendingOutgoing(data.pendingOutgoing);
    });

    socket.on("onlineUsersList", (users: { userId: string; name: string; avatarColor: string }[]) => {
      setOnlineUsers(users);
    });

    socket.on("onlineUsersUpdated", (users: { userId: string; name: string; avatarColor: string }[]) => {
      setOnlineUsers(users);
    });

    socket.on("roomCreated", ({ roomId }) => {
      setCustomRooms(prev => {
        if (!prev.includes(roomId)) {
          const updated = [...prev, roomId];
          localStorage.setItem("auracall_custom_rooms", JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
      router.push(`/chat?room=${roomId}`);
    });

    return () => {
      socket.off("friendsDataUpdated");
      socket.off("onlineUsersList");
      socket.off("onlineUsersUpdated");
      socket.off("roomCreated");
    };
  }, [router]);

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    setRequestSuccess("");
    const target = friendUsernameInput.trim();
    if (!target) return;
    if (target === userId) {
      setRequestError("You cannot send a friend request to yourself.");
      return;
    }

    const socket = getSocket();
    socket.emit("sendFriendRequest", { toUserId: target });
    setRequestSuccess(`Friend request sent to ${target}!`);
    setFriendUsernameInput("");
  };

  const handleAcceptRequest = (fromUserId: string) => {
    getSocket().emit("acceptFriendRequest", { fromUserId });
  };

  const handleDeclineRequest = (fromUserId: string) => {
    getSocket().emit("declineFriendRequest", { fromUserId });
  };

  const handleSendSearchRequest = (targetUserId: string) => {
    setRequestError("");
    setRequestSuccess("");
    if (targetUserId === userId) {
      setRequestError("You cannot send a friend request to yourself.");
      return;
    }
    getSocket().emit("sendFriendRequest", { toUserId: targetUserId });
    setRequestSuccess(`Friend request sent to ${targetUserId}!`);
    setTimeout(() => setRequestSuccess(""), 3000);
  };

  // Load custom rooms from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auracall_custom_rooms");
      if (stored) {
        setCustomRooms(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load custom rooms:", e);
    }
  }, []);

  // Sync the current room to localStorage list if it is a new custom room
  useEffect(() => {
    if (
      activeChannel &&
      activeChannel !== "LOBBY-ROOM" &&
      activeChannel !== "general" &&
      activeChannel !== "random" &&
      activeChannel !== "voice-lobby" &&
      activeChannel !== "dev-channel" &&
      !customRooms.includes(activeChannel)
    ) {
      const updated = [...customRooms, activeChannel];
      setCustomRooms(updated);
      localStorage.setItem("auracall_custom_rooms", JSON.stringify(updated));
    }
  }, [activeChannel, customRooms]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = newRoomName.trim().toUpperCase();
    if (!formattedName) return;

    if (!customRooms.includes(formattedName)) {
      const updated = [...customRooms, formattedName];
      setCustomRooms(updated);
      localStorage.setItem("auracall_custom_rooms", JSON.stringify(updated));
    }

    setNewRoomName("");
    setIsCreating(false);

    router.push(`/chat?room=${formattedName}`);
    if (onClose) onClose();
  };

  const handleServerCreateRoom = () => {
    if (selectedFriends.length > 0) {
      getSocket().emit("create_group_chat", { invitedUserIds: selectedFriends });
    } else {
      getSocket().emit("create_room");
    }
    setSelectedFriends([]);
    setIsCreating(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = settingsName.trim();
    if (!trimmedName) return;

    try {
      const response = await fetch("http://localhost:3001/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: trimmedName,
          avatarColor: settingsColor
        })
      });

      if (response.ok) {
        localStorage.setItem("auracall_username", trimmedName);
        localStorage.setItem("auracall_avatarColor", settingsColor);
        setUsername(trimmedName);
        setAvatarColor(settingsColor);

        // Emit profile update socket event
        getSocket().emit("updateProfile");
        setShowSettingsModal(false);
      }
    } catch (err) {
      console.error("Failed to update profile details:", err);
    }
  };

  const handleRemoveRoom = (roomName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = customRooms.filter((r) => r !== roomName);
    setCustomRooms(updated);
    localStorage.setItem("auracall_custom_rooms", JSON.stringify(updated));

    // If we are deleting the currently active channel, redirect to general
    if (activeChannel === roomName) {
      router.push("/chat?room=general");
    }
  };

  const textChannels = [
    { name: "general", label: "general" },
    { name: "random", label: "random" }
  ];

  const videoChannels = [
    { name: "voice-lobby", label: "Main Voice Lobby" },
    { name: "dev-channel", label: "Coding & Dev Room" }
  ];

  const renderAvatar = (name: string, color: string, isOnline?: boolean) => {
    const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U";
    return (
      <div 
        className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white relative shrink-0 uppercase shadow-sm"
        style={{ backgroundColor: color || "#3b82f6" }}
      >
        {initials}
        {isOnline !== undefined && (
          <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${isOnline ? "bg-emerald-500" : "bg-zinc-500"}`} />
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-zinc-300 w-64 border-r border-slate-800 shrink-0">
      {/* Workspace Branding Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-white shadow-sm">
            <Video className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
            AuraCall Deck
          </span>
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-zinc-400 hover:text-white hover:bg-slate-800 h-8 w-8 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation channels list */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 scrollbar-thin">

        {/* Section 1: Global Text Channels */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Text Channels</span>
          </div>
          {textChannels.map((ch) => {
            const isActive = activeType === "chat" && activeChannel === ch.name;
            return (
              <Link
                key={ch.name}
                href={`/chat?room=${ch.name}`}
                onClick={onClose}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${isActive
                  ? "bg-slate-800 text-white"
                  : "hover:bg-slate-800/40 text-zinc-400 hover:text-zinc-200"
                  }`}
              >
                <Hash className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                <span>{ch.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Section 2: Global Video Call Channels */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Voice & Video</span>
          </div>
          {videoChannels.map((ch) => {
            const isActive = activeType === "video" && activeChannel === ch.name;
            return (
              <Link
                key={ch.name}
                href={`/video?room=${ch.name}`}
                onClick={onClose}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${isActive
                  ? "bg-slate-800 text-white"
                  : "hover:bg-slate-800/40 text-zinc-400 hover:text-zinc-200"
                  }`}
              >
                <Volume2 className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                <span>{ch.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Section 2.5: Direct Messages */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Direct Messages</span>
            <button
              onClick={() => setShowFriendsModal(true)}
              className="p-1 rounded hover:bg-slate-800 text-zinc-400 hover:text-white"
              title="Add Friend & Requests"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Friends Navigation Item */}
          <button
            onClick={() => setShowFriendsModal(true)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-slate-800/40 text-zinc-400 hover:text-zinc-200 mb-1`}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-500" />
              <span>Friends & Requests</span>
            </span>
            {pendingIncoming.length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingIncoming.length}
              </span>
            )}
          </button>

          {/* DM Friend List */}
          {friends.filter(f => f.isOnline).length === 0 ? (
            <div className="px-2.5 py-2 text-[10px] text-zinc-500 italic">
              No online friends.
            </div>
          ) : (
            friends.filter(f => f.isOnline).map((friend) => {
              const isDMActive = activeType === "chat" && activeChannel === `@${friend.userId}`;
              return (
                <Link
                  key={friend.userId}
                  href={`/chat?room=@${friend.userId}`}
                  onClick={onClose}
                  className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-semibold transition-all group ${isDMActive
                      ? "bg-slate-800 text-white"
                      : "hover:bg-slate-800/40 text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <div 
                      className="h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 uppercase"
                      style={{ backgroundColor: friend.avatarColor || "#60a5fa" }}
                    >
                      {(friend.name || friend.userId).slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{friend.name || friend.userId}</span>
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                </Link>
              );
            })
          )}
        </div>

        {/* Section 3: Private / Custom Rooms */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Custom Rooms</span>
            <Button
              onClick={() => setIsCreating(!isCreating)}
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded hover:bg-slate-800 text-zinc-400 hover:text-white"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Inline input form to add/join or create new channels */}
          {isCreating && (
            <div className="space-y-2 p-1.5 mb-2 rounded bg-slate-950 border border-slate-800">
              <form onSubmit={handleJoinRoom} className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Enter Code to Join..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-[11px] px-2 py-1 rounded w-full outline-none focus:border-blue-500 uppercase tracking-wide"
                  autoFocus
                />
                <Button type="submit" size="icon" className="h-6 w-6 shrink-0 bg-blue-600 hover:bg-blue-500 text-white rounded">
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </form>

              {/* Online Friends Invite Checklist */}
              {friends.filter(f => f.isOnline).length > 0 && (
                <div className="space-y-1 mt-1.5 border-t border-slate-900 pt-1.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Invite Friends</span>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {friends.filter(f => f.isOnline).map(f => (
                      <label key={f.userId} className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-250 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(f.userId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFriends(prev => [...prev, f.userId]);
                            } else {
                              setSelectedFriends(prev => prev.filter(id => id !== f.userId));
                            }
                          }}
                          className="rounded border-slate-850 text-blue-650 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                        />
                        <span className="truncate">{f.name || f.userId}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleServerCreateRoom}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-[10px] py-1 rounded h-6 font-semibold"
              >
                {selectedFriends.length > 0 ? `Create Group (${selectedFriends.length})` : "Create Random Room ID"}
              </Button>
            </div>
          )}

          {customRooms.length === 0 ? (
            <div className="px-2.5 py-2 text-[10px] text-zinc-500 italic">
              No custom rooms. Click + to add.
            </div>
          ) : (
            customRooms.map((roomName) => {
              const isChatActive = activeType === "chat" && activeChannel === roomName;
              const isVideoActive = activeType === "video" && activeChannel === roomName;
              return (
                <div key={roomName} className="space-y-0.5">
                  {/* Custom Chat Channel */}
                  <Link
                    href={`/chat?room=${roomName}`}
                    onClick={onClose}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${isChatActive
                      ? "bg-slate-800 text-white"
                      : "hover:bg-slate-800/40 text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <Hash className={`h-4 w-4 ${isChatActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                      <span className="uppercase tracking-wide">{roomName}</span>
                    </span>
                    <button
                      onClick={(e) => handleRemoveRoom(roomName, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-zinc-500 p-0.5 rounded transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Link>

                  {/* Custom Video Channel */}
                  <Link
                    href={`/video?room=${roomName}`}
                    onClick={onClose}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${isVideoActive
                      ? "bg-slate-800 text-white"
                      : "hover:bg-slate-800/40 text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    <span className="flex items-center gap-2 pl-2">
                      <Volume2 className={`h-3.5 w-3.5 ${isVideoActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                      <span className="uppercase text-[11px] tracking-wide text-zinc-400 group-hover:text-zinc-300">Voice Link</span>
                    </span>
                  </Link>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* User profile dock */}
      <div className="h-14 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-3">
        <div className="flex items-center gap-2 min-w-0">
          {renderAvatar(username, avatarColor, true)}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white leading-tight truncate">{username || userId || "Active User"}</span>
            <span className="text-[10px] text-zinc-500">ID: {userId}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-slate-850 transition-colors"
            title="Profile Settings"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("auracall_userId");
              router.push("/login");
            }}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-slate-850 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative flex flex-col h-full w-64 animate-slideInRight shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Friends & Requests Overlay Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fadeIn text-zinc-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-bold text-white">Friends & Relationship Manager</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowFriendsModal(false);
                  setRequestError("");
                  setRequestSuccess("");
                }}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-slate-800 rounded-lg border-0 animate-none"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Online User Discovery & Request Form */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Search Online Users</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search active users by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-lg w-full outline-none focus:border-blue-500"
                  />
                </div>
                {requestError && <p className="text-[11px] text-red-400 font-semibold">{requestError}</p>}
                {requestSuccess && <p className="text-[11px] text-emerald-400 font-semibold">{requestSuccess}</p>}

                {/* Filter and display online matching users */}
                {searchQuery.trim() && (
                  <div className="space-y-2 mt-3 bg-slate-950/45 p-3 rounded-lg border border-slate-800">
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Online Matches</h5>
                    {(() => {
                      const filtered = onlineUsers.filter(
                        (u) =>
                          u.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.name.toLowerCase().includes(searchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return <p className="text-xs text-zinc-500 italic">User not found</p>;
                      }

                      return (
                        <div className="space-y-1.5">
                          {filtered.map((user) => (
                            <div
                              key={user.userId}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 uppercase"
                                  style={{ backgroundColor: user.avatarColor }}
                                >
                                  {user.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-white leading-tight truncate">{user.name}</span>
                                  <span className="text-[10px] text-zinc-500">ID: {user.userId}</span>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleSendSearchRequest(user.userId)}
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold px-2.5 h-7"
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Pending Requests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Incoming Requests */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <span>Incoming Requests</span>
                    {pendingIncoming.length > 0 && (
                      <span className="bg-blue-600/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {pendingIncoming.length}
                      </span>
                    )}
                  </h4>
                  {pendingIncoming.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No incoming requests.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {pendingIncoming.map((reqUser) => (
                        <div key={reqUser.userId} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850">
                          <div className="flex items-center gap-2 min-w-0">
                            <div 
                              className="h-6 w-6 rounded-full flex items-center justify-center font-bold text-[9px] text-white shrink-0 uppercase"
                              style={{ backgroundColor: reqUser.avatarColor || "#60a5fa" }}
                            >
                              {reqUser.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-white truncate max-w-[100px]">{reqUser.name}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => handleAcceptRequest(reqUser.userId)}
                              className="p-1 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors"
                              title="Accept Friend Request"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(reqUser.userId)}
                              className="p-1 rounded hover:bg-slate-800 text-red-400 hover:text-red-300 transition-colors"
                              title="Decline Request"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outgoing Requests */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Sent Requests</h4>
                  {pendingOutgoing.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No sent requests pending.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {pendingOutgoing.map((reqUser) => (
                        <div key={reqUser.userId} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-850">
                          <div className="flex items-center gap-2 min-w-0">
                            <div 
                              className="h-6 w-6 rounded-full flex items-center justify-center font-bold text-[9px] text-white shrink-0 uppercase"
                              style={{ backgroundColor: reqUser.avatarColor || "#60a5fa" }}
                            >
                              {reqUser.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-zinc-400 truncate max-w-[100px]">{reqUser.name}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 shrink-0">
                            Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal Overlay */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-zinc-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-bold text-white">Profile Settings</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettingsModal(false)}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-slate-800 rounded-lg border-0 animate-none"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-550 block font-semibold">User ID (ReadOnly)</label>
                <input
                  type="text"
                  value={userId}
                  disabled
                  className="bg-slate-950 border border-slate-850 text-zinc-500 text-xs px-3 py-2 rounded-lg w-full outline-none select-none cursor-not-allowed font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-semibold">Display Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="bg-slate-950 border border-slate-850 text-white text-xs px-3 py-2 rounded-lg w-full outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-semibold">Avatar Color Preset</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "#3b82f6", // Blue
                    "#10b981", // Emerald
                    "#f59e0b", // Amber
                    "#ef4444", // Red
                    "#8b5cf6", // Violet
                    "#ec4899", // Pink
                    "#14b8a6", // Teal
                    "#6366f1", // Indigo
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSettingsColor(color)}
                      className={`h-8 w-full rounded-lg border-2 transition-all flex items-center justify-center`}
                      style={{ 
                        backgroundColor: color,
                        borderColor: settingsColor === color ? "#ffffff" : "transparent"
                      }}
                    >
                      {settingsColor === color && <Check className="h-4 w-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 h-10 font-semibold text-xs mt-4">
                Save Profile Changes
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
