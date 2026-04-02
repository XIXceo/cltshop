"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

// Icons
function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

type NavItem = { href: string; label: string };

const items: NavItem[] = [
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "Account" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const [cartCount, setCartCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthed = status === "authenticated";
  const isAdmin = session?.user && (session.user as any).role === "ADMIN";

  const authLinks = useMemo(() => {
    if (!isAuthed) return [];
    if (isAdmin) return [{ href: "/admin", label: "Admin" }];
    return [];
  }, [isAdmin, isAuthed]);

  async function refreshCart() {
    try {
      const res = await fetch("/api/cart", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json();
      setCartCount(data.itemsCount ?? 0);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (isAuthed) refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent tracking-tight group-hover:from-brand-400 group-hover:to-brand-300 transition-all">
              ejwain4
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[...items, ...authLinks].map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="relative px-4 py-2 text-sm font-medium text-slate-400 hover:text-brand-400 transition-colors rounded-lg hover:bg-brand-500/10"
              >
                {it.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            {isAuthed && (
              <Link
                href="/cart"
                className="relative p-2 text-slate-400 hover:text-brand-400 transition-colors rounded-full hover:bg-brand-500/10"
              >
                <CartIcon className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white shadow-lg shadow-brand-500/30">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth buttons */}
            <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-slate-800">
              {isAuthed ? (
                <button
                  onClick={() => signOut()}
                  className="btn-secondary text-xs"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link href="/signin" className="btn-secondary text-xs">
                    Sign in
                  </Link>
                  <Link href="/register" className="btn-primary text-xs">
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-brand-400 transition-colors rounded-lg hover:bg-brand-500/10"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-slate-800 animate-fade-in">
            <div className="flex flex-col gap-1">
              {[...items, ...authLinks].map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                >
                  {it.label}
                </Link>
              ))}
              {!isAuthed && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800">
                  <Link href="/signin" className="btn-secondary flex-1 text-xs">
                    Sign in
                  </Link>
                  <Link href="/register" className="btn-primary flex-1 text-xs">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
