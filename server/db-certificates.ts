/**
 * Procedimientos de base de datos para gestión de certificados
 * NOTE: This file is superseded by server/db.ts which uses the mock-fallback pattern.
 * Kept for reference but not imported by routers.ts.
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { certificates } from "../drizzle/schema";

export async function getCertificatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(certificates).where(eq(certificates.userId, userId));
}

export async function getCertificateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.id, id), eq(certificates.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCertificate(
  userId: number,
  data: Partial<typeof certificates.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(certificates).values({
    userId,
    clientId: 0,
    installationId: 0,
    status: "draft",
    ...data,
  });
}

export async function updateCertificate(
  id: number,
  userId: number,
  data: Partial<typeof certificates.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(certificates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(certificates.id, id), eq(certificates.userId, userId)));
}

export async function deleteCertificate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .delete(certificates)
    .where(and(eq(certificates.id, id), eq(certificates.userId, userId)));
}

export async function updateCertificateStatus(
  id: number,
  userId: number,
  status: "draft" | "issued" | "submitted" | "registered" | "signed" | "archived"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(certificates)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(certificates.id, id), eq(certificates.userId, userId)));
}
