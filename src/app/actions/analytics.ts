"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardAnalytics(restaurantId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOf30Days = new Date(now);
  startOf30Days.setDate(now.getDate() - 30);

  // KPIs
  const todayBills = await prisma.bill.findMany({
    where: {
      restaurantId,
      createdAt: { gte: startOfToday },
      paymentStatus: 'PAID'
    }
  });
  const todayRevenue = todayBills.reduce((acc, bill) => acc + bill.grandTotal, 0);

  const todayOrders = await prisma.order.count({
    where: { restaurantId, createdAt: { gte: startOfToday } }
  });

  const activeTables = await prisma.table.count({
    where: { restaurantId, status: { not: 'AVAILABLE' } }
  });

  const activeSessions = await prisma.diningSession.count({
    where: { restaurantId, status: { not: 'COMPLETED' } }
  });

  const pendingOrders = await prisma.order.count({
    where: { restaurantId, status: 'PENDING' }
  });

  const pendingBillRequests = await prisma.billRequest.count({
    where: { restaurantId, status: 'PENDING' }
  });

  const totalMenuItems = await prisma.menuItem.count({
    where: { restaurantId, isDeleted: false }
  });

  // Revenue Analytics (Last 30 Days trend)
  const last30DaysBills = await prisma.bill.findMany({
    where: { restaurantId, createdAt: { gte: startOf30Days }, paymentStatus: 'PAID' }
  });

  const revenueByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    revenueByDay[dateStr] = 0;
  }
  
  let revenueLast7Days = 0;
  let revenueLast30Days = 0;
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  last30DaysBills.forEach(bill => {
    revenueLast30Days += bill.grandTotal;
    if (bill.createdAt >= sevenDaysAgo) {
      revenueLast7Days += bill.grandTotal;
    }
    const dateStr = bill.createdAt.toISOString().split('T')[0];
    if (revenueByDay[dateStr] !== undefined) {
      revenueByDay[dateStr] += bill.grandTotal;
    }
  });

  const dailyRevenueTrend = Object.entries(revenueByDay).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));

  const monthlyBills = await prisma.bill.findMany({
    where: { restaurantId, createdAt: { gte: startOfMonth }, paymentStatus: 'PAID' }
  });
  const monthlyRevenue = monthlyBills.reduce((acc, b) => acc + b.grandTotal, 0);

  // Order Analytics
  const ordersThisWeek = await prisma.order.count({
    where: { restaurantId, createdAt: { gte: startOfWeek } }
  });
  const ordersThisMonth = await prisma.order.count({
    where: { restaurantId, createdAt: { gte: startOfMonth } }
  });
  
  const allOrders = await prisma.order.groupBy({
    by: ['status'],
    where: { restaurantId },
    _count: { id: true }
  });
  const orderCountsByStatus = allOrders.reduce((acc, curr) => {
    acc[curr.status] = curr._count.id;
    return acc;
  }, {} as Record<string, number>);

  // Top Selling Items (all time non-cancelled orders to get meaningful volume)
  // To avoid huge memory use, ideally we group, but Prisma doesn't support grouping over relations easily in a single query.
  // Instead, let's fetch OrderItems from completed orders in the last 30 days.
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { restaurantId, status: 'COMPLETED', createdAt: { gte: startOf30Days } } }
  });
  const itemMap: Record<string, { quantity: number, revenue: number }> = {};
  for (const item of orderItems) {
    if (!itemMap[item.name]) {
      itemMap[item.name] = { quantity: 0, revenue: 0 };
    }
    itemMap[item.name].quantity += item.quantity;
    itemMap[item.name].revenue += item.quantity * item.price;
  }
  const topSellingItems = Object.entries(itemMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Table Analytics
  const tables = await prisma.table.groupBy({
    by: ['status'],
    where: { restaurantId, isActive: true },
    _count: { id: true }
  });
  const tableCounts = tables.reduce((acc, curr) => {
    acc[curr.status] = curr._count.id;
    return acc;
  }, {} as Record<string, number>);

  // Kitchen Analytics
  const kitchenAnalytics = {
    pending: orderCountsByStatus['PENDING'] || 0,
    preparing: orderCountsByStatus['PREPARING'] || 0,
    ready: orderCountsByStatus['READY'] || 0,
    served: orderCountsByStatus['SERVED'] || 0,
  };

  // Recent Orders
  const recentOrdersList = await prisma.order.findMany({
    where: { restaurantId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { session: { include: { table: true } } }
  });

  // Recent Activity Feed
  const recentBills = await prisma.bill.findMany({
    where: { restaurantId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { session: { include: { table: true } } }
  });

  const recentSessions = await prisma.diningSession.findMany({
    where: { restaurantId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { table: true }
  });

  const recentWaiterCalls = await prisma.waiterCall.findMany({
    where: { restaurantId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { table: true }
  });

  const activityFeed: any[] = [];
  recentOrdersList.forEach(o => activityFeed.push({
    id: `order-${o.id}`,
    type: 'ORDER',
    title: `New Order #${o.orderNumber}`,
    time: o.createdAt,
    status: o.status,
    table: o.session.table.name,
    total: o.totalAmount
  }));
  recentBills.forEach(b => activityFeed.push({
    id: `bill-${b.id}`,
    type: 'BILL',
    title: b.paymentStatus === 'PAID' ? `Bill ${b.billNumber} Paid` : `Bill ${b.billNumber} Generated`,
    time: b.createdAt,
    status: b.paymentStatus,
    table: b.session.table.name,
    total: b.grandTotal
  }));
  recentSessions.forEach(s => activityFeed.push({
    id: `session-${s.id}`,
    type: 'SESSION',
    title: s.status === 'COMPLETED' ? 'Session Closed' : 'Session Started',
    time: s.createdAt,
    status: s.status,
    table: s.table.name
  }));
  recentWaiterCalls.forEach(w => activityFeed.push({
    id: `waiter-${w.id}`,
    type: 'WAITER',
    title: 'Waiter Called',
    time: w.createdAt,
    status: w.status,
    table: w.table.name
  }));

  activityFeed.sort((a, b) => b.time.getTime() - a.time.getTime());
  const finalActivityFeed = activityFeed.slice(0, 15);

  return {
    kpis: {
      todayRevenue,
      todayOrders,
      activeTables,
      activeSessions,
      pendingOrders,
      pendingBillRequests,
      totalMenuItems
    },
    revenueAnalytics: {
      revenueLast7Days,
      revenueLast30Days,
      monthlyRevenue,
      dailyRevenueTrend
    },
    orderAnalytics: {
      ordersToday: todayOrders,
      ordersThisWeek,
      ordersThisMonth,
      completed: orderCountsByStatus['COMPLETED'] || 0,
      cancelled: orderCountsByStatus['CANCELLED'] || 0,
      pendingKitchen: (orderCountsByStatus['PENDING'] || 0) + (orderCountsByStatus['PREPARING'] || 0)
    },
    topSellingItems,
    tableAnalytics: {
      occupied: tableCounts['OCCUPIED'] || 0,
      available: tableCounts['AVAILABLE'] || 0,
      waitingForBill: tableCounts['BILL_REQUESTED'] || 0
    },
    kitchenAnalytics,
    recentOrders: recentOrdersList.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      table: o.session.table.name,
      total: o.totalAmount,
      status: o.status,
      time: o.createdAt
    })),
    recentActivity: finalActivityFeed
  };
}
