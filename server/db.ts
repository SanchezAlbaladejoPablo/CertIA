import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, profiles, subscriptions, clients, installations, certificates, circuits, InsertProfile, InsertSubscription, InsertClient, InsertInstallation, InsertCertificate, InsertCircuit } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Profile queries
export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertProfile(profile: InsertProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(profiles).values(profile).onDuplicateKeyUpdate({
    set: profile,
  });
}

// Subscription queries
export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subscriptions).values(subscription);
  return result;
}

export async function updateSubscription(userId: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value;
  });
  await db.insert(subscriptions).values({ userId, plan: 'free', status: 'active', ...data }).onDuplicateKeyUpdate({
    set: updateData,
  });
}

// Client queries
export async function getClientsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clients).where(eq(clients.userId, userId));
}

export async function getClientById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(client);
  return result;
}

export async function updateClient(id: number, userId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value;
  });
  await db.insert(clients).values({ id, userId, type: 'person', name: '', ...data }).onDuplicateKeyUpdate({
    set: updateData,
  });
}

export async function deleteClient(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

// Installation queries
export async function getInstallationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(installations).where(eq(installations.userId, userId));
}

export async function getInstallationById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(installations).where(and(eq(installations.id, id), eq(installations.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createInstallation(installation: InsertInstallation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(installations).values(installation);
  return result;
}

export async function updateInstallation(id: number, userId: number, data: Partial<InsertInstallation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value;
  });
  await db.insert(installations).values({ id, userId, clientId: 0, name: '', ...data }).onDuplicateKeyUpdate({
    set: updateData,
  });
}

// Certificate queries
export async function getCertificatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(certificates).where(eq(certificates.userId, userId));
}

export async function getCertificateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(certificates).where(and(eq(certificates.id, id), eq(certificates.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCertificate(certificate: InsertCertificate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(certificates).values(certificate);
  return result;
}

export async function updateCertificate(id: number, userId: number, data: Partial<InsertCertificate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value;
  });
  await db.insert(certificates).values({ id, userId, clientId: 0, installationId: 0, status: 'draft', ...data }).onDuplicateKeyUpdate({
    set: updateData,
  });
}

export async function deleteCertificate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(certificates).where(and(eq(certificates.id, id), eq(certificates.userId, userId)));
}

// Circuit queries
export async function getCircuitsByCertificateId(certificateId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(circuits).where(eq(circuits.certificateId, certificateId));
}

export async function createCircuit(circuit: InsertCircuit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(circuits).values(circuit);
  return result;
}

export async function updateCircuit(id: number, data: Partial<InsertCircuit>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value;
  });
  await db.insert(circuits).values({ id, certificateId: 0, circuitNumber: '', circuitName: '', ...data }).onDuplicateKeyUpdate({
    set: updateData,
  });
}

export async function deleteCircuit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(circuits).where(eq(circuits.id, id));
}
