import { prisma } from "@/lib/prisma";

export async function getShopProducts() {
  return prisma.product.findMany({
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 3 },
      variants: true,
      categories: { include: { category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

