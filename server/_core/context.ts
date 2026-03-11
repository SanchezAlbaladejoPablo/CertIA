import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Demo mode: usuario fijo sin autenticación
const DEMO_USER: User = {
  id: 1,
  openId: "demo-user-001",
  name: "Instalador Demo",
  email: "demo@certia.io",
  loginMethod: "demo",
  role: "user",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
    user: DEMO_USER,
  };
}
