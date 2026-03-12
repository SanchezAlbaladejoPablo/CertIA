import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Unique user identifier — UUID generated on register (previously Manus openId). */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Profiles: Datos de la empresa instaladora
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),

  // Datos empresa
  companyName: varchar("companyName", { length: 255 }),
  cifNif: varchar("cifNif", { length: 20 }),
  email: varchar("email", { length: 320 }),

  // Autorización empresa
  companyAuthNumber: varchar("companyAuthNumber", { length: 50 }),
  autonomousCommunity: varchar("autonomousCommunity", { length: 50 }),

  // Contacto
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  postalCode: varchar("postalCode", { length: 10 }),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),

  // Logo empresa
  avatarUrl: text("avatarUrl"),

  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

// Installers: Instaladores autorizados de la empresa
export const installers = mysqlTable("installers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  // Datos personales
  fullName: varchar("fullName", { length: 255 }).notNull(),
  nif: varchar("nif", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),

  // Datos profesionales
  installerNumber: varchar("installerNumber", { length: 50 }),
  installerCategory: varchar("installerCategory", { length: 50 }),

  // Firma digital (URL a imagen de la firma)
  signatureUrl: text("signatureUrl"),

  // Estado
  isActive: boolean("isActive").default(true).notNull(),

  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Installer = typeof installers.$inferSelect;
export type InsertInstaller = typeof installers.$inferInsert;

// Subscriptions: Planes de suscripción
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  
  // Plan
  plan: mysqlEnum("plan", ["free", "pro", "enterprise"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "canceled", "past_due"]).default("active").notNull(),
  
  // Billing period
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  
  // Limits
  certificatesLimit: int("certificatesLimit").default(1),
  certificatesUsed: int("certificatesUsed").default(0),
  
  // Metadata
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  canceledAt: timestamp("canceledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Clients: Clientes (personas físicas y empresas)
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Identificación
  type: mysqlEnum("type", ["person", "company"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  dniNif: varchar("dniNif", { length: 20 }),
  
  // Contacto
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  
  // Dirección
  address: text("address"),
  postalCode: varchar("postalCode", { length: 10 }),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  
  // Notas
  notes: text("notes"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// Installations: Instalaciones asociadas a clientes
export const installations = mysqlTable("installations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull(),
  
  // Identificación
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }),
  
  // Ubicación
  address: text("address"),
  postalCode: varchar("postalCode", { length: 10 }),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  
  // Datos catastrales
  cadastralReference: varchar("cadastralReference", { length: 50 }),
  cups: varchar("cups", { length: 50 }),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Installation = typeof installations.$inferSelect;
export type InsertInstallation = typeof installations.$inferInsert;

// Certificates: Certificados de instalación eléctrica
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull(),
  installationId: int("installationId").notNull(),
  installerId: int("installerId"),
  
  // Estado
  status: mysqlEnum("status", ["draft", "issued", "submitted", "registered", "signed", "archived"]).default("draft").notNull(),
  certificateNumber: varchar("certificateNumber", { length: 50 }),
  expedienteNumber: varchar("expedienteNumber", { length: 50 }),
  submittedAt: timestamp("submittedAt"),
  
  // Datos instalación
  installationType: varchar("installationType", { length: 100 }),
  locationCategory: varchar("locationCategory", { length: 50 }),
  electrificationGrade: varchar("electrificationGrade", { length: 20 }),
  supplyVoltage: int("supplyVoltage"),
  installedPower: int("installedPower"),
  maxAdmissiblePower: int("maxAdmissiblePower"),
  serviceCommissionDate: timestamp("serviceCommissionDate"),
  lightingPointsCount: int("lightingPointsCount"),
  outletsCount: int("outletsCount"),
  phases: int("phases"),
  
  // Derivación Individual
  diLength: decimal("diLength", { precision: 8, scale: 2 }),
  diCableSection: decimal("diCableSection", { precision: 8, scale: 2 }),
  diCableMaterial: varchar("diCableMaterial", { length: 10 }),
  diCableInsulation: varchar("diCableInsulation", { length: 50 }),

  // Condiciones de instalación (factores de corrección ITC-BT-19)
  ambientTemp: int("ambientTemp"),
  installMethod: varchar("installMethod", { length: 50 }),
  groupedCables: int("groupedCables"),
  
  // Sistema de puesta a tierra
  groundingSystem: varchar("groundingSystem", { length: 10 }),

  // Cuadro
  boardLocation: varchar("boardLocation", { length: 255 }),
  igaRating: int("igaRating"),
  idSensitivity: int("idSensitivity"),
  overvoltageProtection: boolean("overvoltageProtection"),
  earthResistance: decimal("earthResistance", { precision: 8, scale: 2 }),
  
  // Mediciones
  insulationResistance: decimal("insulationResistance", { precision: 8, scale: 2 }),
  continuityContinuity: decimal("continuityContinuity", { precision: 8, scale: 2 }),
  rcdTestCurrent: int("rcdTestCurrent"),
  rcdTestTime: int("rcdTestTime"),
  observations: text("observations"),
  
  // Diagrama y PDF
  mermaidDiagram: text("mermaidDiagram"),
  pdfUrl: text("pdfUrl"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// Templates: Plantillas reutilizables de certificado
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // JSON del formData del wizard (sin clientId/installationId)
  formData: json("formData").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

// Circuits: Circuitos de un certificado
export const circuits = mysqlTable("circuits", {
  id: int("id").autoincrement().primaryKey(),
  certificateId: int("certificateId").notNull(),
  
  // Identificación
  circuitNumber: varchar("circuitNumber", { length: 20 }).notNull(),
  circuitName: varchar("circuitName", { length: 255 }).notNull(),
  circuitType: varchar("circuitType", { length: 100 }),
  
  // Datos técnicos
  installedPower: int("installedPower"),
  length: decimal("length", { precision: 8, scale: 2 }),
  cableSection: decimal("cableSection", { precision: 8, scale: 2 }),
  cableMaterial: varchar("cableMaterial", { length: 10 }),
  cableInsulation: varchar("cableInsulation", { length: 50 }),
  cableCores: int("cableCores"),
  
  // Protecciones
  mcbRating: int("mcbRating"),
  mcbCurve: varchar("mcbCurve", { length: 10 }),
  rcdRequired: boolean("rcdRequired"),
  rcdRating: int("rcdRating"),
  
  // Cálculos por circuito (resultados de cálculo REBT)
  installMethod: varchar("installMethod", { length: 50 }),
  voltageDrop: decimal("voltageDrop", { precision: 6, scale: 2 }),
  designCurrent: decimal("designCurrent", { precision: 8, scale: 2 }),

  // Descripción
  loadDescription: text("loadDescription"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Circuit = typeof circuits.$inferSelect;
export type InsertCircuit = typeof circuits.$inferInsert;

// Inspections: Revisiones periódicas (ITC-BT-05) — FASE 6.3
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  certificateId: int("certificateId").notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  completedDate: timestamp("completedDate"),
  result: mysqlEnum("result", ["pending", "passed", "failed", "deferred"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

// ClientTokens: Tokens de acceso al portal del cliente — FASE 6.4
export const clientTokens = mysqlTable("clientTokens", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientToken = typeof clientTokens.$inferSelect;
export type InsertClientToken = typeof clientTokens.$inferInsert;

// SignatureAuditTrail: Evidencias legales de cada acto de firma — INMUTABLE (no UPDATE/DELETE)
export const signatureAuditTrail = mysqlTable("signatureAuditTrail", {
  id: int("id").autoincrement().primaryKey(),
  certificateId: int("certificateId").notNull(),
  userId: int("userId").notNull(),

  // Identidad del firmante (extraída del certificado X.509)
  signerName: varchar("signerName", { length: 255 }).notNull(),
  signerNif: varchar("signerNif", { length: 20 }),
  signerCertSerial: varchar("signerCertSerial", { length: 100 }),
  signerCertIssuer: text("signerCertIssuer"),
  signerCertNotAfter: timestamp("signerCertNotAfter"),

  // Hashes del documento
  documentHash: varchar("documentHash", { length: 64 }).notNull(),      // SHA-256 PDF original
  signedDocumentHash: varchar("signedDocumentHash", { length: 64 }),    // SHA-256 PDF firmado

  // Sello de tiempo TSA (RFC 3161)
  timestampToken: text("timestampToken"),    // TimeStampToken en Base64
  timestampTime: timestamp("timestampTime"), // Hora certificada por la TSA
  tsaUrl: varchar("tsaUrl", { length: 255 }),

  // Red y cliente
  clientIp: varchar("clientIp", { length: 45 }).notNull(),
  userAgent: text("userAgent"),

  // Certificado completo del firmante (clave pública — nunca la privada)
  rawCertificateB64: text("rawCertificateB64"),

  // Metadatos
  signedAt: timestamp("signedAt").defaultNow().notNull(),
});

export type SignatureAuditTrail = typeof signatureAuditTrail.$inferSelect;
export type InsertSignatureAuditTrail = typeof signatureAuditTrail.$inferInsert;