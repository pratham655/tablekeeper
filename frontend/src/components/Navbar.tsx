"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isOwner, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e9e7df] bg-[#f8f7f2]/95 backdrop-blur-xl">
      <div className="container-shell flex h-[76px] items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" aria-label="Tablekeeper home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#244b38] text-xl font-semibold text-white shadow-xs">
            t.
          </span>
          <span>
            <span className="block text-[19px] font-semibold leading-5 tracking-[-0.7px] text-[#20251f]">
              tablekeeper
            </span>
            <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[2.2px] text-[#85877d] sm:block">
              A table worth keeping
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#restaurants"
            className={`text-xs font-semibold transition ${
              pathname === "/" ? "text-[#244b38]" : "text-[#5a6258] hover:text-[#244b38]"
            }`}
          >
            Discover
          </Link>
          <Link
            href="/#how-it-works"
            className="text-xs font-semibold text-[#5a6258] transition hover:text-[#244b38]"
          >
            How it works
          </Link>

          {isOwner && (
            <Link
              href="/owner"
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                pathname.startsWith("/owner")
                  ? "bg-[#244b38] text-white shadow-xs"
                  : "bg-[#eaf0e7] text-[#244b38] hover:bg-[#dce8d8]"
              }`}
            >
              <span>Owner Dashboard</span>
              <span className="text-[10px] rounded bg-[#244b38]/15 px-1 py-0.2 uppercase tracking-wider text-[#244b38] font-extrabold">
                Partner
              </span>
            </Link>
          )}

          <Link
            href="/reservations"
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              pathname === "/reservations"
                ? "border-[#244b38] bg-[#244b38] text-white"
                : "border-[#d9ddd4] bg-white text-[#20251f] hover:border-[#244b38] hover:text-[#244b38]"
            }`}
          >
            My reservations
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 border-l border-[#e2e0d5] pl-4">
              <div className="text-right">
                <span className="block text-xs font-bold text-[#20251f] leading-tight">
                  {user?.full_name?.split(" ")[0]}
                </span>
                <span className="block text-[9px] uppercase font-bold tracking-wider text-[#85877d]">
                  {user?.role === "owner" ? "Owner" : "Customer"}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-[#f0d0c8] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#a33d31] transition hover:bg-[#fff5f1]"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-xs font-semibold text-[#244b38] transition hover:bg-[#e9eee6]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#244b38] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#183727]"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Navigation Controls */}
        <div className="flex items-center gap-2 md:hidden">
          {isOwner && (
            <Link
              href="/owner"
              className="rounded-full bg-[#244b38] px-3 py-1.5 text-[11px] font-bold text-white shadow-xs"
            >
              Owner
            </Link>
          )}

          <Link
            href="/reservations"
            className="rounded-full border border-[#d9ddd4] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#244b38]"
          >
            Bookings
          </Link>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-[#f0d0c8] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#a33d31]"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[#244b38] px-3.5 py-1.5 text-[11px] font-semibold text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
