"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, VideoOff, Mic, MicOff, PhoneOff, User, Menu, MessageSquare, Shield, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";
import { getSocket } from "@/lib/socket";
import { IncomingCallModal } from "@/components/incoming-call-modal";
import { FriendRequestNotification } from "@/components/friend-request-notification";

function VideoRoomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const room = searchParams.get("room") || "voice-lobby";
  
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [remoteUserId, setRemoteUserId] = useState<string>("");
  const [remoteUsername, setRemoteUsername] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState("Waiting for peer to join...");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const handleToggleScreenShare = async () => {
    if (isSharingScreen) {
      handleStopScreenShare();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsSharingScreen(true);

        const screenTrack = stream.getVideoTracks()[0];
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Replace track on the WebRTC connection if it exists
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
        if (sender && screenTrack) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          handleStopScreenShare();
        };
      } catch (err) {
        console.error("Failed to start screen share:", err);
      }
    }
  };

  const handleStopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsSharingScreen(false);

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    const webcamTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
    if (sender && webcamTrack) {
      sender.replaceTrack(webcamTrack);
    }
  };

  const iceConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  };

  // 1. Get Local Stream
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUserId = localStorage.getItem("auracall_userId");
    if (!storedUserId) {
      router.push("/login");
      return;
    }
    setUserId(storedUserId);

    const storedUsername = localStorage.getItem("auracall_username") || storedUserId;
    setUsername(storedUsername);

    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Connect to socket and join room
        const socket = getSocket(storedUserId || undefined);
        socket.emit("join_room", room);
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    }

    startMedia();

    return () => {
      // Cleanup tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      const socket = getSocket();
      socket.emit("leave_room", room);
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [room, router]);

  // Toggle local video track
  useEffect(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = videoOn;
      }
    }
  }, [videoOn]);

  // Toggle local audio track
  useEffect(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = micOn;
      }
    }
  }, [micOn]);

  // 2. WebRTC Socket signaling
  useEffect(() => {
    if (!userId) return;

    const socket = getSocket(userId);

    const createPeerConnection = (targetId: string) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(iceConfiguration);
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      const activeStream = isSharingScreen && screenStreamRef.current ? screenStreamRef.current : localStreamRef.current;
      const webcamAudioTrack = localStreamRef.current?.getAudioTracks()[0];
      
      if (activeStream) {
        activeStream.getVideoTracks().forEach(track => {
          pc.addTrack(track, activeStream);
        });
      }
      if (webcamAudioTrack && localStreamRef.current) {
        pc.addTrack(webcamAudioTrack, localStreamRef.current);
      }

      // Handle remote track
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionStatus("Connected");
        }
      };

      // Handle ICE candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", { userId: targetId, candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setConnectionStatus("Peer disconnected");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        }
      };

      return pc;
    };

    socket.on("user-joined", async ({ userId: joinedUserId }) => {
      console.log(`👤 User joined room: ${joinedUserId}`);
      setRemoteUserId(joinedUserId);
      setConnectionStatus("Connecting...");

      const pc = createPeerConnection(joinedUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit("offer", { userId: joinedUserId, offer, fromName: username });
    });

    socket.on("offer", async ({ from, fromName, offer }) => {
      console.log(`📩 Received offer from: ${from}`);
      setRemoteUserId(from);
      if (fromName) setRemoteUsername(fromName);
      setConnectionStatus("Connecting...");

      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { userId: from, answer, fromName: username });
    });

    socket.on("answer", async ({ from, fromName, answer }) => {
      console.log(`📩 Received answer from: ${from}`);
      if (fromName) setRemoteUsername(fromName);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("iceCandidate", async ({ from, candidate }) => {
      console.log(`📩 Received ICE candidate from: ${from}`);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding remote ICE candidate:", e);
        }
      }
    });

    socket.on("user-left", ({ userId: leftUserId }) => {
      if (leftUserId === remoteUserId) {
        setConnectionStatus("Waiting for peer to join...");
        setRemoteUserId("");
        setRemoteUsername("");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("iceCandidate");
      socket.off("user-left");
    };
  }, [userId, remoteUserId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9fa] text-zinc-800 font-sans">
      {/* Workspace Navigation Sidebar */}
      <WorkspaceSidebar 
        activeChannel={room} 
        activeType="video" 
        mobileOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        
        {/* Video Pane Header */}
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
              <span className="text-blue-600 font-semibold text-lg">🔊</span>
              <span className="text-sm font-bold text-zinc-900 uppercase tracking-wide truncate">{room}</span>
            </div>
            
            <div className="h-4 w-[1px] bg-zinc-200 mx-1 hidden sm:block" />
            
            {/* E2EE Info Tag */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
              <Shield className="h-3 w-3" />
              <span>Media Stream Encrypted</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FriendRequestNotification />
            {/* Quick action: Open Text Chat */}
            <Link href={`/chat?room=${room}`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 font-semibold text-xs transition-all shadow-sm">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                Open Chat
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-800 h-9 rounded-full px-3 text-xs font-semibold">
                Exit
              </Button>
            </Link>
          </div>
        </header>

        {/* Video Streams Container Area */}
        <div className="flex-1 p-6 bg-slate-50/15 overflow-y-auto flex flex-col justify-center items-center min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl aspect-video md:max-h-[520px] flex-1 items-center justify-center">
            
            {/* Local Video Card Grid */}
            <div className="relative w-full h-full aspect-video rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center overflow-hidden shadow-md">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${videoOn ? "" : "hidden"}`}
              />
              {!videoOn && (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-650 shadow-md">
                  <VideoOff className="h-6 w-6 text-zinc-450" />
                </div>
              )}
              <div className="absolute bottom-3.5 left-3.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-zinc-200 font-semibold border border-white/5 flex items-center gap-1.5 shadow-sm">
                <div className={`h-1.5 w-1.5 rounded-full ${micOn ? "bg-emerald-500" : "bg-red-500"}`} />
                {username || "You"} {micOn ? "(Unmuted)" : "(Muted)"}
              </div>
            </div>

            {/* Remote Peer Video Card Grid */}
            <div className="relative w-full h-full aspect-video rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center overflow-hidden shadow-md">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${remoteUserId ? "" : "hidden"}`}
              />
              {!remoteUserId && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 shadow-md">
                    <User className="h-8 w-8 text-blue-500/85 animate-pulse" />
                  </div>
                  <span className="text-xs text-zinc-400 font-medium mt-3 animate-pulse">{connectionStatus}</span>
                </>
              )}
              <div className="absolute bottom-3.5 left-3.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-zinc-200 font-semibold border border-white/5 flex items-center gap-1.5 shadow-sm uppercase">
                <div className={`h-1.5 w-1.5 rounded-full ${remoteUserId ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`} />
                {remoteUsername || remoteUserId || "Peer"}
              </div>
            </div>

          </div>
        </div>

        {/* Video Call Controls Dock Footer */}
        <footer className="border-t border-zinc-200/80 p-4 flex items-center justify-center gap-4 bg-slate-50/30 shrink-0">
          {/* Toggle Mic */}
          <Button 
            onClick={() => setMicOn(!micOn)} 
            variant="outline" 
            size="icon" 
            className={`h-12 w-12 rounded-full border shadow-sm transition-all flex items-center justify-center ${
              micOn 
                ? "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950" 
                : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100 hover:text-red-600"
            }`}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {/* Toggle Video */}
          <Button 
            onClick={() => setVideoOn(!videoOn)} 
            variant="outline" 
            size="icon" 
            className={`h-12 w-12 rounded-full border shadow-sm transition-all flex items-center justify-center ${
              videoOn 
                ? "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950" 
                : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100 hover:text-red-600"
            }`}
          >
            {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          {/* Toggle Screen Share */}
          <Button 
            onClick={handleToggleScreenShare} 
            variant="outline" 
            size="icon" 
            className={`h-12 w-12 rounded-full border shadow-sm transition-all flex items-center justify-center ${
              isSharingScreen 
                ? "bg-emerald-50 border-emerald-250 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700" 
                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
            title={isSharingScreen ? "Stop Sharing Screen" : "Share Screen"}
          >
            <Monitor className="h-5 w-5" />
          </Button>

          {/* End Call Button */}
          <Link href="/">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-red-600 border-0 hover:bg-red-500 text-white shadow-md shadow-red-600/20 flex items-center justify-center transition-all"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </Link>
        </footer>

      </div>
      <IncomingCallModal />
    </div>
  );
}

export default function VideoRoom() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#f8f9fa] text-zinc-500 text-sm">Loading Video Stream Context...</div>}>
      <VideoRoomContent />
    </Suspense>
  );
}
