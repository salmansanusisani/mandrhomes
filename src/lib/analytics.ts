import "server-only";
import { prisma } from "./db";
import { formatDate } from "./utils";

export type DailyPoint = {
  date: string;
  label: string;
  views: number;
  orders: number;
  revenue: number;
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export async function getDailySeries(days = 30): Promise<DailyPoint[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const [views, orders] = await Promise.all([
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM "PageView"
      WHERE "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1
    `,
    prisma.$queryRaw<Array<{ day: Date; count: bigint; revenue: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count, COALESCE(SUM("total"), 0)::bigint AS revenue
      FROM "Order"
      WHERE "paymentStatus" = 'SUCCESS' AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1
    `,
  ]);

  const viewMap = new Map(views.map((row) => [dayKey(new Date(row.day)), Number(row.count)]));
  const orderMap = new Map(
    orders.map((row) => [dayKey(new Date(row.day)), { count: Number(row.count), revenue: Number(row.revenue) }]),
  );

  const series: DailyPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(since);
    date.setDate(since.getDate() + i);
    const key = dayKey(date);
    const order = orderMap.get(key);
    series.push({
      date: key,
      label: formatDate(date),
      views: viewMap.get(key) ?? 0,
      orders: order?.count ?? 0,
      revenue: order?.revenue ?? 0,
    });
  }
  return series;
}

export async function getTopPages(days = 30, limit = 8) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await prisma.pageView.groupBy({
    by: ["path"],
    where: { createdAt: { gte: since } },
    _count: { path: true },
    orderBy: { _count: { path: "desc" } },
    take: limit,
  });
  return rows.map((row) => ({ path: row.path, views: row._count.path }));
}

export async function getTopReferrers(days = 30, limit = 8) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await prisma.pageView.groupBy({
    by: ["referrer"],
    where: { createdAt: { gte: since }, referrer: { not: null } },
    _count: { referrer: true },
    orderBy: { _count: { referrer: "desc" } },
    take: limit,
  });
  return rows
    .filter((row) => !!row.referrer)
    .map((row) => {
      let source = row.referrer as string;
      try {
        source = new URL(source).hostname.replace(/^www\./, "");
      } catch {
        // keep raw value
      }
      return { source, visits: row._count.referrer };
    });
}

export async function getRecentPageViews(limit = 12) {
  return prisma.pageView.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export async function getUniqueVisitors(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT "sessionId")::bigint AS count FROM "PageView" WHERE "createdAt" >= ${since}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function getOverview() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [
    revenueAgg,
    paidOrders,
    totalOrders,
    customers,
    products,
    pendingOrders,
    lowStock,
    viewsToday,
    viewsWeek,
    uniqueVisitors,
    paidLast30,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "SUCCESS" }, _sum: { total: true } }),
    prisma.order.count({ where: { paymentStatus: "SUCCESS" } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "PAID", "PROCESSING"] } } }),
    prisma.product.count({ where: { stock: { lte: 10 }, isActive: true } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.pageView.count({ where: { createdAt: { gte: weekAgo } } }),
    getUniqueVisitors(30),
    prisma.order.count({ where: { paymentStatus: "SUCCESS", createdAt: { gte: monthAgo } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: true },
    }),
    prisma.$queryRaw<Array<{ name: string; quantity: bigint; revenue: bigint }>>`
      SELECT oi."name" AS name, SUM(oi."quantity")::bigint AS quantity, SUM(oi."price" * oi."quantity")::bigint AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      WHERE o."paymentStatus" = 'SUCCESS'
      GROUP BY oi."name"
      ORDER BY revenue DESC
      LIMIT 5
    `,
  ]);

  const revenue = revenueAgg._sum.total ?? 0;
  const conversion = uniqueVisitors > 0 ? (paidLast30 / uniqueVisitors) * 100 : 0;

  return {
    revenue,
    paidOrders,
    totalOrders,
    customers,
    products,
    pendingOrders,
    lowStock,
    viewsToday,
    viewsWeek,
    uniqueVisitors,
    conversion,
    averageOrderValue: paidOrders > 0 ? Math.round(revenue / paidOrders) : 0,
    recentOrders,
    topProducts: topProducts.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity),
      revenue: Number(row.revenue),
    })),
  };
}

export async function getAnalyticsDashboard(days = 30) {
  const [series, topPages, referrers, recentVisits, uniqueVisitors, paidOrders] = await Promise.all([
    getDailySeries(days),
    getTopPages(days),
    getTopReferrers(days),
    getRecentPageViews(14),
    getUniqueVisitors(days),
    prisma.order.count({ where: { paymentStatus: "SUCCESS", createdAt: { gte: new Date(Date.now() - days * 86400000) } } }),
  ]);

  const totalViews = series.reduce((sum, point) => sum + point.views, 0);
  return {
    series,
    topPages,
    referrers,
    recentVisits,
    uniqueVisitors,
    paidOrders,
    totalViews,
    conversion: uniqueVisitors > 0 ? (paidOrders / uniqueVisitors) * 100 : 0,
  };
}
