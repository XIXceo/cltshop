import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(80),
});

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const res = await requireAdmin(req);
  if (!res.ok) return Response.json({ error: "Forbidden" }, { status: res.status });

  const categories = await prisma.category.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ categories });
}

export async function POST(req: NextRequest) {
  const res = await requireAdmin(req);
  if (!res.ok) return Response.json({ error: "Forbidden" }, { status: res.status });

  const body = await req.json().catch(() => null);
  const parsed = CategoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, slug } = parsed.data;
  const category = await prisma.category.create({ data: { name, slug } });
  return Response.json({ category }, { status: 201 });
}

