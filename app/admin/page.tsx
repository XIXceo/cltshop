import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

// Icons
function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

export default async function AdminHome() {
  // Get stats
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    productCount,
    orderStats,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.aggregate({
      _count: { id: true },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { totalCents: true },
      _count: { id: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfWeek } },
      _sum: { totalCents: true },
      _count: { id: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalCents: true },
      _count: { id: true },
    }),
    prisma.productVariant.findMany({
      where: { stockQty: { lt: 5 } },
      include: {
        product: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { stockQty: "asc" },
      take: 5,
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          take: 3,
          select: {
            productTitle: true,
            quantity: true,
          },
        },
      },
    }),
  ]);

  const totalOrders = orderStats._count.id;
  const totalRevenue = orderStats._sum.totalCents || 0;
  const todayOrders = todayRevenue._count.id;
  const todayTotal = todayRevenue._sum.totalCents || 0;

  const pendingOrders = await prisma.order.count({
    where: { status: "PENDING" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of your store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <DollarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Today's Revenue</p>
              <p className="text-lg font-bold text-white">{formatCents(todayTotal)}</p>
              <p className="text-xs text-slate-500">{todayOrders} orders</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <TrendingUpIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">This Month</p>
              <p className="text-lg font-bold text-white">{formatCents(monthRevenue._sum.totalCents || 0)}</p>
              <p className="text-xs text-slate-500">{monthRevenue._count.id} orders</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-500/10 p-2 text-brand-400">
              <ShoppingBagIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Orders</p>
              <p className="text-lg font-bold text-white">{totalOrders}</p>
              <p className="text-xs text-slate-500">{pendingOrders} pending</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <PackageIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Products</p>
              <p className="text-lg font-bold text-white">{productCount}</p>
              <p className="text-xs text-rose-400">{lowStockProducts.length} low stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Orders */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBagIcon className="w-5 h-5 text-slate-400" />
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-sm text-brand-400 hover:text-brand-300">
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-slate-400 text-sm">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">#{order.id.slice(-6)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "PENDING" ? "bg-amber-500/10 text-amber-400" :
                        order.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" :
                        order.status === "SHIPPED" ? "bg-blue-500/10 text-blue-400" :
                        order.status === "DELIVERED" ? "bg-purple-500/10 text-purple-400" :
                        "bg-rose-500/10 text-rose-400"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {order.shippingName} • {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand-400">{formatCents(order.totalCents)}</p>
                    <p className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertIcon className="w-5 h-5 text-rose-400" />
              Low Stock Alert
            </h2>
            <Link href="/admin/products" className="text-sm text-brand-400 hover:text-brand-300">
              Manage products
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-slate-400 text-sm">All products have sufficient stock</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <Link 
                      href={`/admin/products/${variant.product.id}/edit`}
                      className="font-medium text-slate-200 hover:text-brand-400"
                    >
                      {variant.product.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-1">
                      {[variant.size, variant.color].filter(Boolean).join(" / ") || "Default"}
                    </p>
                  </div>
                  <div className={`text-right px-3 py-1 rounded-full text-xs font-medium ${
                    variant.stockQty === 0 
                      ? "bg-rose-500/10 text-rose-400" 
                      : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {variant.stockQty === 0 ? "Out of Stock" : `${variant.stockQty} left`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/products/new" className="card p-5 hover:border-brand-500/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-brand-500/10 p-3 text-brand-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Add New Product</h3>
              <p className="text-sm text-slate-400">Create a new product listing</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/orders" className="card p-5 hover:border-brand-500/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Process Orders</h3>
              <p className="text-sm text-slate-400">{pendingOrders} orders need attention</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

