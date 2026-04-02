import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return { ok: false as const, status: 401, token };

  if ((token as any).role !== "ADMIN") {
    return { ok: false as const, status: 403, token };
  }

  return { ok: true as const, status: 200, token };
}

