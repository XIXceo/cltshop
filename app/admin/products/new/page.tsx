import { prisma } from "@/lib/prisma";
import ProductUpsertForm from "@/components/ProductUpsertForm";

export default async function AdminProductNewPage() {
  const categories = await prisma.category.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <ProductUpsertForm
      mode="create"
      categories={categories}
    />
  );
}

