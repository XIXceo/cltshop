"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; slug: string };

type ImageInput = { url: string; alt: string | null };

type VariantInput = {
  id?: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  priceCents: number;
  stockQty: number;
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductUpsertForm({
  mode,
  product,
  categories,
}: {
  mode: "create" | "edit";
  product?: any | null;
  categories: Category[];
}) {
  const router = useRouter();

  const initialSlug = useMemo(() => {
    if (mode === "edit" && product?.slug) return product.slug as string;
    return "";
  }, [mode, product]);

  const [title, setTitle] = useState<string>(product?.title ?? "");
  const [slug, setSlug] = useState<string>(initialSlug);
  const [description, setDescription] = useState<string>(product?.description ?? "");

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product?.categories?.map((pc: any) => pc.categoryId) ??
      product?.categories?.map((pc: any) => pc.category?.id) ??
      [],
  );

  const initialImages = useMemo(() => {
    if (!product?.images) return [];
    return (product.images as ImageInput[]).map((img) => img.url);
  }, [product]);

  const [imagesText, setImagesText] = useState<string>(
    initialImages.length ? initialImages.join("\n") : "",
  );

  const [variants, setVariants] = useState<VariantInput[]>(
    product?.variants?.length
      ? product.variants.map((v: any) => ({
          id: v.id as string,
          sku: v.sku ?? null,
          size: v.size ?? null,
          color: v.color ?? null,
          priceCents: Number(v.priceCents ?? 0),
          stockQty: Number(v.stockQty ?? 0),
        }))
      : [
          {
            sku: null,
            size: null,
            color: null,
            priceCents: 0,
            stockQty: 0,
          },
        ],
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function autoSlug() {
    const generated = slugify(title);
    if (generated) setSlug(generated);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error || `Failed to upload ${file.name}`);
          continue;
        }

        uploadedUrls.push(data.url);
      } catch {
        setError(`Failed to upload ${file.name}`);
      }
    }

    // Add uploaded URLs to the images text
    if (uploadedUrls.length > 0) {
      setImagesText((prev) => {
        const current = prev.trim();
        return current ? current + "\n" + uploadedUrls.join("\n") : uploadedUrls.join("\n");
      });
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const images = useMemo(() => {
    return imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((url) => ({ url, alt: null }));
  }, [imagesText]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title,
        slug,
        description: description || null,
        categoryIds: selectedCategoryIds.length ? selectedCategoryIds : [],
        images,
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          priceCents: Number(v.priceCents),
          stockQty: Number(v.stockQty),
        })),
      };

      if (!payload.title.trim()) {
        setError("Title is required");
        return;
      }
      if (!payload.slug.trim()) {
        setError("Slug is required");
        return;
      }
      if (!payload.categoryIds.length) {
        setError("Select at least one category");
        return;
      }
      if (!payload.variants.length) {
        setError("Add at least one variant");
        return;
      }

      const res = await fetch(
        mode === "create" ? "/api/admin/products" : `/api/admin/products/${product.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save product");
        return;
      }

      router.push("/admin/products");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 card p-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">
          {mode === "create" ? "Create product" : "Edit product"}
        </h1>
        <div className="text-sm text-slate-400">
          {mode === "create" ? "New listings go live instantly" : "Changes save immediately"}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Title
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full input-field"
          />
          <button
            type="button"
            onClick={autoSlug}
            className="btn-secondary text-sm py-1.5"
          >
            Auto-generate slug
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Slug
          </label>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full input-field"
            placeholder="e.g. classic-denim-jeans"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 min-h-[90px] w-full input-field"
          placeholder="A short description customers will see."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300">
          Categories
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => {
            const checked = selectedCategoryIds.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  checked
                    ? "border-brand-500 bg-brand-500/10 text-brand-400"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-800/80"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setSelectedCategoryIds((prev) => {
                      if (e.target.checked) return [...prev, c.id];
                      return prev.filter((x) => x !== c.id);
                    });
                  }}
                  className="hidden"
                />
                <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                  checked ? "bg-brand-500 border-brand-500" : "border-slate-600"
                }`}>
                  {checked && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                {c.name}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-300">
            Images
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`cursor-pointer btn-secondary text-sm py-1.5 ${uploading ? 'opacity-50' : ''}`}
            >
              {uploading ? "Uploading..." : "Upload files"}
            </label>
          </div>
        </div>
        <textarea
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          className="mt-2 min-h-[100px] w-full input-field"
          placeholder="Image URLs will appear here after upload, one per line&#10;Or paste URLs manually"
        />
        <div className="mt-1 text-xs text-slate-500">
          Upload images from your computer or paste URLs manually. Supported formats: JPEG, PNG, WebP, GIF (max 5MB each).
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-md border border-slate-700 bg-slate-800">
                <img
                  src={img.url}
                  alt={img.alt || `Image ${idx + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-300">
            Variants
          </label>
          <button
            type="button"
            onClick={() =>
              setVariants((prev) => [
                ...prev,
                {
                  sku: null,
                  size: null,
                  color: null,
                  priceCents: 0,
                  stockQty: 0,
                },
              ])
            }
            className="btn-secondary text-sm py-1.5"
          >
            Add variant
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((v, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-700 bg-slate-800/50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-slate-200">
                  Variant {idx + 1}
                </div>
                {variants.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400">
                    Size
                  </label>
                  <input
                    value={v.size ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setVariants((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, size: value || null } : x,
                        ),
                      );
                    }}
                    className="mt-1 w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">
                    Color
                  </label>
                  <input
                    value={v.color ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setVariants((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, color: value || null } : x,
                        ),
                      );
                    }}
                    className="mt-1 w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">
                    SKU (optional)
                  </label>
                  <input
                    value={v.sku ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setVariants((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, sku: value || null } : x,
                        ),
                      );
                    }}
                    className="mt-1 w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={v.stockQty}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setVariants((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, stockQty: Number.isFinite(value) ? value : 0 } : x,
                        ),
                      );
                    }}
                    className="mt-1 w-full input-field"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-400">
                    Price Cents (e.g. 2599 = 25.99 MAD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={v.priceCents}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setVariants((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, priceCents: Number.isFinite(value) ? value : 0 } : x,
                        ),
                      );
                    }}
                    className="mt-1 w-full input-field"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="w-full btn-secondary"
        >
          Cancel
        </button>
        <button
          disabled={submitting}
          type="submit"
          className="w-full btn-primary"
        >
          {submitting ? "Saving..." : "Save product"}
        </button>
      </div>
    </form>
  );
}

