import { prisma } from "@/lib/prisma";
import AdminOrdersTable from "@/components/AdminOrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
      items: true,
    },
  });

  return <AdminOrdersTable orders={orders} />;
}

