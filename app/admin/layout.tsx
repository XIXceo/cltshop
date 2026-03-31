import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="text-sm text-slate-400">
          Admin dashboard
        </div>
        <h1 className="mt-1 text-2xl font-bold text-white">Clothes Shop Admin</h1>
      </div>
      {children}
    </div>
  );
}

