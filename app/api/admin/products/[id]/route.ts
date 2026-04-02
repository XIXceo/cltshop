import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(120).optional().nullable(),
});

const VariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().max(60).optional().nullable(),
  size: z.string().max(20).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  priceCents: z.number().int().min(0).max(1_000_000_00),
  stockQty: z.number().int().min(0).max(1_000_000),
});

const ProductUpdateSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().min(1).max(160),
  description: z.string().max(2000).optional().nullable(),
  categoryIds: z.array(z.string()).min(1),
  images: z.array(ImageSchema).optional().default([]),
  variants: z.array(VariantSchema).min(1),
});

import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await requireAdmin(req);
  if (!res.ok) return Response.json({ error: "Forbidden" }, { status: res.status });

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: true,
      variants: true,
      categories: { include: { category: true } },
    },
  });

  if (!product) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ product });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await requireAdmin(req);
  if (!res.ok) return Response.json({ error: "Forbidden" }, { status: res.status });

  const body = await req.json().catch(() => null);
  const parsed = ProductUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const messages = [
      ...flattened.formErrors,
      ...Object.entries(flattened.fieldErrors).map(([field, errors]) => `${field}: ${errors?.join(', ')}`),
    ].filter(Boolean);
    return Response.json({ error: messages.join('; ') || 'Validation failed' }, { status: 400 });
  }

  const { title, slug, description, categoryIds, images, variants } = parsed.data;

  const productExists = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!productExists) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: params.id },
        data: { title, slug, description: description ?? null },
      });

      // Images & category links are safe to recreate.
      await tx.productImage.deleteMany({ where: { productId: params.id } });
      await tx.productCategory.deleteMany({ where: { productId: params.id } });

      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img, idx) => ({
            productId: params.id,
            url: img.url,
            alt: img.alt ?? null,
            sortOrder: idx,
          })),
        });
      }

      await tx.productCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          productId: params.id,
          categoryId,
        })),
      });

      // Variants are trickier: cart/order history can reference them (FK is RESTRICT).
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: params.id },
        select: { id: true },
      });

      const incomingIds = variants.map((v) => v.id).filter(Boolean) as string[];
      const toDelete = existingVariants
        .map((v) => v.id)
        .filter((id) => !incomingIds.includes(id));

      if (toDelete.length > 0) {
        const referencedInOrders = await tx.orderItem.count({
          where: { variantId: { in: toDelete } },
        });
        const referencedInCarts = await tx.cartItem.count({
          where: { variantId: { in: toDelete } },
        });

        if (referencedInOrders > 0 || referencedInCarts > 0) {
          throw new Error(
            `Cannot delete ${toDelete.length} variant(s) because they are referenced by existing cart/order items.`,
          );
        }

        await tx.productVariant.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // Upsert variants: update when id is provided, otherwise create.
      for (const v of variants) {
        if (v.id) {
          const existing = await tx.productVariant.findUnique({
            where: { id: v.id },
            select: { productId: true },
          });
          if (!existing || existing.productId !== params.id) {
            throw new Error("Variant not found for this product");
          }

          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              sku: v.sku ?? null,
              size: v.size ?? null,
              color: v.color ?? null,
              priceCents: v.priceCents,
              stockQty: v.stockQty,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: params.id,
              sku: v.sku ?? null,
              size: v.size ?? null,
              color: v.color ?? null,
              priceCents: v.priceCents,
              stockQty: v.stockQty,
            },
          });
        }
      }
    });

    const updated = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        variants: true,
        categories: { include: { category: true } },
      },
    });

    return Response.json({ ok: true, product: updated }, { status: 200 });
  } catch (e: any) {
    const msg = e?.message ?? "Failed to update product";
    return Response.json(
      { error: msg },
      { status: 409 },
    );
  }
}

