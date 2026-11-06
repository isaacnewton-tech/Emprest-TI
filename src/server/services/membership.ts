import type { PrismaClient } from "@prisma/client";

export function createTenantResolver(database: () => PrismaClient) {
  const resolved = new Map<string, Promise<{ tenantId: string; role: "colaborador" | "operacoes" } | null>>();
  return (userId: string) => {
    const prior = resolved.get(userId);
    if (prior) return prior;
    const pending = database().membership.findMany({
      where: { userId },
      select: { tenantId: true, role: true },
      take: 2,
    }).then((links) => links.length === 1 ? links[0] : null);
    resolved.set(userId, pending);
    return pending;
  };
}
