import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export class DashboardRepository {
  public async getSummary(filters: { ownerId?: string } = {}) {
    const whereOrders: Prisma.OrderWhereInput = {
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
    } as any;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, revenueAgg, pendingOrders, preparingOrders, readyForPickup, cancelledOrders] = await prisma.$transaction([
      prisma.order.count({ where: { ...whereOrders, createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { ...whereOrders, status: { not: "CANCELLED" } }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { ...whereOrders, status: "PENDING" } }),
      prisma.order.count({ where: { ...whereOrders, status: "PREPARING" } }),
      prisma.order.count({ where: { ...whereOrders, status: "READY_FOR_PICKUP" } }),
      prisma.order.count({ where: { ...whereOrders, status: "CANCELLED" } }),
    ]);

    const averageRatingAgg = await prisma.review.aggregate({ where: filters.ownerId ? { restaurant: { ownerId: filters.ownerId } } : {}, _avg: { rating: true } });

    const walletAgg = await prisma.restaurantWallet.aggregate({ where: filters.ownerId ? { restaurant: { ownerId: filters.ownerId } } : {}, _sum: { availableBalance: true } });

    return {
      todayOrders,
      revenue: Number(revenueAgg._sum.totalAmount ?? 0),
      pendingOrders,
      preparingOrders,
      readyForPickup,
      cancelledOrders,
      averageRating: Number((averageRatingAgg._avg.rating ?? 0).toFixed(2)),
      walletBalance: Number(walletAgg._sum.availableBalance ?? 0),
    };
  }

  public async getCharts(filters: { ownerId?: string } = {}, days = 7) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));

    const whereOrders: Prisma.OrderWhereInput = {
      createdAt: { gte: start },
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
      status: { not: "CANCELLED" },
    } as any;

    const orders = await prisma.order.findMany({ where: whereOrders, select: { createdAt: true, totalAmount: true } });

    const revenueTrend: number[] = [];
    const ordersTrend: number[] = [];
    const dateLabels: string[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      dateLabels.push(iso);
      let rev = 0;
      let cnt = 0;
      for (const o of orders) {
        if (o.createdAt.toISOString().slice(0, 10) === iso) {
          rev += Number(o.totalAmount.toString());
          cnt += 1;
        }
      }
      revenueTrend.push(rev);
      ordersTrend.push(cnt);
    }

    return { revenueTrend, ordersTrend, dateLabels };
  }
}

export const dashboardRepository = new DashboardRepository();
