import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q : "";
  const categorySlug = typeof params?.category === "string" ? params.category : "";
  const min = typeof params?.min === "string" ? params.min : "";
  const max = typeof params?.max === "string" ? params.max : "";

  const minCents = min ? Math.max(0, Math.round(Number(min) * 100)) : undefined;
  const maxCents = max ? Math.max(0, Math.round(Number(max) * 100)) : undefined;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
      ...(categorySlug
        ? {
            categories: {
              some: { category: { slug: categorySlug } },
            },
          }
        : {}),
      ...(minCents || maxCents
        ? {
            variants: {
              some: {
                priceCents: {
                  ...(typeof minCents === "number" ? { gte: minCents } : {}),
                  ...(typeof maxCents === "number" ? { lte: maxCents } : {}),
                },
              },
            },
          }
        : {}),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: true,
      categories: { include: { category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const hasFilters = q || categorySlug || min || max;

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Shop</h1>
        <p className="mt-2 text-slate-400">Discover our latest collection of premium fashion</p>
      </div>

      {/* Filters */}
      <div className="card mb-6 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon className="w-5 h-5 text-brand-400" />
          <h2 className="font-semibold text-white">Filters</h2>
        </div>
        
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" method="GET" action="/shop">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Search
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search products..."
                className="input-field w-full pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Category
            </label>
            <select
              name="category"
              defaultValue={categorySlug}
              className="input-field w-full"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Min Price (MAD)
            </label>
            <input
              name="min"
              type="number"
              min="0"
              defaultValue={min}
              placeholder="0"
              className="input-field w-full"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Max Price (MAD)
            </label>
            <input
              name="max"
              type="number"
              min="0"
              defaultValue={max}
              placeholder="∞"
              className="input-field w-full"
            />
          </div>
          
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button type="submit" className="btn-primary flex-1">
              Apply Filters
            </button>
            {hasFilters && (
              <Link href="/shop" className="btn-secondary">
                Clear
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">
          Showing <span className="font-semibold text-white">{products.length}</span> products
        </p>
        {hasFilters && (
          <div className="flex flex-wrap gap-2">
            {q && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400 ring-1 ring-brand-500/20">
                Search: {q}
              </span>
            )}
            {categorySlug && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400 ring-1 ring-brand-500/20">
                Category: {categories.find(c => c.slug === categorySlug)?.name || categorySlug}
              </span>
            )}
            {(min || max) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400 ring-1 ring-brand-500/20">
                Price: {min || "0"} - {max || "∞"} MAD
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product grid */}
      {products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      ) : (
        <div className="card py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-white">No products found</h3>
          <p className="mt-1 text-slate-400">Try adjusting your filters or search query</p>
          <Link href="/shop" className="btn-primary mt-4 inline-flex">
            Clear all filters
          </Link>
        </div>
      )}
    </div>
  );
}

