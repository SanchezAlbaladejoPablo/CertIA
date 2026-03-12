/**
 * Inserta un perfil realista de empresa instaladora para el primer usuario de la BD.
 * Uso: npx tsx scripts/seed-profile.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no configurado en .env");
  process.exit(1);
}

async function run() {
  console.log("🔌 Conectando...");
  const conn = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  });
  console.log("✅ Conectado.\n");

  // Obtener el primer usuario registrado
  const [users] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id, email, name FROM users ORDER BY id ASC LIMIT 1"
  );
  if (!users.length) {
    console.error("❌ No hay usuarios en la BD. Regístrate primero en la app.");
    await conn.end();
    process.exit(1);
  }
  const user = users[0];
  const userId = user.id;
  console.log(`👤 Usuario encontrado: ${user.name} (${user.email}) — id=${userId}`);

  // ── Perfil de empresa ────────────────────────────────────────────────────────
  console.log("\n🏢 Insertando perfil de empresa...");
  await conn.query(
    `INSERT INTO profiles
       (userId, companyName, cifNif, email, companyAuthNumber, autonomousCommunity,
        phone, address, postalCode, city, province, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       companyName       = VALUES(companyName),
       cifNif            = VALUES(cifNif),
       email             = VALUES(email),
       companyAuthNumber = VALUES(companyAuthNumber),
       autonomousCommunity = VALUES(autonomousCommunity),
       phone             = VALUES(phone),
       address           = VALUES(address),
       postalCode        = VALUES(postalCode),
       city              = VALUES(city),
       province          = VALUES(province),
       updatedAt         = NOW()`,
    [
      userId,
      "Electroinstalaciones Valero S.L.",   // Razón social
      "B46123789",                           // CIF
      "info@electrovalero.es",               // Email empresa
      "EIA-46-2019-0034",                    // Nº autorización empresa instaladora (Comunidad Valenciana)
      "Comunidad Valenciana",                // CCAA
      "963 42 17 85",                        // Teléfono fijo
      "Calle Colón 22, Entresuelo 3ª",       // Dirección fiscal
      "46004",                               // Código postal
      "Valencia",
      "Valencia",
    ]
  );
  console.log("   ✅ Perfil de empresa insertado.");

  // ── Instaladores ─────────────────────────────────────────────────────────────
  console.log("\n👷 Insertando instaladores...");

  // Borrar instaladores previos del usuario para evitar duplicados en seeds sucesivos
  await conn.query("DELETE FROM installers WHERE userId = ?", [userId]);

  const installerRows = [
    {
      fullName: "Carlos Valero Martínez",
      nif: "20483712L",
      phone: "654 11 22 33",
      email: "carlos.valero@electrovalero.es",
      installerNumber: "46/E/0842",          // Nº carnet instalador (formato CCAA)
      installerCategory: "Especialista",
      isActive: 1,
    },
    {
      fullName: "Marta Sánchez Rueda",
      nif: "29174638K",
      phone: "654 44 55 66",
      email: "marta.sanchez@electrovalero.es",
      installerNumber: "46/B/1203",
      installerCategory: "Básica",
      isActive: 1,
    },
    {
      fullName: "Diego Romero Cabello",
      nif: "44821935P",
      phone: "654 77 88 99",
      email: "diego.romero@electrovalero.es",
      installerNumber: "46/B/0991",
      installerCategory: "Básica",
      isActive: 0,                            // De baja, pero historial intacto
    },
  ];

  for (const ins of installerRows) {
    await conn.query(
      `INSERT INTO installers
         (userId, fullName, nif, phone, email, installerNumber, installerCategory, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, ins.fullName, ins.nif, ins.phone, ins.email, ins.installerNumber, ins.installerCategory, ins.isActive]
    );
    console.log(`   ✅ ${ins.fullName} (${ins.installerCategory}) — ${ins.isActive ? "activo" : "inactivo"}`);
  }

  // ── Clientes de ejemplo ───────────────────────────────────────────────────────
  console.log("\n🏠 Insertando clientes de ejemplo...");
  await conn.query("DELETE FROM clients WHERE userId = ?", [userId]);

  const clientRows = [
    { type: "person",  name: "Antonio Ferrández Blasco",    dniNif: "21934876T", email: "antonio.ferrandez@gmail.com",  phone: "620 33 44 55", address: "Av. Blasco Ibáñez 142, 3º B", postalCode: "46022", city: "Valencia",   province: "Valencia" },
    { type: "company", name: "Hostelería Levante S.L.",      dniNif: "B46982341", email: "admin@hostelerialevante.com",   phone: "963 55 12 34", address: "C/ de la Paz 8",              postalCode: "46003", city: "Valencia",   province: "Valencia" },
    { type: "person",  name: "Lucía Moreno Gil",             dniNif: "29047183S", email: "lucia.moreno@hotmail.com",     phone: "634 78 90 12", address: "C/ Xàtiva 31, 1º A",           postalCode: "46002", city: "Valencia",   province: "Valencia" },
    { type: "company", name: "Supermercados Orihuela S.C.",  dniNif: "F03241789", email: "obras@supermercadosorihuela.es",phone: "965 80 71 22", address: "Av. Doctor García Rogel 18",  postalCode: "03300", city: "Orihuela",   province: "Alicante" },
    { type: "person",  name: "Ramón Giménez Palau",          dniNif: "44320918V", email: "ramon.gimenez@gmail.com",      phone: "677 21 43 65", address: "C/ Pintor Sorolla 4, 2º C",   postalCode: "46004", city: "Valencia",   province: "Valencia" },
  ];

  const clientIds: number[] = [];
  for (const c of clientRows) {
    const [res] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO clients (userId, type, name, dniNif, email, phone, address, postalCode, city, province, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, c.type, c.name, c.dniNif, c.email, c.phone, c.address, c.postalCode, c.city, c.province]
    );
    clientIds.push(res.insertId);
    console.log(`   ✅ ${c.name}`);
  }

  await conn.end();
  console.log("\n🎉 ¡Datos insertados correctamente! Reinicia pnpm dev y entra al dashboard.");
}

run().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
