import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: token.id as string },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return Response.json({
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalCents: o.totalCents,
        createdAt: o.createdAt,
        itemsCount: o.items.reduce((sum, it) => sum + it.quantity, 0),
        items: o.items.map((it) => ({
          id: it.id,
          productTitle: it.productTitle,
          variantSize: it.variantSize,
          variantColor: it.variantColor,
          variantSku: it.variantSku,
          quantity: it.quantity,
          unitPriceCents: it.unitPriceCents,
          lineTotalCents: it.lineTotalCents,
        })),
      })),
    });
  } catch {
    return Response.json({ orders: [] }, { status: 200 });
  }
}

