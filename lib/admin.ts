import { getToken } from "next-auth/jwt";

export async function requireAdmin(req: Request) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return { ok: false as const, status: 401, token };

  if ((token as any).role !== "ADMIN") {
    return { ok: false as const, status: 403, token };
  }

  return { ok: true as const, status: 200, token };
}

