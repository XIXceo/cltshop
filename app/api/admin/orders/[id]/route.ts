import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const UpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await requireAdmin(req);
  if (!res.ok) return Response.json({ error: "Forbidden" }, { status: res.status });

  const body = await req.json().catch(() => null);
  const parsed = UpdateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { status } = parsed.data;

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status },
  });

  return Response.json({ ok: true, order: updated });
}

