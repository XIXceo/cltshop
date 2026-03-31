import Link from "next/link";
import type { Product, ProductImage, ProductVariant } from "@prisma/client";
import { formatCents } from "@/lib/money";

type ProductCardProps = {
  product: Product & {
    images: ProductImage[];
    variants: ProductVariant[];
    categories: { category: { slug: string; name: string } }[];
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const img = product.images[0];
  const primaryVariant = product.variants[0];
  const priceCents = primaryVariant?.priceCents ?? 0;
  const hasStock = primaryVariant?.stockQty > 0;
  const category = product.categories[0]?.category;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group card card-hover flex flex-col overflow-hidden"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800">
        {img?.url ? (
          <img
            src={img.url}
            alt={img.alt ?? product.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-12 w-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Stock badge */}
        <div className="absolute left-3 top-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${hasStock ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"}`}>
            {hasStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>

        {/* Quick view overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
          <span className="text-sm font-medium text-white">View Details →</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        {category && (
          <span className="text-xs font-medium uppercase tracking-wide text-brand-400">
            {category.name}
          </span>
        )}
        
        {/* Title */}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-200 transition-colors group-hover:text-brand-400">
          {product.title}
        </h3>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-lg font-bold text-brand-400">
            {formatCents(priceCents)}
          </span>
          <span className="text-xs text-slate-500">
            {product.variants.length > 1 ? `${product.variants.length} options` : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}

