import { PrismaClient } from "@prisma/client";

import { initialClients } from "@/lib/clients";
import { ServiceUnavailableError } from "@/server/errors";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new ServiceUnavailableError("DATABASE_URL is not configured.");
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

let clientsReady: Promise<void> | null = null;

export function ensureClients() {
  if (!clientsReady) {
    const prisma = getPrisma();
    clientsReady = (async () => {
      for (const client of initialClients) {
        await prisma.client.upsert({
          where: { id: client.id },
          update: {},
          create: {
            id: client.id,
            name: client.name,
            websiteUrl: client.websiteUrl,
            domain: client.domain,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone,
            auditStatus: client.auditStatus,
            createdAt: new Date(`${client.createdAt}T00:00:00.000Z`),
          },
        });
      }
    })().catch((error) => {
      clientsReady = null;
      throw error;
    });
  }
  return clientsReady;
}
