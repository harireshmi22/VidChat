"use client";

import React from "react";
import { X, PhoneCall } from "lucide-react";
import { Button } from "./ui/button";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    userId: string;
    name: string;
    avatarColor: string;
  } | null;
  onInviteToCall?: (targetUserId: string) => void;
}

export function UserProfileModal({ isOpen, onClose, user, onInviteToCall }: UserProfileModalProps) {
  if (!isOpen || !user) return null;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-zinc-300 relative">
        
        {/* Header Close Trigger */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Decorative Banner */}
        <div 
          className="h-24 w-full opacity-70"
          style={{ 
            background: `linear-gradient(135deg, ${user.avatarColor || "#3b82f6"} 0%, #0f172a 100%)` 
          }}
        />

        {/* Profile Content */}
        <div className="px-6 pb-6 pt-0 flex flex-col items-center -mt-10 relative">
          
          {/* Circular HSL Avatar */}
          <div 
            className="h-20 w-20 rounded-full border-4 border-slate-900 flex items-center justify-center font-bold text-2xl text-white uppercase shadow-lg select-none"
            style={{ backgroundColor: user.avatarColor || "#3b82f6" }}
          >
            {initials}
          </div>

          <h3 className="mt-3 text-lg font-bold text-white tracking-wide">{user.name}</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">ID: {user.userId}</p>

          <div className="w-full border-t border-slate-800/80 my-4" />

          {/* User Details Details */}
          <div className="w-full bg-slate-950/40 rounded-xl p-3 border border-slate-850/50 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Workspace</span>
              <span className="text-zinc-300 font-medium">AuraCall Core</span>
            </div>
          </div>

          {/* Action Trigger */}
          {onInviteToCall && (
            <Button
              onClick={() => {
                onInviteToCall(user.userId);
                onClose();
              }}
              className="mt-5 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 h-10 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <PhoneCall className="h-4 w-4" />
              Invite to Voice & Video Call
            </Button>
          )}

        </div>
      </div>
    </div>
  );
}
