import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CartItemSchema = z.object({
  variantId: z.string(),
  quantity: z.number().min(1),
  unitPriceCents: z.number().min(0),
});

const CheckoutSchema = z.object({
  shippingName: z.string().min(1).max(80),
  phoneNumber: z.string().min(5).max(20),
  shippingAddress: z.string().min(3).max(200),
  items: z.array(CartItemSchema).min(1, "Cart must have at least one item"),
});

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const messages = [
      ...flattened.formErrors,
      ...Object.entries(flattened.fieldErrors).map(([field, errors]) => `${field}: ${errors?.join(', ')}`),
    ].filter(Boolean);
    return Response.json({ error: messages.join('; ') || 'Validation failed' }, { status: 400 });
  }

  const data = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    // Validate all items and fetch product details
    const itemsWithDetails = await Promise.all(
      data.items.map(async (item) => {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: {
              select: { title: true },
            },
          },
        });

        if (!variant) {
          throw new Error(`Product variant ${item.variantId} not found`);
        }

        if (variant.stockQty < item.quantity) {
          throw new Error(`Insufficient stock for ${variant.product.title}`);
        }

        return {
          ...item,
          productTitle: variant.product.title,
          variantSku: variant.sku,
          variantSize: variant.size,
          variantColor: variant.color,
          unitPriceCents: variant.priceCents, // Use current price from DB
          lineTotalCents: variant.priceCents * item.quantity,
        };
      }),
    );

    const totalCents = itemsWithDetails.reduce(
      (sum, it) => sum + it.lineTotalCents,
      0,
    );

    // Create order without user association (guest order)
    const order = await tx.order.create({
      data: {
        status: "PENDING",
        currency: "MAD",
        shippingName: data.shippingName,
        shippingEmail: data.phoneNumber,
        shippingAddress1: data.shippingAddress,
        shippingCity: "-",
        shippingPostal: "-",
        shippingCountry: "Morocco",
        totalCents,
        items: {
          create: itemsWithDetails.map((it) => ({
            variantId: it.variantId,
            productTitle: it.productTitle,
            variantSku: it.variantSku,
            variantSize: it.variantSize,
            variantColor: it.variantColor,
            unitPriceCents: it.unitPriceCents,
            quantity: it.quantity,
            lineTotalCents: it.lineTotalCents,
          })),
        },
      },
      include: { items: true },
    });

    // Decrement inventory
    for (const it of itemsWithDetails) {
      await tx.productVariant.update({
        where: { id: it.variantId },
        data: { stockQty: { decrement: it.quantity } },
      });
    }

    return { ok: true as const, orderId: order.id, status: order.status };
  }).catch((err) => {
    console.error("Checkout transaction failed:", err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Database error", status: 500 };
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status === 409 ? 409 : 400 });
  }

  return Response.json(result, { status: 201 });
}

