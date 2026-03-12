import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../drizzle/schema";

async function seed() {
  console.log("🌱 Iniciando conexión directa a la base de datos...");

  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "password",
    database: "certia",
  });

  const db = drizzle(connection, { schema, mode: "default" });

  try {
    console.log("🧹 Limpiando datos previos para evitar duplicados...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.query("TRUNCATE TABLE certificates");
    await connection.query("TRUNCATE TABLE installations");
    await connection.query("TRUNCATE TABLE clients");
    await connection.query("TRUNCATE TABLE profiles");
    await connection.query("TRUNCATE TABLE subscriptions");
    await connection.query("TRUNCATE TABLE users");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("👤 Creando usuario e instalador...");
    const [userResult] = await db.insert(schema.users).values({
      openId: "test-user-001",
      name: "Instalador de Prueba",
      email: "test@certia.io",
      role: "user",
    });
    
    // Extracción correcta del ID según tu corrección en el pasted_content_5
    const userId = (userResult as any).insertId;

    await db.insert(schema.profiles).values({
      userId: userId,
      companyName: "Pérez Electricidad S.L.",
      cifNif: "B12345678",
      companyAuthNumber: "2026-AUTH-99",
      autonomousCommunity: "Madrid",
      phone: "600123456",
      address: "Calle de la Energía 1, Madrid",
    });

    await db.insert(schema.installers).values({
      userId: userId,
      fullName: "Juan Pérez García",
      nif: "12345678A",
      installerNumber: "28/2024/0001",
      installerCategory: "Básica",
      isActive: true,
    });

    console.log("🏢 Creando cliente e instalación...");
    const [clientResult] = await db.insert(schema.clients).values({
      userId: userId,
      type: "company",
      name: "Restaurante El Faro",
      dniNif: "B87654321",
      email: "contacto@elfaro.com",
      address: "Paseo Marítimo 45, Valencia",
    });
    
    const clientId = (clientResult as any).insertId;

    const [instResult] = await db.insert(schema.installations).values({
      userId: userId,
      clientId: clientId,
      name: "Instalación Principal El Faro",
      type: "Local Comercial",
      address: "Paseo Marítimo 45, Valencia",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const instId = (instResult as any).insertId;

    console.log("📝 Creando certificados de prueba...");
    await db.insert(schema.certificates).values([
      {
        userId: userId,
        clientId: clientId,
        installationId: instId,
        status: "draft",
        installationType: "Local Comercial",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: userId,
        clientId: clientId,
        installationId: instId,
        status: "issued",
        certificateNumber: "CIE-2026-0001",
        installationType: "Local Comercial",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    console.log("✅ ¡AHORA SÍ! Datos de prueba insertados correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();

