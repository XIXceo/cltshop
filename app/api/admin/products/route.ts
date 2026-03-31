import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const ImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(120).optional().nullable(),
});

const VariantSchema = z.object({
  sku: z.string().max(60).optional().nullable(),
  size: z.string().max(20).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  priceCents: z.number().int().min(0).max(1_000_000_00),
  stockQty: z.number().int().min(0).max(1_000_000),
});

const ProductCreateSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().min(1).max(160),
  description: z.string().max(2000).optional().nullable(),
  categoryIds: z.array(z.string()).min(1),
  images: z.array(ImageSchema).optional().default([]),
  variants: z.array(VariantSchema).min(1),
});

export async function GET(req: Request) {
  const res = await requireAdmin(req);
  if (!res.ok) return Response.json({ error: "Forbidden" }, { status: res.status });

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      categories: { include: { category: true } },
    },
    take: 50,
  });

  return Response.json({
    products,
  });
}

export async function POST(req: Request) {
  const res = await requireAdmin(req);
  if (!res.ok) return Response.json({ error: "Forbidden" }, { status: res.status });

  const body = await req.json().catch(() => null);
  const parsed = ProductCreateSchema.safeParse(body);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const messages = [
      ...flattened.formErrors,
      ...Object.entries(flattened.fieldErrors).map(([field, errors]) => `${field}: ${errors?.join(', ')}`),
    ].filter(Boolean);
    return Response.json({ error: messages.join('; ') || 'Validation failed' }, { status: 400 });
  }

  const { title, slug, description, categoryIds, images, variants } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description: description ?? null,
        images: {
          create: images.map((img, idx) => ({
            url: img.url,
            alt: img.alt ?? null,
            sortOrder: idx,
          })),
        },
        variants: {
          create: variants.map((v) => ({
            sku: v.sku ?? null,
            size: v.size ?? null,
            color: v.color ?? null,
            priceCents: v.priceCents,
            stockQty: v.stockQty,
          })),
        },
        categories: {
          create: categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
      },
      include: { variants: true, images: true, categories: true },
    });

    return Response.json({ ok: true, product }, { status: 201 });
  } catch (e: any) {
    // Likely unique constraint on slug.
    return Response.json(
      { error: e?.message ?? "Failed to create product" },
      { status: 409 },
    );
  }
}

