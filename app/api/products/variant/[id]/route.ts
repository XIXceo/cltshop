import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            title: true,
            images: {
              where: { sortOrder: 0 },
              select: { url: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      priceCents: variant.priceCents,
      stockQty: variant.stockQty,
      productTitle: variant.product.title,
      imageUrl: variant.product.images[0]?.url || null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch variant" }, { status: 500 });
  }
}
