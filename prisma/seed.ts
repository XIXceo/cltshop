import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin12345!";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log(`Admin ready: ${admin.email}`);

  const categories = ["Tops", "Bottoms", "Outerwear", "Accessories"];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(c) },
      update: {},
      create: { name: c, slug: slugify(c) },
    });
  }

  // Seed a couple of demo products so the shop isn't empty.
  const topCategory = await prisma.category.findUnique({
    where: { slug: slugify("Tops") },
  });

  if (topCategory) {
    const existing = await prisma.product.findUnique({
      where: { slug: "demo-hoodie" },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          title: "Demo Hoodie",
          slug: "demo-hoodie",
          description:
            "A soft demo hoodie for showcasing your online clothing shop.",
          images: {
            create: [
              {
                url: "https://placehold.co/900x675?text=Demo+Hoodie",
                alt: "Demo Hoodie",
                sortOrder: 0,
              },
            ],
          },
          variants: {
            create: [
              {
                sku: "HOODIE-BLK-M",
                size: "M",
                color: "Black",
                priceCents: 5999,
                stockQty: 25,
              },
              {
                sku: "HOODIE-GRY-L",
                size: "L",
                color: "Gray",
                priceCents: 5999,
                stockQty: 15,
              },
            ],
          },
          categories: {
            create: [{ categoryId: topCategory.id }],
          },
        },
      });
    }
  }

  const bottomsCategory = await prisma.category.findUnique({
    where: { slug: slugify("Bottoms") },
  });
  if (bottomsCategory) {
    const existing = await prisma.product.findUnique({
      where: { slug: "demo-jeans" },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          title: "Demo Jeans",
          slug: "demo-jeans",
          description: "A demo pair of jeans with size/color variants.",
          images: {
            create: [
              {
                url: "https://placehold.co/900x675?text=Demo+Jeans",
                alt: "Demo Jeans",
                sortOrder: 0,
              },
            ],
          },
          variants: {
            create: [
              {
                sku: "JEANS-BLK-32",
                size: "32",
                color: "Black",
                priceCents: 7499,
                stockQty: 18,
              },
              {
                sku: "JEANS-BLU-34",
                size: "34",
                color: "Blue",
                priceCents: 7499,
                stockQty: 10,
              },
            ],
          },
          categories: {
            create: [{ categoryId: bottomsCategory.id }],
          },
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

