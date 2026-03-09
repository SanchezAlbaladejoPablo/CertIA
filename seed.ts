// server/scripts/seed.ts
import { db } from "../db";
import { users, profiles, clients, installations, certificates, subscriptions } from "../../drizzle/schema";

async function seed() {
  console.log("🌱 Iniciando la siembra de datos de prueba...");

  // 1. Crear Usuario e Instalador (Tú)
  const [user] = await db.insert(users).values({
    openId: "test-user-001",
    name: "Instalador de Prueba",
    email: "test@certia.io",
    role: "user",
  });

  await db.insert(profiles).values({
    userId: user.insertId,
    fullName: "Juan Pérez Instalaciones",
    companyName: "Pérez Electricidad S.L.",
    cifNif: "B12345678",
    installerNumber: "2026-AUTH-99",
    installerCategory: "Básica",
    autonomousCommunity: "Madrid",
    phone: "600123456",
    address: "Calle de la Energía 1, Madrid",
  });

  // 2. Crear Suscripción Pro (Simulada)
  await db.insert(subscriptions).values({
    userId: user.insertId,
    plan: "pro",
    status: "active",
    certificatesLimit: 500,
    certificatesUsed: 2,
  });

  // 3. Crear Cliente (Empresa)
  const [client] = await db.insert(clients).values({
    userId: user.insertId,
    type: "company",
    name: "Restaurante El Faro",
    dniNif: "B87654321",
    email: "contacto@elfaro.com",
    address: "Paseo Marítimo 45, Valencia",
  });

  // 4. Crear Instalación
  const [inst] = await db.insert(installations).values({
    userId: user.insertId,
    clientId: client.insertId,
    type: "Local Comercial",
    address: "Paseo Marítimo 45, Valencia",
    supplyVoltage: 400,
    installedPower: 15.5,
    phases: 3,
  });

  // 5. Crear Certificados (Borrador y Emitido)
  await db.insert(certificates).values([
    {
      userId: user.insertId,
      clientId: client.insertId,
      installationId: inst.insertId,
      status: "draft",
      installationType: "Local Comercial",
      installedPower: 15.5,
    },
    {
      userId: user.insertId,
      clientId: client.insertId,
      installationId: inst.insertId,
      status: "issued",
      certificateNumber: "CIE-2026-0001",
      installationType: "Local Comercial",
      installedPower: 15.5,
    }
  ]);

  console.log("✅ Datos de prueba insertados con éxito.");
}

seed().catch(console.error);
