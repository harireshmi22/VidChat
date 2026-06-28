"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video, ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed.");
        if (response.status === 404) {
          setTimeout(() => {
            toast.error("Login failed. Redirecting to signup...");
            router.push(`/signup?email=${encodeURIComponent(email)}`);
          }, 1500);
        }
        toast.error(data.error || "Login failed.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("auracall_accessToken", data.accessToken);
      localStorage.setItem("auracall_refreshToken", data.refreshToken);
      localStorage.setItem("auracall_userId", data.userId);
      localStorage.setItem("auracall_username", data.name);
      localStorage.setItem("auracall_avatarColor", data.avatarColor);

      router.push("/chat?room=general");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] text-[#202124] px-4 overflow-hidden font-sans">

      {/* Soft Background Radial Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] blur-[60px] pointer-events-none" />

      <div className="w-full max-w-[420px] z-10 space-y-6">

        {/* Login Card Container */}
        <Card className="border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/50 rounded-2xl p-4 sm:p-6">
          <CardHeader className="text-center space-y-3 pb-6">
            <Link href="/" className="inline-flex items-center gap-2 group mx-auto">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600 shadow-sm">
                <Video className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900">
                AuraCall
              </span>
            </Link>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-900">Sign in</CardTitle>
              <CardDescription className="text-zinc-500 text-sm">
                to continue to your AuraCall deck
              </CardDescription>
              {error && (
                <div className="bg-red-50 text-red-650 border border-red-150 text-xs font-semibold px-3 py-2 rounded-lg mt-2 text-center">
                  {error}
                </div>
              )}
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pb-4">
              {/* Email Input Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-700 text-xs font-semibold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-sm h-11 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-700 text-xs font-semibold">Password</Label>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-500 font-semibold transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-sm h-11 rounded-lg"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1.5 h-8 w-8 text-zinc-400 hover:text-zinc-650 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm shadow-md py-5.5"
              >
                {isLoading ? "Signing In..." : "Next"}
              </Button>

              <div className="flex items-center justify-between w-full text-xs pt-2">
                <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-zinc-800 transition-colors">
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Back to home
                </Link>
                <div className="text-zinc-500">
                  New?{" "}
                  <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-semibold transition-colors">
                    Create account
                  </Link>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
