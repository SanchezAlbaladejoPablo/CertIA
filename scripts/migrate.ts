/**
 * Script de migración con SSL para TiDB/MySQL.
 * Aplica todos los archivos SQL de drizzle/ en orden.
 * Uso: npx tsx scripts/migrate.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no configurado en .env");
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");
const MIGRATIONS_TABLE = "__drizzle_migrations";

async function run() {
  console.log("🔌 Conectando a la base de datos...");

  const conn = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    multipleStatements: true,
  });

  console.log("✅ Conectado.\n");

  // Crear tabla de control de migraciones si no existe
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`${MIGRATIONS_TABLE}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Obtener migraciones ya aplicadas
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT name FROM \`${MIGRATIONS_TABLE}\``
  );
  const applied = new Set(rows.map((r) => r.name));

  // Leer archivos SQL ordenados
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭️  ${file} — ya aplicada`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");

    // drizzle usa "--> statement-breakpoint" como separador
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`🚀 Aplicando ${file} (${statements.length} statements)...`);

    for (const statement of statements) {
      try {
        await conn.query(statement);
      } catch (err: any) {
        // Ignorar errores de "ya existe" (idempotencia)
        if (
          err.code === "ER_TABLE_EXISTS_ERROR" ||
          err.code === "ER_DUP_FIELDNAME" ||
          err.sqlMessage?.includes("Duplicate column")
        ) {
          console.warn(`   ⚠️  Ignorado (ya existe): ${err.sqlMessage}`);
        } else {
          console.error(`   ❌ Error en statement:\n${statement}\n`, err.sqlMessage);
          await conn.end();
          process.exit(1);
        }
      }
    }

    await conn.query(`INSERT INTO \`${MIGRATIONS_TABLE}\` (name) VALUES (?)`, [file]);
    console.log(`   ✅ ${file} aplicada`);
    count++;
  }

  await conn.end();

  if (count === 0) {
    console.log("\n😴 No hay migraciones nuevas.");
  } else {
    console.log(`\n🎉 ${count} migración(es) aplicada(s) correctamente.`);
  }
}

run().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
