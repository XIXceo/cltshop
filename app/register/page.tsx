"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to register");
        return;
      }

      // Auto sign-in after registration.
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!signInRes?.error) router.push("/shop");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-bold text-white">Create account</h1>
      {error ? (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-3 card p-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full input-field"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full input-field"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full input-field"
            placeholder="Minimum 8 characters"
          />
          <div className="mt-1 text-xs text-slate-500">
            Minimum 8 characters.
          </div>
        </div>
        <button
          disabled={loading}
          type="submit"
          className="w-full btn-primary py-3"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      <div className="text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-brand-400 hover:text-brand-300">
          Sign in
        </Link>
      </div>
    </div>
  );
}

