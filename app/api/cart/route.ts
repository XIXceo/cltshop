import { z } from "zod";
import { getToken } from "next-auth/jwt";

import { prisma } from "@/lib/prisma";

const CartUpsertSchema = z.object({
  action: z.enum(["upsert", "remove", "clear"]),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
});

export async function GET(req: Request) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return Response.json(
        { error: "Unauthorized", message: "Please sign in to view your cart." },
        { status: 401 },
      );
    }

    const cart = await prisma.cart.findFirst({
      where: { userId: token.id as string, status: "ACTIVE" },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { sortOrder: "asc" }, take: 1 },
                  },
                },
              },
            },
          },
          orderBy: { id: "desc" },
        },
      },
    });

    const items = (cart?.items ?? []).map((it) => {
      const img = it.variant.product.images[0];
      return {
        itemId: it.id,
        variantId: it.variantId,
        title: it.variant.product.title,
        sku: it.variant.sku,
        size: it.variant.size,
        color: it.variant.color,
        imageUrl: img?.url ?? null,
        quantity: it.quantity,
        unitPriceCents: it.variant.priceCents,
        lineTotalCents: it.variant.priceCents * it.quantity,
      };
    });

    const totalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);
    const itemsCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return Response.json({
      items,
      totalCents,
      currency: "MAD",
      itemsCount,
    });
  } catch (err) {
    console.error("[cart GET] failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: "Failed to load cart", message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return Response.json(
        { error: "Unauthorized", message: "Please sign in to update your cart." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = CartUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { action, variantId, quantity } = parsed.data;
    const userId = token.id as string;

    let cart = await prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" },
    });

    if (!cart && action !== "clear") {
      cart = await prisma.cart.create({ data: { userId, status: "ACTIVE" } });
    }

    if (!cart && action === "clear") {
      return Response.json({ ok: true });
    }

    if (action === "clear") {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart!.id },
      });
      return Response.json({ ok: true });
    }

    if (!variantId) {
      return Response.json({ error: "variantId is required" }, { status: 400 });
    }

    if (action === "remove") {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart!.id, variantId },
      });
      return Response.json({ ok: true });
    }

    const qty = quantity ?? 1;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, stockQty: true, priceCents: true },
    });

    if (!variant) {
      return Response.json({ error: "Variant not found" }, { status: 404 });
    }

    if (variant.stockQty < qty) {
      return Response.json(
        { error: `Only ${variant.stockQty} items available in stock` },
        { status: 409 },
      );
    }

    // Upsert cart item by unique(cartId, variantId)
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart!.id, variantId } },
      create: { cartId: cart!.id, variantId, quantity: qty },
      update: { quantity: qty },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[cart POST] error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "Failed to add to cart", message }, { status: 500 });
  }
}

