"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Send, Menu, Video, Shield, Phone, PhoneOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";
import { getSocket } from "@/lib/socket";
import { IncomingCallModal } from "@/components/incoming-call-modal";
import { FriendRequestNotification } from "@/components/friend-request-notification";
import { UserProfileModal } from "@/components/user-profile-modal";

const getAvatarColor = (name: string) => {
  if (name === "You") return localStorage.getItem("auracall_avatarColor") || "#3b82f6";
  if (name === "System") return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
};

function ChatRoomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const room = searchParams.get("room") || "general";
  const isDM = room.startsWith("@");
  const targetUserId = isDM ? room.substring(1) : "";
  
  const [messages, setMessages] = useState<{ sender: string; senderId?: string; text: string; time: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [isCalling, setIsCalling] = useState(false);
  const [callingStatus, setCallingStatus] = useState("");
  const [profileUser, setProfileUser] = useState<{ userId: string; name: string; avatarColor: string } | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [userColors, setUserColors] = useState<Record<string, string>>({});
  const [targetName, setTargetName] = useState<string>(targetUserId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUserId = localStorage.getItem("auracall_userId");
    if (!storedUserId) {
      router.push("/login");
      return;
    }
    setUserId(storedUserId);

    const socket = getSocket(storedUserId);

    // Sync lookup lists
    socket.emit("getFriendsData");
    socket.emit("getOnlineUsers");

    socket.on("friendsDataUpdated", (data) => {
      const allUsers = [
        ...data.friends,
        ...data.pendingIncoming,
        ...data.pendingOutgoing
      ];
      setUserNames(prev => {
        const next = { ...prev };
        allUsers.forEach((u: any) => { next[u.userId] = u.name; });
        return next;
      });
      setUserColors(prev => {
        const next = { ...prev };
        allUsers.forEach((u: any) => { next[u.userId] = u.avatarColor; });
        return next;
      });

      if (isDM && targetUserId) {
        const friend = data.friends.find((f: any) => f.userId === targetUserId);
        if (friend) {
          setTargetName(friend.name);
        }
      }
    });

    socket.on("onlineUsersList", (users: any[]) => {
      setUserNames(prev => {
        const next = { ...prev };
        users.forEach((u: any) => { next[u.userId] = u.name; });
        return next;
      });
      setUserColors(prev => {
        const next = { ...prev };
        users.forEach((u: any) => { next[u.userId] = u.avatarColor; });
        return next;
      });
    });

    socket.on("onlineUsersUpdated", (users: any[]) => {
      setUserNames(prev => {
        const next = { ...prev };
        users.forEach((u: any) => { next[u.userId] = u.name; });
        return next;
      });
      setUserColors(prev => {
        const next = { ...prev };
        users.forEach((u: any) => { next[u.userId] = u.avatarColor; });
        return next;
      });
    });

    // Listen for real-time group invites
    socket.on("invitedToGroup", ({ roomId }) => {
      try {
        const stored = localStorage.getItem("auracall_custom_rooms");
        const current = stored ? JSON.parse(stored) : [];
        if (!current.includes(roomId)) {
          const updated = [...current, roomId];
          localStorage.setItem("auracall_custom_rooms", JSON.stringify(updated));
          // Notify other components (like sidebar) to reload custom rooms from storage
          window.dispatchEvent(new Event("storage"));
        }
      } catch (e) {
        console.error(e);
      }
    });

    if (isDM && targetUserId) {
      // Clear messages state first when switching rooms
      setMessages([]);

      // Fetch DM history
      socket.emit("getDirectMessageHistory", { toUserId: targetUserId });

      socket.on("directMessageHistory", ({ toUserId, history }) => {
        if (toUserId === targetUserId) {
          setMessages(
            history.map((m: any) => ({
              sender: m.from === storedUserId ? "You" : m.from,
              senderId: m.from,
              text: m.text,
              time: m.time,
            }))
          );
        }
      });

      socket.on("directMessageReceived", ({ fromUserId, fromName, message }) => {
        if (fromUserId === targetUserId) {
          setMessages((prev) => [
            ...prev,
            {
              sender: fromName || fromUserId,
              senderId: fromUserId,
              text: message.text,
              time: message.time
            },
          ]);
        }
      });

      socket.on("directMessageSent", ({ toUserId, message }) => {
        if (toUserId === targetUserId) {
          setMessages((prev) => [
            ...prev,
            { sender: "You", senderId: storedUserId, text: message.text, time: message.time },
          ]);
        }
      });

      // Call feedback listeners
      socket.on("callAccepted", ({ room: acceptedRoom }) => {
        setIsCalling(false);
        router.push(`/video?room=${acceptedRoom}`);
      });

      socket.on("callDeclined", ({ fromUserId }) => {
        if (fromUserId === targetUserId) {
          setCallingStatus("Call declined by user");
          setTimeout(() => setIsCalling(false), 2000);
        }
      });

      socket.on("callFailed", ({ error }) => {
        setCallingStatus(`Call failed: ${error}`);
        setTimeout(() => setIsCalling(false), 2000);
      });
    } else {
      // Public/Custom channel chat
      setMessages([
        { sender: "System", text: `Welcome to the secure chat room: #${room}`, time: "Now" }
      ]);

      // Join the room
      socket.emit("join_room", room);

      socket.on("roomMessage", ({ roomId, from, fromName, text }) => {
        if (roomId === room) {
          setMessages((prev) => [
            ...prev,
            {
              sender: from === storedUserId ? "You" : fromName,
              senderId: from,
              text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      });
    }

    return () => {
      socket.off("friendsDataUpdated");
      socket.off("onlineUsersList");
      socket.off("onlineUsersUpdated");
      socket.off("invitedToGroup");
      socket.off("directMessageHistory");
      socket.off("directMessageReceived");
      socket.off("directMessageSent");
      socket.off("callAccepted");
      socket.off("callDeclined");
      socket.off("callFailed");
      
      if (!isDM) {
        socket.emit("leave_room", room);
        socket.off("roomMessage");
      }
    };
  }, [room, isDM, targetUserId, router, targetName]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (isDM && targetUserId) {
      const socket = getSocket();
      socket.emit("sendDirectMessage", { toUserId: targetUserId, text: inputValue });
    } else {
      const socket = getSocket();
      socket.emit("roomMessage", { roomId: room, message: inputValue });
    }
    setInputValue("");
  };

  const handleExitCustomRoom = () => {
    const socket = getSocket();
    socket.emit("exit_room", room);

    try {
      const stored = localStorage.getItem("auracall_custom_rooms");
      if (stored) {
        const list = JSON.parse(stored) as string[];
        const filtered = list.filter((r: string) => r !== room);
        localStorage.setItem("auracall_custom_rooms", JSON.stringify(filtered));
      }
    } catch (e) {
      console.error("Failed to clean custom room list:", e);
    }
    router.push("/chat?room=general");
  };

  const handleInitiateCall = () => {
    if (!targetUserId || !userId) return;
    const callRoom = `CALL_${userId}_${targetUserId}`;
    setIsCalling(true);
    setCallingStatus(`Calling ${targetUserId}...`);
    
    const socket = getSocket();
    socket.emit("initiateCall", { toUserId: targetUserId, room: callRoom });
  };

  const handleCancelCall = () => {
    if (!targetUserId) return;
    getSocket().emit("declineCall", { toUserId: targetUserId });
    setIsCalling(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9fa] text-zinc-800 font-sans">
      {/* Workspace Navigation Sidebar */}
      <WorkspaceSidebar 
        activeChannel={room} 
        activeType="chat" 
        mobileOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Chat Panel Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white relative">
        
        {/* Chat Pane Header */}
        <header className="h-14 border-b border-zinc-200/80 px-4 flex items-center justify-between shrink-0 bg-white shadow-sm z-10">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Hamburger menu for mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-zinc-500 hover:text-zinc-800 hover:bg-zinc-150 h-9 w-9 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-zinc-455 font-semibold text-lg font-mono">{isDM ? "@" : "#"}</span>
              <span className="text-sm font-bold text-zinc-900 uppercase tracking-wide truncate">
                {isDM ? (userNames[targetUserId] || targetUserId) : room}
              </span>
            </div>
            
            <div className="h-4 w-[1px] bg-zinc-200 mx-1 hidden sm:block" />
            
            {/* E2EE Info Tag */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
              <Shield className="h-3 w-3" />
              <span>{isDM ? "Private Message Encrypted" : "End-to-End Encrypted"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FriendRequestNotification />
            {!isDM && room !== "general" && room !== "random" && (
              <Button 
                onClick={handleExitCustomRoom}
                variant="outline"
                size="sm" 
                className="border-red-200 text-red-650 hover:bg-red-50 hover:text-red-700 rounded-full px-4 h-9 font-semibold text-xs transition-all mr-1"
              >
                Exit Room
              </Button>
            )}

            {isDM ? (
              <Button 
                onClick={handleInitiateCall} 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 font-semibold text-xs transition-all shadow-sm"
              >
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Call User
              </Button>
            ) : (
              <Link href={`/video?room=${room}`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 font-semibold text-xs transition-all shadow-sm">
                  <Video className="mr-1.5 h-3.5 w-3.5" />
                  Join Call
                </Button>
              </Link>
            )}
            
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-800 h-9 rounded-full px-3 text-xs font-semibold">
                Exit
              </Button>
            </Link>
          </div>
        </header>

        {/* Message Thread Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/15">
          {messages.length === 0 && isDM ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
              <MessageSquare className="h-10 w-10 text-zinc-300 mb-2" />
              <p className="text-sm font-semibold">This is the start of your secure chat history with {targetUserId}.</p>
              <p className="text-xs text-zinc-400/80 mt-1">Send a message to start conversing privately.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isSelf = msg.sender === "You";
              const isSystem = msg.sender === "System";
              const resolvedName = isSelf 
                ? (localStorage.getItem("auracall_username") || "You") 
                : (msg.senderId ? (userNames[msg.senderId] || msg.sender) : msg.sender);
              const color = msg.senderId ? (userColors[msg.senderId] || getAvatarColor(resolvedName)) : getAvatarColor(resolvedName);
              const initials = resolvedName ? resolvedName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "U";

              if (isSystem) {
                return (
                  <div key={index} className="flex justify-center my-2">
                    <div className="bg-slate-100 text-slate-500 text-xs border border-slate-200/60 rounded-full py-1 px-4">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={`flex gap-3 items-start my-3 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 uppercase shadow-sm cursor-pointer hover:opacity-85 transition-opacity"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (!isSelf && !isSystem && msg.senderId) {
                        setProfileUser({
                          userId: msg.senderId,
                          name: resolvedName,
                          avatarColor: color
                        });
                      }
                    }}
                  >
                    {initials}
                  </div>
                  <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"} min-w-0 max-w-[70%]`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-zinc-900 truncate">{resolvedName}</span>
                      <span className="text-[9px] text-zinc-400">{msg.time}</span>
                    </div>
                    <div 
                      className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                        isSelf 
                          ? "bg-blue-600 text-white font-medium rounded-tr-none" 
                          : "bg-white border border-zinc-200/80 text-zinc-800 rounded-tl-none"
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Input Bar */}
        <footer className="border-t border-zinc-200/80 p-4 bg-slate-50/30 shrink-0">
          <form onSubmit={handleSend} className="flex w-full gap-2 max-w-4xl mx-auto">
            <Input
              placeholder={isDM ? `Send a direct message to ${targetUserId}...` : `Send message to #${room}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="bg-white border-zinc-200 text-zinc-850 placeholder-zinc-450 focus-visible:ring-blue-600 text-sm h-11 flex-1 rounded-xl shadow-inner"
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </footer>

        {/* calling overlay modal */}
        {isCalling && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md text-white">
            <div className="text-center space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-24 w-24 rounded-full bg-blue-500/20 border border-blue-500/30 animate-ping"></div>
                <div className="absolute h-20 w-20 rounded-full bg-blue-500/30 border border-blue-500/40 animate-ping [animation-delay:0.5s]"></div>
                <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/35 relative">
                  <Phone className="h-7 w-7 text-white animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold tracking-tight text-white uppercase">{targetUserId}</h3>
                <p className="text-zinc-400 text-xs font-semibold">{callingStatus}</p>
              </div>
              <Button 
                onClick={handleCancelCall}
                className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-full px-6 py-5 border-0 shadow-md shadow-red-600/10 text-xs flex items-center gap-1.5"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                Cancel Call
              </Button>
            </div>
          </div>
        )}

      </div>
      <IncomingCallModal />
      <UserProfileModal
        isOpen={!!profileUser}
        onClose={() => setProfileUser(null)}
        user={profileUser}
        onInviteToCall={(targetId) => {
          const callRoom = `CALL_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const socket = getSocket();
          socket.emit("initiateCall", { toUserId: targetId, room: callRoom });
          router.push(`/video?room=${callRoom}`);
        }}
      />
    </div>
  );
}

export default function ChatRoom() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#f8f9fa] text-zinc-500 text-sm">Loading Chat Room Context...</div>}>
      <ChatRoomContent />
    </Suspense>
  );
}
