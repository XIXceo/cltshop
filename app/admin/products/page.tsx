import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      categories: { include: { category: true } },
    },
    take: 100,
  });

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-16">Image</th>
              <th>Product</th>
              <th>Categories</th>
              <th>Variants</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-slate-400">No products yet</p>
                    <Link href="/admin/products/new" className="btn-primary mt-4 text-xs">
                      Create your first product
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const img = p.images[0];
                const categories = p.categories.map((pc) => pc.category.name);
                const variantsCount = p.variants.length;
                const stockTotal = p.variants.reduce((sum, v) => sum + v.stockQty, 0);
                const minPrice = Math.min(...p.variants.map(v => v.priceCents), 0);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-800 ring-1 ring-slate-700">
                        {img?.url ? (
                          <img
                            src={img.url}
                            alt={img.alt ?? p.title}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-200">{p.title}</div>
                        <div className="truncate text-xs text-slate-500">/shop/{p.slug}</div>
                        <div className="text-xs text-brand-400 mt-0.5">{formatCents(minPrice)}</div>
                      </div>
                    </td>
                    <td>
                      {categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {categories.map((cat) => (
                            <span key={cat} className="inline-flex px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 ring-1 ring-slate-700">
                              {cat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">Uncategorized</span>
                      )}
                    </td>
                    <td>
                      <div className="text-slate-300">{variantsCount} variant{variantsCount === 1 ? "" : "s"}</div>
                      <div className="text-xs text-slate-500">{stockTotal} in stock</div>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/shop/${p.slug}`}
                          target="_blank"
                          className="inline-flex items-center justify-center rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-400 hover:bg-brand-500/20 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

