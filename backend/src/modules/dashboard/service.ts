import { Role } from "../../constants/roles.js";
import { dashboardRepository } from "./repository.js";

export class DashboardService {
  public constructor(private readonly repository = dashboardRepository) {}

  public async summary(actor?: { id: string; role: Role }) {
    const filters = actor?.role === Role.RESTAURANT_OWNER ? { ownerId: actor.id } : {};
    return this.repository.getSummary(filters);
  }

  public async charts(actor?: { id: string; role: Role }) {
    const filters = actor?.role === Role.RESTAURANT_OWNER ? { ownerId: actor.id } : {};
    return this.repository.getCharts(filters, 14);
  }
}

export const dashboardService = new DashboardService();
