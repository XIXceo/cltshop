import { notFound } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import AddToCartForm from "@/components/AddToCartForm";

// Icons
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      categories: { include: { category: true } },
    },
  });

  if (!product) notFound();

  const firstVariant = product.variants[0];
  const priceCents = firstVariant?.priceCents ?? 0;
  const category = product.categories[0]?.category;

  return (
    <div className="py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-400 transition-colors">Home</Link>
        <ChevronRightIcon className="w-4 h-4" />
        <Link href="/shop" className="hover:text-brand-400 transition-colors">Shop</Link>
        {category && (
          <>
            <ChevronRightIcon className="w-4 h-4" />
            <Link href={`/shop?category=${category.slug}`} className="hover:text-brand-400 transition-colors">
              {category.name}
            </Link>
          </>
        )}
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-white font-medium truncate">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <section className="space-y-4">
          <div className="card overflow-hidden">
            <div className="relative aspect-square w-full bg-slate-800">
              {product.images[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.images[0].alt ?? product.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <svg className="h-20 w-20 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(0, 4).map((img, idx) => (
                <div
                  key={img.id}
                  className={`card overflow-hidden aspect-square ${idx === 0 ? "ring-2 ring-brand-500" : ""}`}
                >
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.alt ?? product.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Details */}
        <section className="space-y-6">
          <div>
            {category && (
              <Link 
                href={`/shop?category=${category.slug}`}
                className="text-xs font-semibold uppercase tracking-wide text-brand-400 hover:text-brand-300"
              >
                {category.name}
              </Link>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{product.title}</h1>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-brand-400">{formatCents(priceCents)}</span>
              {product.variants.length > 1 && (
                <span className="text-sm text-slate-400">
                  Starting price
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-400 leading-relaxed">{product.description}</p>
            </div>
          )}

          <AddToCartForm
            productTitle={product.title}
            imageUrl={product.images[0]?.url ?? null}
            variants={product.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              size: v.size,
              color: v.color,
              priceCents: v.priceCents,
              stockQty: v.stockQty,
            }))}
          />

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-4 bg-slate-900 rounded-lg ring-1 ring-slate-800">
              <TruckIcon className="w-5 h-5 text-brand-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-white">Free Shipping</h3>
                <p className="text-xs text-slate-400 mt-0.5">Delivered in 2-5 business days</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-900 rounded-lg ring-1 ring-slate-800">
              <ShieldCheckIcon className="w-5 h-5 text-brand-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-white">Cash on Delivery</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pay when you receive your order</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

