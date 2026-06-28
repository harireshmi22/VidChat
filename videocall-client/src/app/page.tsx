"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video, MessageSquare, Mic, Video as VideoIcon,
  Monitor, MoreHorizontal, PhoneOff, LogIn, Sparkles,
  MessageCircle, Shield, Users, HelpCircle, ArrowRight,
  Globe, Laptop, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Newsletter form state
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleJoinVideo = () => {
    if (roomCode.trim()) {
      router.push(`/video?room=${roomCode.toUpperCase()}`);
    }
  };

  const handleJoinChat = () => {
    if (roomCode.trim()) {
      router.push(`/chat?room=${roomCode.toUpperCase()}`);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you for signing up, ${firstName}!`);
    setFirstName("");
    setSurname("");
    setBusinessEmail("");
    setPhone("");
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Do I need to download or install an application?",
      a: "No. AuraCall runs entirely in your web browser utilizing WebRTC. There is no software installation required on desktops, tablets, or mobile phones."
    },
    {
      q: "How secure are video calls and chat channels?",
      a: "All video and audio communications use native WebRTC end-to-end encryption. Your text chats travel over real-time WebSockets and are never stored on any server history."
    },
    {
      q: "What is P2P communication?",
      a: "P2P (Peer-to-Peer) means audio and video flow directly between participants' browsers instead of being processed by a central server. This guarantees lower latency and maximum privacy."
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f8f9fa] text-zinc-800 font-sans overflow-x-hidden">

      {/* Soft Background Radial Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_75%)] blur-[80px] pointer-events-none" />

      {/* Header Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
              <Video className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">
              AuraCall
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-500">
              <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">How it works</a>
              <a href="#interactive-features" className="hover:text-zinc-900 transition-colors">Features</a>
              <a href="#device-support" className="hover:text-zinc-900 transition-colors">Devices</a>
              <a href="#faqs" className="hover:text-zinc-900 transition-colors">FAQ</a>
            </nav>
            <Link href="/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 font-semibold transition-all">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col z-10">

        {/* HERO SECTION: Google Meet style light theme */}
        <section className="container mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center max-w-6xl">

          {/* Left Column: Headlines */}
          <div className="lg:col-span-6 space-y-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-100 bg-blue-50/50 text-blue-700 text-xs font-semibold">
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span>Lag-free WebRTC Calling</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-zinc-900">
                Premium video calls. <br />
                <span className="text-zinc-500 font-normal">Now secure for everyone.</span>
              </h1>
              <p className="text-zinc-650 text-sm sm:text-base leading-relaxed">
                We redesigned real-time calling. Connect with custom encrypted rooms for video meetings and instant private text chatting.
              </p>
            </div>

            {/* CTAs */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/login">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-5.5 font-semibold text-sm shadow-md shadow-blue-600/10">
                    Sign in
                  </Button>
                </Link>
                <Button
                  onClick={() => setRoomCode("MEET-99")}
                  variant="outline"
                  className="rounded-full border-zinc-300 text-zinc-700 hover:bg-zinc-50 px-6 py-5.5 text-sm bg-white"
                >
                  Quick Demo
                </Button>
              </div>

              {/* Code Entry Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <div className="text-sm text-zinc-500 font-semibold">Join a room:</div>
                <div className="flex items-center gap-2 border-b border-zinc-300 pb-1.5 focus-within:border-blue-600 transition-colors max-w-xs">
                  <input
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="bg-transparent border-0 outline-none text-zinc-800 placeholder-zinc-400 text-sm font-semibold tracking-wide w-32 uppercase"
                  />
                  {roomCode.trim() && (
                    <div className="flex items-center gap-1.5 animate-fadeIn">
                      <button
                        onClick={handleJoinVideo}
                        className="px-2 py-0.5 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-semibold shadow-sm"
                      >
                        Video
                      </button>
                      <button
                        onClick={handleJoinChat}
                        className="px-2 py-0.5 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-semibold shadow-sm"
                      >
                        Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: WebRTC Call Mockup Collage */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px] aspect-[4/3] rounded-2xl bg-white border border-zinc-200/80 p-4 shadow-xl">
              
              {/* Main Call Frame */}
              <div className="relative w-full h-full rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Simulated Webcam */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
                <div className="flex flex-col items-center gap-2 sm:gap-3 z-10">
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-white border border-zinc-200/60 flex items-center justify-center text-zinc-400 shadow-md">
                    <Video className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold tracking-wider uppercase">Active call session</span>
                </div>

                {/* Floating Bottom Call Controls Dock */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200/80 flex items-center gap-2 sm:gap-3 shadow-md">
                  <button className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-650 flex items-center justify-center transition-colors shadow-sm">
                    <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                  <button className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-650 flex items-center justify-center transition-colors shadow-sm">
                    <VideoIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                  <button className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-650 flex items-center justify-center transition-colors shadow-sm">
                    <Monitor className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                  <button className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-650 flex items-center justify-center transition-colors shadow-sm">
                    <MoreHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                  <button className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors shadow-sm">
                    <PhoneOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>
                
                <div className="absolute top-4 left-4 text-[9px] text-zinc-400 font-semibold px-2 py-0.5 bg-white rounded border border-zinc-200 shadow-sm">
                  P2P Stream
                </div>
              </div>

              {/* Overlapping Participant Frame 1 */}
              <div className="absolute top-8 -right-4 w-32 aspect-video rounded-lg bg-slate-50 border border-slate-200 shadow-lg overflow-hidden hidden sm:flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-50/10" />
                <div className="h-8 w-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-[10px] text-blue-600 font-bold shadow-sm z-10">
                  CR
                </div>
                <div className="absolute bottom-1.5 left-1.5 bg-slate-900/85 backdrop-blur-sm text-white text-[8px] font-semibold px-1.5 py-0.5 rounded shadow-sm z-10">
                  Camila R.
                </div>
              </div>

              {/* Overlapping Participant Frame 2 */}
              <div className="absolute top-28 -right-4 w-32 aspect-video rounded-lg bg-slate-50 border border-slate-200 shadow-lg overflow-hidden hidden sm:flex items-center justify-center">
                <div className="absolute inset-0 bg-zinc-100/30" />
                <div className="h-8 w-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-[10px] text-zinc-500 font-bold shadow-sm z-10">
                  DF
                </div>
                <div className="absolute bottom-1.5 left-1.5 bg-slate-900/85 backdrop-blur-sm text-white text-[8px] font-semibold px-1.5 py-0.5 rounded shadow-sm z-10">
                  Daniela F.
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* SECTION A (New): Drive decisions and action with interactive meetings (Screenshot 1) */}
        <section id="interactive-features" className="py-20 border-t border-zinc-250 bg-white">
          <div className="container mx-auto px-6 max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            {/* Left: Collaged Features Stream Graphics */}
            <div className="lg:col-span-6 flex justify-center lg:justify-start">
              <div className="relative w-full max-w-[420px] aspect-square rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center p-8 shadow-sm">

                {/* User Webcam Frame Mock */}
                <div className="relative w-full aspect-video rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-md flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 to-zinc-950" />
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] text-zinc-400 font-bold">
                      ME
                    </div>
                  </div>

                  {/* Floating controls inside mockup */}
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/60 text-[9px] text-zinc-400 font-semibold border border-zinc-800">
                    Me (Active Stream)
                  </div>
                </div>

                {/* Floating Tooltip A: E2EE Indicator */}
                <div className="absolute top-6 left-6 p-2 rounded-xl bg-zinc-900 border border-zinc-850 shadow-lg flex items-center gap-2 animate-bounce">
                  <div className="h-5 w-5 rounded bg-green-500/10 text-green-400 flex items-center justify-center">
                    <Shield className="h-3 w-3" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300">P2P Encryption Active</span>
                </div>

                {/* Floating Tooltip B: Speech translation */}
                <div className="absolute bottom-8 left-4 p-3.5 rounded-xl bg-zinc-900 border border-zinc-850 shadow-xl max-w-[160px] space-y-2 hidden sm:block">
                  <div className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Speech Translation
                  </div>
                  <p className="text-[9px] text-zinc-450 leading-relaxed">
                    Translating between English and Spanish in real-time.
                  </p>
                </div>

                {/* Floating Tooltip C: Chat dialog */}
                <div className="absolute right-4 bottom-14 p-3.5 rounded-xl bg-zinc-900 border border-zinc-850 shadow-xl max-w-[160px] space-y-2 hidden sm:block">
                  <div className="text-[10px] font-bold text-zinc-300 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-indigo-400" />
                    Room Chat
                  </div>
                  <div className="text-[9px] bg-black/40 rounded p-1.5 border border-zinc-800 text-zinc-450 leading-tight">
                    What is today's agenda?
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Text Content */}
            <div className="lg:col-span-6 space-y-5">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 leading-tight">
                Drive decisions and action with P2P meetings
              </h2>
              <p className="text-zinc-650 text-sm leading-relaxed">
                Turn discussions into next steps instantly. With AuraCall managing your signaling handshake, your local client handles camera outputs and audio routes with zero latency. Secure peer connections let your team focus entirely on making choices and moving work forward.
              </p>
              <div className="pt-2">
                <Link href="/login" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-500 group">
                  Access your calling deck
                  <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION B (New): Meet on any device (Screenshot 2) */}
        <section id="device-support" className="py-20 border-t border-zinc-250 bg-[#f8f9fa]">
          <div className="container mx-auto px-6 max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            {/* Left: Text Content */}
            <div className="lg:col-span-5 space-y-5 order-last lg:order-first">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 leading-tight">
                Meet on any device
              </h2>
              <p className="text-zinc-650 text-sm leading-relaxed">
                Join on your mobile phone, tablet, or laptop. Simply open the generated meeting link in your browser - no downloads or app store installs are needed. Experience identical performance and low latency across all screens.
              </p>
              <div className="flex gap-4 pt-2 text-zinc-400">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Laptop className="h-4 w-4 text-zinc-500" />
                  Desktop
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Smartphone className="h-4 w-4 text-zinc-500" />
                  Mobile
                </div>
              </div>
            </div>

            {/* Right: Simulated Mobile Calling Mock */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="relative flex items-center justify-center p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm w-full max-w-[420px] aspect-[4/3]">

                {/* Smartphone Mockup */}
                <div className="relative w-44 aspect-[9/18] rounded-[28px] border-4 border-zinc-300 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col p-1.5">
                  {/* Selfie Stream */}
                  <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-zinc-900 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 to-zinc-950" />

                    {/* Floating Local Camera Mock */}
                    <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                      You
                    </div>

                    {/* Overlaid mock call controls */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-black/75 border border-zinc-800 flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center text-[8px]">
                        <PhoneOff className="h-2.5 w-2.5 text-white" />
                      </div>
                      <div className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[8px]">
                        <Mic className="h-2.5 w-2.5 text-zinc-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Participant Box next to phone */}
                <div className="absolute top-10 right-6 w-24 aspect-video rounded bg-white border border-zinc-200 shadow-md hidden sm:flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-zinc-400">Imani Ali</span>
                </div>

                {/* Floating Participant Box next to phone (left) */}
                <div className="absolute bottom-10 left-6 w-24 aspect-video rounded bg-white border border-zinc-200 shadow-md hidden sm:flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-zinc-400">Camila R.</span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* SECTION 1: How It Works */}
        <section id="how-it-works" className="py-20 border-t border-zinc-200 bg-white">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                Get started in three simple steps
              </h2>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                AuraCall handles all peer negotiation instantly under the hood.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="space-y-4 text-center md:text-left">
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto md:mx-0 font-bold text-sm shadow-sm">
                  1
                </div>
                <h3 className="text-base font-semibold text-zinc-900">Authenticate Account</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Sign in securely. Your unique peer identifier is registered to our global signaling socket network.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-4 text-center md:text-left">
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto md:mx-0 font-bold text-sm shadow-sm">
                  2
                </div>
                <h3 className="text-base font-semibold text-zinc-900">Create or Enter Code</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Generate a unique room name or input an existing code. Share the code with your peer to establish handshake lanes.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-4 text-center md:text-left">
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto md:mx-0 font-bold text-sm shadow-sm">
                  3
                </div>
                <h3 className="text-base font-semibold text-zinc-900">Call & Chat Securely</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Experience crystal clear real-time communication. Your chat logs and media data are never logged on server storage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: FAQs (Accordion layout) */}
        <section id="faqs" className="py-20 border-t border-zinc-200 bg-[#f8f9fa]">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                Frequently Asked Questions
              </h2>
              <p className="text-zinc-500 text-sm">
                Quick answers to common questions about AuraCall setup.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-zinc-200 rounded-xl bg-white overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-4 px-6 flex items-center justify-between font-medium text-zinc-800 text-left hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <HelpCircle className={`h-4.5 w-4.5 text-zinc-400 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  {activeFaq === idx && (
                    <div className="p-6 border-t border-zinc-200 bg-[#f8f9fa] text-zinc-650 text-sm leading-relaxed animate-slideDown">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION C (New): Signup Banner matching screenshot 3 */}
        <section id="signup-banner" className="py-16 border-t border-zinc-200 bg-white">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="w-full rounded-2xl border border-blue-100 bg-blue-50/30 p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-10 justify-between shadow-sm">

              {/* Left Headline */}
              <div className="max-w-md space-y-3 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-900">
                  Sign up for productivity, collaboration and updates
                </h2>
                <p className="text-blue-700/80 text-xs">
                  Subscribe to learn about WebRTC optimizations, new codecs, and socket-channel updates.
                </p>
              </div>

              {/* Right Form Inputs */}
              <form onSubmit={handleNewsletterSubmit} className="flex-1 w-full max-w-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First name*"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-sm outline-none focus:border-blue-600 transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Surname*"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-sm outline-none focus:border-blue-600 transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Business email*"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-sm outline-none focus:border-blue-600 transition-colors"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="+91 81234 56789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-sm outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-5.5 text-xs font-semibold shadow-sm"
                  >
                    Continue
                  </Button>
                </div>
              </form>

            </div>
          </div>
        </section>

        {/* Pulsing Floating Chat Circle */}
        <div className="fixed bottom-6 right-6 z-40">
          <Link href="/chat?room=GENERAL">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 transition-transform active:scale-95 group">
              <MessageCircle className="h-5 w-5 group-hover:scale-105 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
              </span>
            </button>
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 py-8 text-center text-xs text-zinc-500 bg-[#f8f9fa]">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} AuraCall. Powered by WebRTC & Socket.IO.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-700">Security Specs</a>
            <a href="#" className="hover:text-zinc-700">P2P Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
