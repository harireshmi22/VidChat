"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, UserCheck, UserX, Check, X } from "lucide-react";
import { getSocket } from "@/lib/socket";

export function FriendRequestNotification() {
  const [pendingIncoming, setPendingIncoming] = useState<{ userId: string; name: string; avatarColor: string }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUserId = localStorage.getItem("auracall_userId");
    if (!storedUserId) return;

    const socket = getSocket(storedUserId);

    socket.emit("getFriendsData");

    const handleFriendsUpdate = (data: {
      friends: any[];
      pendingIncoming: { userId: string; name: string; avatarColor: string }[];
      pendingOutgoing: any[];
    }) => {
      setPendingIncoming(data.pendingIncoming);
    };

    socket.on("friendsDataUpdated", handleFriendsUpdate);

    return () => {
      socket.off("friendsDataUpdated", handleFriendsUpdate);
    };
  }, []);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleAcceptRequest = (fromUserId: string) => {
    const socket = getSocket();
    socket.emit("acceptFriendRequest", { fromUserId });
  };

  const handleDeclineRequest = (fromUserId: string) => {
    const socket = getSocket();
    socket.emit("declineFriendRequest", { fromUserId });
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Icon */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors"
        title="Friend Requests Inbox"
      >
        <Bell className="h-5 w-5" />
        {pendingIncoming.length > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {pendingIncoming.length}
          </span>
        )}
      </button>

      {/* Floating Request Box Dropdown */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Friend Requests Box</span>
            {pendingIncoming.length > 0 && (
              <span className="bg-blue-600/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingIncoming.length} New
              </span>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-850 p-2 space-y-1 bg-slate-900">
            {pendingIncoming.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500 italic">
                No pending friend requests.
              </div>
            ) : (
              pendingIncoming.map((user) => {
                const initials = user.name
                  ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "U";

                return (
                  <div key={user.userId} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-850/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 uppercase shadow-sm"
                        style={{ backgroundColor: user.avatarColor || "#3b82f6" }}
                      >
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white leading-tight truncate">{user.name}</span>
                        <span className="text-[10px] text-zinc-500">ID: {user.userId}</span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(user.userId)}
                        className="p-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-lg transition-colors border border-emerald-500/20"
                        title="Accept Request"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(user.userId)}
                        className="p-1.5 bg-red-650/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-colors border border-red-550/20"
                        title="Decline Request"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
