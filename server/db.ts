import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, profiles, installers, subscriptions, clients, installations, certificates, circuits, templates, inspections, clientTokens, signatureAuditTrail, InsertProfile, InsertInstaller, InsertSubscription, InsertClient, InsertInstallation, InsertCertificate, InsertCircuit, InsertTemplate, InsertInspection, InsertClientToken, InsertSignatureAuditTrail } from "../drizzle/schema";
import { ENV } from './_core/env';
import * as mock from './_core/mockStore';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: true },
      });
      _db = drizzle(pool) as any;
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function setUserPasswordHash(openId: string, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash }).where(eq(users.openId, openId));
}

// Profile queries
export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetProfileByUserId(userId) as any;
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertProfile(profile: InsertProfile) {
  const db = await getDb();
  if (!db) {
    mock.mockUpsertProfile(profile as any);
    return;
  }
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
  if (!db) return mock.mockGetClientsByUserId(userId);
  return await db.select().from(clients).where(eq(clients.userId, userId));
}

export async function getClientById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetClientById(id, userId);
  const result = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) return mock.mockCreateClient(client as any);
  const result = await db.insert(clients).values(client);
  return result;
}

export async function updateClient(id: number, userId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) { mock.mockUpdateClient(id, userId, data as any); return; }
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
  if (!db) { mock.mockDeleteClient(id, userId); return; }
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

// Installation queries
export async function getInstallationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetInstallationsByUserId(userId);
  return await db.select().from(installations).where(eq(installations.userId, userId));
}

export async function getInstallationById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetInstallationById(id, userId);
  const result = await db.select().from(installations).where(and(eq(installations.id, id), eq(installations.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createInstallation(installation: InsertInstallation) {
  const db = await getDb();
  if (!db) return mock.mockCreateInstallation(installation as any);
  const result = await db.insert(installations).values(installation);
  return result;
}

export async function updateInstallation(id: number, userId: number, data: Partial<InsertInstallation>) {
  const db = await getDb();
  if (!db) { mock.mockUpdateInstallation(id, userId, data as any); return; }
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
  if (!db) return mock.mockGetCertificatesByUserId(userId);
  return await db.select().from(certificates).where(eq(certificates.userId, userId));
}

export async function getCertificateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetCertificateById(id, userId);
  const result = await db.select().from(certificates).where(and(eq(certificates.id, id), eq(certificates.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Para portal: obtiene un certificado por id si pertenece al clientId (sin exigir userId). */
export async function getCertificateByIdAndClientId(certificateId: number, clientId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetCertificateByIdAndClientId(certificateId, clientId);
  const result = await db.select().from(certificates).where(and(eq(certificates.id, certificateId), eq(certificates.clientId, clientId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCertificate(certificate: InsertCertificate) {
  const db = await getDb();
  if (!db) return mock.mockCreateCertificate(certificate as any);
  if (!certificate.certificateNumber) {
    const year = new Date().getFullYear();
    const existing = await getCertificatesByUserId(certificate.userId);
    const yearCerts = existing.filter(c => new Date(c.createdAt).getFullYear() === year);
    const num = String(yearCerts.length + 1).padStart(4, '0');
    certificate.certificateNumber = `CIE-${year}-${num}`;
  }
  const result = await db.insert(certificates).values(certificate);
  return result;
}

export async function updateCertificate(id: number, userId: number, data: Partial<InsertCertificate>) {
  const db = await getDb();
  if (!db) { mock.mockUpdateCertificate(id, userId, data as any); return; }
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
  if (!db) { mock.mockDeleteCertificate(id, userId); return; }
  await db.delete(certificates).where(and(eq(certificates.id, id), eq(certificates.userId, userId)));
}

export async function duplicateCertificate(id: number, userId: number) {
  const db = await getDb();
  if (!db) return mock.mockDuplicateCertificate(id, userId);
  const original = await getCertificateById(id, userId);
  if (!original) throw new Error("Certificate not found");
  const { id: _id, certificateNumber: _num, createdAt: _ca, updatedAt: _ua, serviceCommissionDate, ...rest } = original;
  return await db.insert(certificates).values({
    ...rest,
    status: 'draft',
    serviceCommissionDate: serviceCommissionDate ? new Date(serviceCommissionDate) : null,
  });
}

export async function getCertificateStats(userId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetCertificateStats(userId);
  const certs = await getCertificatesByUserId(userId);
  return {
    total: certs.length,
    draft: certs.filter(c => c.status === 'draft').length,
    issued: certs.filter(c => c.status === 'issued').length,
    signed: certs.filter(c => c.status === 'signed').length,
    archived: certs.filter(c => c.status === 'archived').length,
  };
}

export async function updateCertificateStatus(
  id: number,
  userId: number,
  status: 'draft' | 'issued' | 'submitted' | 'registered' | 'signed' | 'archived',
  extra?: { expedienteNumber?: string; submittedAt?: Date }
) {
  const db = await getDb();
  if (!db) { mock.mockUpdateCertificateStatus(id, userId, status, extra); return; }
  await db.update(certificates)
    .set({ status, updatedAt: new Date(), ...extra })
    .where(and(eq(certificates.id, id), eq(certificates.userId, userId)));
}

export async function updateCertificatePdfUrl(id: number, userId: number, pdfUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(certificates)
    .set({ pdfUrl, updatedAt: new Date() })
    .where(and(eq(certificates.id, id), eq(certificates.userId, userId)));
}

// Circuit queries
export async function getCircuitsByCertificateId(certificateId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetCircuitsByCertificateId(certificateId);
  return await db.select().from(circuits).where(eq(circuits.certificateId, certificateId));
}

export async function createCircuit(circuit: InsertCircuit) {
  const db = await getDb();
  if (!db) return mock.mockCreateCircuit(circuit as any);
  const result = await db.insert(circuits).values(circuit);
  return result;
}

export async function updateCircuit(id: number, data: Partial<InsertCircuit>) {
  const db = await getDb();
  if (!db) { mock.mockUpdateCircuit(id, data as any); return; }
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
  if (!db) { mock.mockDeleteCircuit(id); return; }
  await db.delete(circuits).where(eq(circuits.id, id));
}

// Subscription plan helpers (mock-only for demo mode)
export async function getUserPlanInfo(userId: number) {
  const db = await getDb();
  if (!db) return { plan: 'free', status: 'active', certificatesLimit: 999, certificatesUsed: 0 };
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : { plan: 'free', status: 'active', certificatesLimit: 999, certificatesUsed: 0 };
}

export async function canUserCreateCertificate(userId: number) {
  const db = await getDb();
  if (!db) return true;
  const info = await getUserPlanInfo(userId);
  const limit = (info as any).certificatesLimit ?? 999;
  const used = (info as any).certificatesUsed ?? 0;
  return used < limit;
}

export async function getAvailableCertificates(userId: number) {
  const db = await getDb();
  if (!db) return 999;
  const info = await getUserPlanInfo(userId);
  const limit = (info as any).certificatesLimit ?? 999;
  const used = (info as any).certificatesUsed ?? 0;
  return Math.max(0, limit - used);
}

// Template queries
export async function getTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetTemplatesByUserId(userId);
  return await db.select().from(templates).where(eq(templates.userId, userId));
}

export async function getTemplateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetTemplateById(id, userId);
  const result = await db.select().from(templates).where(and(eq(templates.id, id), eq(templates.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTemplate(template: InsertTemplate) {
  const db = await getDb();
  if (!db) return mock.mockCreateTemplate(template as any);
  const result = await db.insert(templates).values(template);
  return result;
}

export async function updateTemplate(id: number, userId: number, data: Partial<InsertTemplate>) {
  const db = await getDb();
  if (!db) { mock.mockUpdateTemplate(id, userId, data as any); return; }
  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value;
  });
  await db.insert(templates).values({ id, userId, name: '', formData: {}, ...data }).onDuplicateKeyUpdate({ set: updateData });
}

export async function deleteTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) { mock.mockDeleteTemplate(id, userId); return; }
  await db.delete(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
}

export async function incrementCertificateUsage(userId: number) {
  const db = await getDb();
  if (!db) return; // demo mode: no limit tracking needed
  const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const currentUsed = sub.length > 0 ? (sub[0].certificatesUsed ?? 0) : 0;
  await db.update(subscriptions)
    .set({ certificatesUsed: currentUsed + 1 })
    .where(eq(subscriptions.userId, userId));
}

// Inspection queries (FASE 6.3)
export async function getInspectionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return mock.mockGetInspectionsByUserId(userId);
  return await db.select().from(inspections).where(eq(inspections.userId, userId));
}

export async function createInspection(inspection: InsertInspection) {
  const db = await getDb();
  if (!db) return mock.mockCreateInspection(inspection as any);
  const result = await db.insert(inspections).values(inspection);
  return result;
}

export async function updateInspection(id: number, userId: number, data: Partial<InsertInspection>) {
  const db = await getDb();
  if (!db) { mock.mockUpdateInspection(id, userId, data as any); return; }
  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value;
  });
  await db.update(inspections).set(updateData).where(and(eq(inspections.id, id), eq(inspections.userId, userId)));
}

export async function deleteInspection(id: number, userId: number) {
  const db = await getDb();
  if (!db) { mock.mockDeleteInspection(id, userId); return; }
  await db.delete(inspections).where(and(eq(inspections.id, id), eq(inspections.userId, userId)));
}

// ClientToken queries (FASE 6.4)
export async function createClientToken(token: InsertClientToken) {
  const db = await getDb();
  if (!db) return mock.mockCreateClientToken(token as any);
  const result = await db.insert(clientTokens).values(token);
  return result;
}

export async function getClientTokenByToken(token: string) {
  const db = await getDb();
  if (!db) return mock.mockGetClientTokenByToken(token);
  const result = await db.select().from(clientTokens).where(eq(clientTokens.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// Installer queries
export async function getInstallersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(installers).where(eq(installers.userId, userId));
}

export async function getInstallerById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(installers).where(and(eq(installers.id, id), eq(installers.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createInstaller(installer: InsertInstaller) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(installers).values(installer);
  return result;
}

export async function updateInstaller(id: number, userId: number, data: Partial<InsertInstaller>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value;
  });
  await db.update(installers).set(updateData).where(and(eq(installers.id, id), eq(installers.userId, userId)));
}

export async function deleteInstaller(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(installers).where(and(eq(installers.id, id), eq(installers.userId, userId)));
}

// SignatureAuditTrail — INMUTABLE: solo INSERT y SELECT
export async function createSignatureAuditTrail(record: InsertSignatureAuditTrail) {
  const db = await getDb();
  if (!db) return; // Sin BD, silencio — no hay mock para audit trail
  await db.insert(signatureAuditTrail).values(record);
}

export async function getSignatureAuditTrailByCertificateId(certificateId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(signatureAuditTrail)
    .where(and(eq(signatureAuditTrail.certificateId, certificateId), eq(signatureAuditTrail.userId, userId)))
    .orderBy(signatureAuditTrail.signedAt);
}
