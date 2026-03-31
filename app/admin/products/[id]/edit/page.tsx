import { prisma } from "@/lib/prisma";
import ProductUpsertForm from "@/components/ProductUpsertForm";

export default async function AdminProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      categories: true,
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (!product) {
    return (
      <div className="card p-5 text-slate-400">
        Product not found.
      </div>
    );
  }

  return (
    <ProductUpsertForm
      mode="edit"
      product={{
        id: product.id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        images: product.images,
        variants: product.variants,
        categories: product.categories,
      }}
      categories={categories}
    />
  );
}

