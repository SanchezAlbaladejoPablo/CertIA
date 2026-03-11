/**
 * In-memory store for demo mode (no database required).
 * Data resets on server restart.
 */

let _nextId = 10;
const nextId = () => ++_nextId;
const now = () => new Date();

// ── Clients ──────────────────────────────────────────────────────────────────

export interface MockClient {
  id: number;
  userId: number;
  type: "person" | "company";
  name: string;
  dniNif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const mockClients: MockClient[] = [
  {
    id: 1,
    userId: 1,
    type: "person",
    name: "Juan García Martínez",
    dniNif: "12345678Z",
    email: "juan.garcia@ejemplo.com",
    phone: "612345678",
    address: "C/ Mayor 15, 2º A",
    postalCode: "28013",
    city: "Madrid",
    province: "Madrid",
    notes: "Cliente de prueba para demo",
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10"),
  },
];

export function mockGetClientsByUserId(userId: number): MockClient[] {
  return mockClients.filter(c => c.userId === userId);
}

export function mockGetClientById(id: number, userId: number): MockClient | undefined {
  return mockClients.find(c => c.id === id && c.userId === userId);
}

export function mockCreateClient(data: Omit<MockClient, "id" | "createdAt" | "updatedAt">): { insertId: number } {
  const client: MockClient = { ...data, id: nextId(), createdAt: now(), updatedAt: now() };
  mockClients.push(client);
  return { insertId: client.id };
}

export function mockUpdateClient(id: number, userId: number, data: Partial<MockClient>): void {
  const idx = mockClients.findIndex(c => c.id === id && c.userId === userId);
  if (idx !== -1) mockClients[idx] = { ...mockClients[idx], ...data, updatedAt: now() };
}

export function mockDeleteClient(id: number, userId: number): void {
  const idx = mockClients.findIndex(c => c.id === id && c.userId === userId);
  if (idx !== -1) mockClients.splice(idx, 1);
}

// ── Installations ─────────────────────────────────────────────────────────────

export interface MockInstallation {
  id: number;
  userId: number;
  clientId: number;
  name: string;
  type?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  cadastralReference?: string | null;
  cups?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const mockInstallations: MockInstallation[] = [
  {
    id: 1,
    userId: 1,
    clientId: 1,
    name: "Vivienda unifamiliar - C/ Mayor 15",
    type: "Vivienda unifamiliar",
    address: "C/ Mayor 15, 2º A",
    postalCode: "28013",
    city: "Madrid",
    province: "Madrid",
    cadastralReference: "1234567VK4712A0001ZX",
    cups: "ES0021000000000000AA",
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10"),
  },
];

export function mockGetInstallationsByUserId(userId: number): MockInstallation[] {
  return mockInstallations.filter(i => i.userId === userId);
}

export function mockGetInstallationById(id: number, userId: number): MockInstallation | undefined {
  return mockInstallations.find(i => i.id === id && i.userId === userId);
}

export function mockCreateInstallation(data: Omit<MockInstallation, "id" | "createdAt" | "updatedAt">): { insertId: number } {
  const inst: MockInstallation = { ...data, id: nextId(), createdAt: now(), updatedAt: now() };
  mockInstallations.push(inst);
  return { insertId: inst.id };
}

export function mockUpdateInstallation(id: number, userId: number, data: Partial<MockInstallation>): void {
  const idx = mockInstallations.findIndex(i => i.id === id && i.userId === userId);
  if (idx !== -1) mockInstallations[idx] = { ...mockInstallations[idx], ...data, updatedAt: now() };
}

// ── Certificates ──────────────────────────────────────────────────────────────

export interface MockCertificate {
  id: number;
  userId: number;
  clientId: number;
  installationId: number;
  certificateNumber?: string | null;
  installationType?: string | null;
  locationCategory?: string | null;
  electrificationGrade?: string | null;
  groundingSystem?: string | null;
  supplyVoltage?: number | null;
  installedPower?: number | null;
  maxAdmissiblePower?: number | null;
  serviceCommissionDate?: string | null;
  lightingPointsCount?: number | null;
  outletsCount?: number | null;
  phases?: number | null;
  diLength?: string | null;
  diCableSection?: string | null;
  diCableMaterial?: string | null;
  diCableInsulation?: string | null;
  ambientTemp?: number | null;
  installMethod?: string | null;
  groupedCables?: number | null;
  boardLocation?: string | null;
  igaRating?: number | null;
  idSensitivity?: number | null;
  overvoltageProtection?: boolean | null;
  earthResistance?: string | null;
  insulationResistance?: string | null;
  continuityContinuity?: string | null;
  rcdTestCurrent?: number | null;
  rcdTestTime?: number | null;
  observations?: string | null;
  mermaidDiagram?: string | null;
  pdfUrl?: string | null;
  expedienteNumber?: string | null;
  submittedAt?: Date | null;
  status: "draft" | "issued" | "submitted" | "registered" | "signed" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const mockCertificates: MockCertificate[] = [
  {
    id: 1,
    userId: 1,
    clientId: 1,
    installationId: 1,
    certificateNumber: "CIE-2026-0001",
    installationType: "Vivienda unifamiliar",
    locationCategory: "Seco",
    electrificationGrade: "Básico",
    groundingSystem: "TT",
    supplyVoltage: 230,
    installedPower: 9200,
    maxAdmissiblePower: null,
    serviceCommissionDate: null,
    lightingPointsCount: null,
    outletsCount: null,
    phases: 1,
    diLength: "15",
    diCableSection: "10",
    diCableMaterial: "Cu",
    diCableInsulation: "PVC",
    ambientTemp: 30,
    installMethod: "embedded_conduit",
    groupedCables: 1,
    boardLocation: "Hall de entrada",
    igaRating: 40,
    idSensitivity: 30,
    overvoltageProtection: false,
    earthResistance: "18.5",
    insulationResistance: "500",
    continuityContinuity: "0.8",
    rcdTestCurrent: 30,
    rcdTestTime: 40,
    observations: "Certificado de prueba para demo. Instalación conforme a ITC-BT-25.",
    mermaidDiagram: null,
    pdfUrl: null,
    status: "issued",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
];

export function mockGetCertificatesByUserId(userId: number): MockCertificate[] {
  return mockCertificates.filter(c => c.userId === userId);
}

export function mockGetCertificateById(id: number, userId: number): MockCertificate | undefined {
  return mockCertificates.find(c => c.id === id && c.userId === userId);
}

export function mockGetCertificateByIdAndClientId(id: number, clientId: number): MockCertificate | undefined {
  return mockCertificates.find(c => c.id === id && c.clientId === clientId);
}

export function mockCreateCertificate(data: Omit<MockCertificate, "id" | "createdAt" | "updatedAt">): { insertId: number } {
  let certificateNumber = data.certificateNumber;
  if (!certificateNumber) {
    const year = new Date().getFullYear();
    const yearCerts = mockCertificates.filter(c => new Date(c.createdAt).getFullYear() === year);
    const num = String(yearCerts.length + 1).padStart(4, '0');
    certificateNumber = `CIE-${year}-${num}`;
  }
  const cert: MockCertificate = { ...data, certificateNumber, id: nextId(), createdAt: now(), updatedAt: now() };
  mockCertificates.push(cert);
  return { insertId: cert.id };
}

export function mockUpdateCertificate(id: number, userId: number, data: Partial<MockCertificate>): void {
  const idx = mockCertificates.findIndex(c => c.id === id && c.userId === userId);
  if (idx !== -1) mockCertificates[idx] = { ...mockCertificates[idx], ...data, updatedAt: now() };
}

export function mockDeleteCertificate(id: number, userId: number): void {
  const idx = mockCertificates.findIndex(c => c.id === id && c.userId === userId);
  if (idx !== -1) mockCertificates.splice(idx, 1);
}

export function mockDuplicateCertificate(id: number, userId: number): { insertId: number } | null {
  const original = mockGetCertificateById(id, userId);
  if (!original) return null;
  const { id: _id, certificateNumber: _num, createdAt: _ca, updatedAt: _ua, ...rest } = original;
  return mockCreateCertificate({ ...rest, status: "draft" });
}

export function mockGetCertificateStats(userId: number) {
  const certs = mockGetCertificatesByUserId(userId);
  return {
    total: certs.length,
    draft: certs.filter(c => c.status === "draft").length,
    issued: certs.filter(c => c.status === "issued").length,
    signed: certs.filter(c => c.status === "signed").length,
    archived: certs.filter(c => c.status === "archived").length,
  };
}

export function mockUpdateCertificateStatus(id: number, userId: number, status: MockCertificate["status"], extra?: { expedienteNumber?: string; submittedAt?: Date }): void {
  mockUpdateCertificate(id, userId, { status, ...extra });
}

// ── Templates ─────────────────────────────────────────────────────────────────

export interface MockTemplate {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  formData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const mockTemplates: MockTemplate[] = [];

export function mockGetTemplatesByUserId(userId: number): MockTemplate[] {
  return mockTemplates.filter(t => t.userId === userId);
}

export function mockGetTemplateById(id: number, userId: number): MockTemplate | undefined {
  return mockTemplates.find(t => t.id === id && t.userId === userId);
}

export function mockCreateTemplate(data: Omit<MockTemplate, "id" | "createdAt" | "updatedAt">): { insertId: number } {
  const tmpl: MockTemplate = { ...data, id: nextId(), createdAt: now(), updatedAt: now() };
  mockTemplates.push(tmpl);
  return { insertId: tmpl.id };
}

export function mockUpdateTemplate(id: number, userId: number, data: Partial<MockTemplate>): void {
  const idx = mockTemplates.findIndex(t => t.id === id && t.userId === userId);
  if (idx !== -1) mockTemplates[idx] = { ...mockTemplates[idx], ...data, updatedAt: now() };
}

export function mockDeleteTemplate(id: number, userId: number): void {
  const idx = mockTemplates.findIndex(t => t.id === id && t.userId === userId);
  if (idx !== -1) mockTemplates.splice(idx, 1);
}

// ── Circuits ──────────────────────────────────────────────────────────────────

// Espeja exactamente el schema: drizzle/schema.ts > circuits
export interface MockCircuit {
  id: number;
  certificateId: number;
  circuitNumber: string;
  circuitName: string;
  circuitType?: string | null;
  installedPower?: number | null;   // int en schema
  length?: string | null;           // decimal → string
  cableSection?: string | null;     // decimal → string
  cableMaterial?: string | null;
  cableInsulation?: string | null;
  cableCores?: number | null;
  mcbRating?: number | null;
  mcbCurve?: string | null;
  rcdRequired?: boolean | null;
  rcdRating?: number | null;
  installMethod?: string | null;
  voltageDrop?: string | null;
  designCurrent?: string | null;
  loadDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const mockCircuits: MockCircuit[] = [
  { id: 1, certificateId: 1, circuitNumber: "C1", circuitName: "Alumbrado general",  circuitType: "Iluminación",        installedPower: 1500, cableSection: "1.5", cableMaterial: "Cu", cableInsulation: "PVC", cableCores: 2, length: "18", mcbRating: 10, mcbCurve: "C", rcdRequired: false, rcdRating: 30, loadDescription: "Alumbrado general de la vivienda",    createdAt: new Date("2026-01-15"), updatedAt: new Date("2026-01-15") },
  { id: 2, certificateId: 1, circuitNumber: "C2", circuitName: "Tomas uso general",   circuitType: "Tomas de uso general", installedPower: 3000, cableSection: "2.5", cableMaterial: "Cu", cableInsulation: "PVC", cableCores: 3, length: "20", mcbRating: 16, mcbCurve: "C", rcdRequired: true,  rcdRating: 30, loadDescription: "Tomas de corriente salón y dormitorios", createdAt: new Date("2026-01-15"), updatedAt: new Date("2026-01-15") },
  { id: 3, certificateId: 1, circuitNumber: "C3", circuitName: "Cocina y horno",      circuitType: "Cocina",              installedPower: 5400, cableSection: "6",   cableMaterial: "Cu", cableInsulation: "PVC", cableCores: 3, length: "12", mcbRating: 25, mcbCurve: "C", rcdRequired: true,  rcdRating: 30, loadDescription: "Encimera vitrocerámica y horno",          createdAt: new Date("2026-01-15"), updatedAt: new Date("2026-01-15") },
];

export function mockGetCircuitsByCertificateId(certificateId: number): MockCircuit[] {
  return mockCircuits.filter(c => c.certificateId === certificateId);
}

export function mockCreateCircuit(data: Omit<MockCircuit, "id" | "createdAt" | "updatedAt">): { insertId: number } {
  const circuit: MockCircuit = { ...data, id: nextId(), createdAt: now(), updatedAt: now() };
  mockCircuits.push(circuit);
  return { insertId: circuit.id };
}

export function mockUpdateCircuit(id: number, data: Partial<MockCircuit>): void {
  const idx = mockCircuits.findIndex(c => c.id === id);
  if (idx !== -1) mockCircuits[idx] = { ...mockCircuits[idx], ...data, updatedAt: now() };
}

export function mockDeleteCircuit(id: number): void {
  const idx = mockCircuits.findIndex(c => c.id === id);
  if (idx !== -1) mockCircuits.splice(idx, 1);
}

// ── Inspections (FASE 6.3) ────────────────────────────────────────────────────

export interface MockInspection {
  id: number;
  userId: number;
  certificateId: number;
  scheduledDate: Date;
  completedDate?: Date | null;
  result: "pending" | "passed" | "failed" | "deferred";
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const mockInspections: MockInspection[] = [];

export function mockGetInspectionsByUserId(userId: number): MockInspection[] {
  return mockInspections.filter(i => i.userId === userId);
}

export function mockCreateInspection(data: Omit<MockInspection, "id" | "createdAt" | "updatedAt">): { insertId: number } {
  const inspection: MockInspection = { ...data, id: nextId(), createdAt: now(), updatedAt: now() };
  mockInspections.push(inspection);
  return { insertId: inspection.id };
}

export function mockUpdateInspection(id: number, userId: number, data: Partial<MockInspection>): void {
  const idx = mockInspections.findIndex(i => i.id === id && i.userId === userId);
  if (idx !== -1) mockInspections[idx] = { ...mockInspections[idx], ...data, updatedAt: now() };
}

export function mockDeleteInspection(id: number, userId: number): void {
  const idx = mockInspections.findIndex(i => i.id === id && i.userId === userId);
  if (idx !== -1) mockInspections.splice(idx, 1);
}

// ── ClientTokens (FASE 6.4) ───────────────────────────────────────────────────

export interface MockClientToken {
  id: number;
  clientId: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const mockClientTokens: MockClientToken[] = [];

export function mockCreateClientToken(data: Omit<MockClientToken, "id" | "createdAt">): { insertId: number } {
  const ct: MockClientToken = { ...data, id: nextId(), createdAt: now() };
  mockClientTokens.push(ct);
  return { insertId: ct.id };
}

export function mockGetClientTokenByToken(token: string): MockClientToken | undefined {
  return mockClientTokens.find(t => t.token === token && t.expiresAt > now());
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export interface MockProfile {
  id: number;
  userId: number;
  fullName?: string | null;
  companyName?: string | null;
  cifNif?: string | null;
  installerNumber?: string | null;
  installerCategory?: string | null;
  autonomousCommunity?: string | null;
  companyAuthNumber?: string | null;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const mockProfiles: MockProfile[] = [
  {
    id: 1,
    userId: 1,
    fullName: "Carlos Martínez López",
    companyName: "Instalaciones Eléctricas Martínez S.L.",
    cifNif: "B87654321",
    installerNumber: "28/2024/0042",
    installerCategory: "Especialista",
    autonomousCommunity: "Madrid",
    companyAuthNumber: "EIA-28-2024-042",
    phone: "+34 612 345 678",
    address: "C/ Artesanos 14, Nave 3",
    postalCode: "28760",
    city: "Tres Cantos",
    province: "Madrid",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
];

export function mockGetProfileByUserId(userId: number): MockProfile | undefined {
  return mockProfiles.find(p => p.userId === userId);
}

export function mockUpsertProfile(data: Partial<MockProfile> & { userId: number }): void {
  const idx = mockProfiles.findIndex(p => p.userId === data.userId);
  if (idx !== -1) {
    mockProfiles[idx] = { ...mockProfiles[idx], ...data, updatedAt: now() };
  } else {
    const profile: MockProfile = {
      id: nextId(),
      fullName: null, companyName: null, cifNif: null, installerNumber: null,
      installerCategory: null, autonomousCommunity: null, companyAuthNumber: null,
      phone: null, address: null, postalCode: null, city: null, province: null,
      ...data,
      createdAt: now(),
      updatedAt: now(),
    };
    mockProfiles.push(profile);
  }
}
