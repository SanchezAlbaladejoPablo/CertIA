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
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Profiles: Datos profesionales del instalador autorizado
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Datos profesionales
  fullName: varchar("fullName", { length: 255 }),
  companyName: varchar("companyName", { length: 255 }),
  cifNif: varchar("cifNif", { length: 20 }),
  
  // Datos instalador autorizado
  installerNumber: varchar("installerNumber", { length: 50 }),
  installerCategory: varchar("installerCategory", { length: 50 }),
  autonomousCommunity: varchar("autonomousCommunity", { length: 50 }),
  
  // Contacto
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  postalCode: varchar("postalCode", { length: 10 }),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  
  // Avatar
  avatarUrl: text("avatarUrl"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

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
  
  // Estado
  status: mysqlEnum("status", ["draft", "issued", "signed", "archived"]).default("draft").notNull(),
  certificateNumber: varchar("certificateNumber", { length: 50 }),
  
  // Datos instalación
  installationType: varchar("installationType", { length: 100 }),
  supplyVoltage: int("supplyVoltage"),
  installedPower: int("installedPower"),
  phases: int("phases"),
  
  // Derivación Individual
  diLength: decimal("diLength", { precision: 8, scale: 2 }),
  diCableSection: decimal("diCableSection", { precision: 8, scale: 2 }),
  diCableMaterial: varchar("diCableMaterial", { length: 10 }),
  diCableInsulation: varchar("diCableInsulation", { length: 50 }),
  
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
  
  // Descripción
  loadDescription: text("loadDescription"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Circuit = typeof circuits.$inferSelect;
export type InsertCircuit = typeof circuits.$inferInsert;