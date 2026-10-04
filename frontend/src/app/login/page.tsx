
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type LoginResponse = {
  access_token: string;
  token_type?: string;
  user: {
    id: number;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Unable to sign in. Please check your credentials.";

        throw new Error(message);
      }

      const result = data as LoginResponse;

      if (!result.access_token || !result.user) {
        throw new Error("The server returned an invalid login response.");
      }

      localStorage.setItem(
        "tablekeeper_access_token",
        result.access_token
      );

      localStorage.setItem(
        "tablekeeper_user",
        JSON.stringify(result.user)
      );

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f7f2] px-5 py-12 text-[#20251f]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f3d2b] text-2xl font-bold text-white">
            T
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tablekeeper
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-black/45">
              Restaurant Reservations
            </p>
          </div>
        </Link>

        <section className="rounded-[28px] border border-black/5 bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#52745b]">
              Welcome back
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-black/50">
              Log in to manage your reservations and discover your next
              dining experience.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#e7e5dc] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-[#52745b] focus:ring-2 focus:ring-[#52745b]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#e7e5dc] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-[#52745b] focus:ring-2 focus:ring-[#52745b]/10"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#1f3d2b] py-4 text-sm font-bold text-white transition hover:bg-[#173020] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-black/50">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-[#1f3d2b] hover:underline"
            >
              Create account
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-black/35">
          Your dining plans, all in one place.
        </p>
      </div>
    </main>
  );
}
