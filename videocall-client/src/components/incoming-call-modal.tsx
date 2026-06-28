"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";

export function IncomingCallModal() {
  const router = useRouter();
  const [callerId, setCallerId] = useState<string | null>(null);
  const [callRoom, setCallRoom] = useState<string | null>(null);
  const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUserId = localStorage.getItem("auracall_userId");
    if (!storedUserId) return;

    const socket = getSocket(storedUserId);

    socket.on("incomingCall", ({ fromUserId, room }) => {
      setCallerId(fromUserId);
      setCallRoom(room)
      
      // Play a gentle standard ringtone (optional/fallback beep)
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/904/904-84.wav");
        audio.loop = true;
        audio.play().catch((e) => console.log("Audio play postponed until user interaction:", e));
        setRingtone(audio);
      } catch (e) {
        console.error("Failed to initialize audio:", e);
      }
    });

    socket.on("callDeclined", ({ fromUserId }) => {
      // If the caller cancelled the call, dismiss modal and stop ringtone
      setCallerId((currentCaller) => {
        if (currentCaller === fromUserId) {
          if (ringtone) {
            ringtone.pause();
          }
          setRingtone(null);
          setCallRoom(null);
          return null;
        }
        return currentCaller;
      });
    });

    return () => {
      socket.off("incomingCall");
      socket.off("callDeclined");
    };
  }, [ringtone]);

  const handleAccept = () => {
    if (!callerId || !callRoom) return;

    if (ringtone) {
      ringtone.pause();
      setRingtone(null);
    }

    const socket = getSocket();
    socket.emit("acceptCall", { toUserId: callerId, room: callRoom });
    
    setCallerId(null);
    setCallRoom(null);

    // Redirect to video call page
    router.push(`/video?room=${callRoom}`);
  };

  const handleDecline = () => {
    if (!callerId) return;

    if (ringtone) {
      ringtone.pause();
      setRingtone(null);
    }

    const socket = getSocket();
    socket.emit("declineCall", { toUserId: callerId });

    setCallerId(null);
    setCallRoom(null);
  };

  if (!callerId || !callRoom) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-6 text-zinc-300">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 animate-ping"></div>
          <div className="absolute h-20 w-20 rounded-full bg-emerald-500/30 border border-emerald-500/40 animate-ping [animation-delay:0.5s]"></div>
          <div className="h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/35 relative">
            <Phone className="h-7 w-7 text-white animate-bounce" />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Incoming Video Call</span>
          <h3 className="text-xl font-bold tracking-tight text-white uppercase">{callerId}</h3>
          <p className="text-zinc-500 text-xs font-semibold">Wants to establish 1-on-1 call</p>
        </div>

        <div className="flex justify-center gap-4 pt-2">
          <Button 
            onClick={handleDecline}
            className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl px-6 py-5 border-0 shadow-md shadow-red-600/10 text-xs flex items-center gap-1.5"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            Decline
          </Button>

          <Button 
            onClick={handleAccept}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl px-6 py-5 border-0 shadow-md shadow-emerald-600/10 text-xs flex items-center gap-1.5"
          >
            <Phone className="h-3.5 w-3.5" />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
