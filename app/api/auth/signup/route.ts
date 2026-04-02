import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80).optional(),
});

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: "CUSTOMER",
      passwordHash,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return Response.json({ user }, { status: 201 });
}

