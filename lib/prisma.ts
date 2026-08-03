import type { PrismaClient } from '@prisma/client';

// Dynamic safe loader for PrismaClient to prevent top-level serverless module loading exceptions in cloud deployments
let prismaClientInstance: any = null;

function getPrismaClient(): any {
  if (prismaClientInstance !== null) return prismaClientInstance;
  try {
    const { PrismaClient } = require('@prisma/client');
    prismaClientInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    return prismaClientInstance;
  } catch (error) {
    console.warn('Prisma engine unavailable or unnecessary on serverless cloud runtime (using Supabase Postgres):', error?.toString());
    // Return a completely silent fallback object for serverless environments
    prismaClientInstance = new Proxy({}, {
      get(_target, prop) {
        if (prop === '$connect' || prop === '$disconnect') return async () => {};
        return () => ({
          findMany: async () => [],
          findUnique: async () => null,
          findFirst: async () => null,
          create: async (args: any) => args?.data || {},
          update: async (args: any) => args?.data || {},
          delete: async () => ({}),
          deleteMany: async () => ({ count: 0 }),
          createMany: async () => ({ count: 0 }),
          count: async () => 0,
        });
      },
    });
    return prismaClientInstance;
  }
}

export const prisma = new Proxy({}, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) return undefined;
    const value = client[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
}) as unknown as PrismaClient;



