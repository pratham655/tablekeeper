"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "owner">("customer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register user
      const registerRes = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: trimmedName,
          email: trimmedEmail,
          password,
          role,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(
          typeof registerData.detail === "string"
            ? registerData.detail
            : "Could not complete registration."
        );
      }

      // 2. Automatically log in to get access token
      const loginRes = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        router.push("/login");
        return;
      }

      login(loginData.access_token, loginData.user);

      if (loginData.user.role === "owner") {
        router.push("/owner");
      } else {
        router.push("/");
      }
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
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#244b38] text-2xl font-bold text-white shadow-sm">
            t.
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#20251f]">
              tablekeeper
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#85877d]">
              A table worth keeping
            </p>
          </div>
        </Link>

        <section className="rounded-[28px] border border-[#e5e3da] bg-white p-7 shadow-[0_16px_50px_rgba(31,49,34,0.06)] sm:p-9">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c6b32]">
              Join Tablekeeper
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#20251f]">
              Create an account
            </h2>
            <p className="mt-2 text-xs leading-5 text-[#777d73]">
              Join to discover curated restaurants, manage dining bookings, or oversee your restaurant operations.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Toggle */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#454c41]">
                I want to use Tablekeeper as:
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#e5e3da] bg-[#fafaf7] p-1">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`rounded-xl py-2 text-xs font-bold transition ${
                    role === "customer"
                      ? "bg-[#244b38] text-white shadow-xs"
                      : "text-[#697066] hover:text-[#20251f]"
                  }`}
                >
                  🍽️ Diner / Guest
                </button>
                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={`rounded-xl py-2 text-xs font-bold transition ${
                    role === "owner"
                      ? "bg-[#244b38] text-white shadow-xs"
                      : "text-[#697066] hover:text-[#20251f]"
                  }`}
                >
                  🏢 Restaurant Owner
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-semibold text-[#454c41]"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                className="h-11 w-full rounded-xl border border-[#e0e3da] bg-[#fdfdfb] px-4 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-[#454c41]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-[#e0e3da] bg-[#fdfdfb] px-4 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-[#454c41]"
              >
                Password (min 8 characters)
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-[#e0e3da] bg-[#fdfdfb] px-4 text-xs font-medium text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#244b38] px-4 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#183727] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#777d73]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#244b38] underline hover:text-[#183727]"
            >
              Sign in
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-[10px] text-[#999b92]">
          Your dining data is securely stored on Tablekeeper.
        </p>
      </div>
    </main>
  );
}
