import { PrismaClient } from "@prisma/client";

// Singleton para evitar múltiplas instâncias do PrismaClient durante o hot-reload do Next.js
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
