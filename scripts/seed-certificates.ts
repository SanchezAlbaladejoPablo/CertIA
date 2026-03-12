/**
 * Inserta instalaciones y certificados realistas asociados a los clientes existentes.
 * Uso: npx tsx scripts/seed-certificates.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("❌ DATABASE_URL no configurado"); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection({ uri: DATABASE_URL, ssl: { rejectUnauthorized: true } });
  console.log("✅ Conectado.\n");

  // Usuario
  const [users] = await conn.query<mysql.RowDataPacket[]>("SELECT id FROM users ORDER BY id ASC LIMIT 1");
  if (!users.length) { console.error("❌ No hay usuarios"); await conn.end(); process.exit(1); }
  const userId = users[0].id;

  // Instaladores activos
  const [installers] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id, fullName FROM installers WHERE userId = ? AND isActive = 1 ORDER BY id ASC", [userId]
  );
  const ins0 = installers[0]?.id;  // Carlos Valero (Especialista)
  const ins1 = installers[1]?.id;  // Marta Sánchez (Básica)

  // Clientes
  const [clients] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id, name FROM clients WHERE userId = ? ORDER BY id ASC", [userId]
  );
  const clientMap: Record<string, number> = {};
  for (const c of clients) clientMap[c.name] = c.id;

  const antonioId  = clientMap["Antonio Ferrández Blasco"];
  const hosteleriaId = clientMap["Hostelería Levante S.L."];
  const luciaId    = clientMap["Lucía Moreno Gil"];
  const supermerIdKey = Object.keys(clientMap).find(k => k.includes("Supermercados"))!;
  const supermerId = clientMap[supermerIdKey];
  const ramonId    = clientMap["Ramón Giménez Palau"];

  // Limpiar datos previos
  await conn.query("DELETE FROM circuits WHERE certificateId IN (SELECT id FROM certificates WHERE userId = ?)", [userId]);
  await conn.query("DELETE FROM certificates WHERE userId = ?", [userId]);
  await conn.query("DELETE FROM installations WHERE userId = ?", [userId]);

  // ── Helper insert ────────────────────────────────────────────────────────────
  async function insertInstallation(data: Record<string, any>): Promise<number> {
    const [r] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO installations (userId, clientId, name, type, address, postalCode, city, province, cadastralReference, cups, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, data.clientId, data.name, data.type, data.address, data.postalCode, data.city, data.province, data.cadastralReference ?? null, data.cups ?? null]
    );
    return r.insertId;
  }

  async function insertCertificate(data: Record<string, any>): Promise<number> {
    const [r] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO certificates
         (userId, clientId, installationId, installerId, status, certificateNumber, expedienteNumber,
          installationType, locationCategory, electrificationGrade, supplyVoltage, installedPower,
          maxAdmissiblePower, phases, groundingSystem,
          diLength, diCableSection, diCableMaterial, diCableInsulation,
          ambientTemp, installMethod, groupedCables,
          boardLocation, igaRating, idSensitivity, overvoltageProtection, earthResistance,
          insulationResistance, continuityContinuity, rcdTestCurrent, rcdTestTime,
          observations, serviceCommissionDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId, data.clientId, data.installationId, data.installerId ?? null,
        data.status, data.certificateNumber ?? null, data.expedienteNumber ?? null,
        data.installationType, data.locationCategory ?? "Seco", data.electrificationGrade ?? "Básico",
        data.supplyVoltage ?? 230, data.installedPower, data.maxAdmissiblePower ?? data.installedPower,
        data.phases ?? 1, data.groundingSystem ?? "TT",
        data.diLength, data.diCableSection, data.diCableMaterial ?? "Cu", data.diCableInsulation ?? "PVC",
        data.ambientTemp ?? 30, data.installMethod ?? "embedded_conduit", data.groupedCables ?? 1,
        data.boardLocation, data.igaRating, data.idSensitivity ?? 30,
        data.overvoltageProtection ? 1 : 0, data.earthResistance ?? "18.5",
        data.insulationResistance ?? null, data.continuityContinuity ?? null,
        data.rcdTestCurrent ?? null, data.rcdTestTime ?? null,
        data.observations ?? null, data.serviceCommissionDate ?? null,
      ]
    );
    return r.insertId;
  }

  async function insertCircuits(certId: number, circuits: any[]) {
    for (const c of circuits) {
      await conn.query(
        `INSERT INTO circuits
           (certificateId, circuitNumber, circuitName, circuitType, installedPower, length,
            cableSection, cableMaterial, cableInsulation, cableCores,
            mcbRating, mcbCurve, rcdRequired, rcdRating, installMethod, voltageDrop, designCurrent, loadDescription, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [certId, c.num, c.name, c.type, c.power, c.length,
         c.section, c.material ?? "Cu", c.insulation ?? "PVC", c.cores ?? 2,
         c.mcb, c.curve ?? "C", c.rcd ? 1 : 0, c.rcd ?? 0,
         c.method ?? "embedded_conduit", c.vdrop ?? null, c.current ?? null, c.desc ?? null]
      );
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. Antonio Ferrández — Vivienda unifamiliar (firmado ✅)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("🏠 Antonio Ferrández — vivienda unifamiliar...");
  const instAntonio = await insertInstallation({
    clientId: antonioId, name: "Vivienda principal", type: "Vivienda unifamiliar",
    address: "Av. Blasco Ibáñez 142, 3º B", postalCode: "46022", city: "Valencia", province: "Valencia",
    cadastralReference: "5824901YJ2752D0003UZ",
  });
  const certAntonio = await insertCertificate({
    clientId: antonioId, installationId: instAntonio, installerId: ins0,
    status: "signed", certificateNumber: "CIE-2025-0001", expedienteNumber: "EXP-VAL-2025-04412",
    installationType: "Vivienda unifamiliar", electrificationGrade: "Elevado",
    supplyVoltage: 230, installedPower: 9200, maxAdmissiblePower: 9200, phases: 1,
    groundingSystem: "TT",
    diLength: "12.5", diCableSection: "10", diCableMaterial: "Cu", diCableInsulation: "XLPE",
    ambientTemp: 30, installMethod: "embedded_conduit", groupedCables: 1,
    boardLocation: "Vestíbulo entrada", igaRating: 40, idSensitivity: 30,
    overvoltageProtection: true, earthResistance: "14.2",
    insulationResistance: "500", continuityContinuity: "0.42",
    rcdTestCurrent: 30, rcdTestTime: 25,
    observations: "Instalación electrificación elevada según ITC-BT-25. Todos los circuitos verificados. Tierra 14.2 Ω dentro del límite reglamentario.",
    serviceCommissionDate: new Date("2025-04-15"),
  });
  await insertCircuits(certAntonio, [
    { num: "C1", name: "Iluminación general",        type: "Iluminación",            power: 200,  length: "28", section: "1.5", cores: 2, mcb: 10, curve: "C", rcd: false, vdrop: "1.2", current: "0.87",  desc: "Puntos de luz todas las estancias" },
    { num: "C2", name: "Tomas de uso general",       type: "Tomas de uso general",   power: 3450, length: "22", section: "2.5", cores: 2, mcb: 16, curve: "C", rcd: false, vdrop: "1.8", current: "15.0",  desc: "Bases de enchufe 16A estancias" },
    { num: "C3", name: "Cocina y horno",             type: "Cocina",                 power: 5400, length: "8",  section: "6.0", cores: 2, mcb: 25, curve: "C", rcd: false, vdrop: "0.9", current: "23.5",  desc: "Circuito independiente para cocina vitrocerámica y horno" },
    { num: "C4", name: "Lavadora",                  type: "Lavadora/Lavavajillas",   power: 3450, length: "15", section: "4.0", cores: 2, mcb: 20, curve: "C", rcd: false, vdrop: "1.1", current: "15.0",  desc: "Toma específica lavadora en galería" },
    { num: "C5", name: "Baño y cocina (tomas)",     type: "Tomas de uso general",   power: 3450, length: "18", section: "2.5", cores: 2, mcb: 16, curve: "C", rcd: true,  rcdRating: 30, vdrop: "1.5", current: "15.0", desc: "Bases 16A cuarto de baño y cocina — diferencial 30 mA" },
    { num: "C6", name: "Aire acondicionado",        type: "Aire acondicionado",     power: 3000, length: "12", section: "4.0", cores: 2, mcb: 20, curve: "C", rcd: false, vdrop: "1.0", current: "13.0",  desc: "Unidad split salón-comedor" },
    { num: "C7", name: "Lavavajillas",              type: "Lavadora/Lavavajillas",   power: 3450, length: "9",  section: "2.5", cores: 2, mcb: 16, curve: "C", rcd: false, vdrop: "0.8", current: "15.0",  desc: "Toma específica lavavajillas" },
  ]);
  console.log("   ✅ Certificado firmado CIE-2025-0001 (7 circuitos)");

  // ════════════════════════════════════════════════════════════════════════════
  // 2. Hostelería Levante — Local comercial bar-restaurante (emitido)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("🍽️  Hostelería Levante — local comercial...");
  const instHost = await insertInstallation({
    clientId: hosteleriaId, name: "Bar-Restaurante El Racó", type: "Local comercial",
    address: "C/ de la Paz 8, bajo", postalCode: "46003", city: "Valencia", province: "Valencia",
    cups: "ES0031300527892001KW0F",
  });
  const certHost = await insertCertificate({
    clientId: hosteleriaId, installationId: instHost, installerId: ins0,
    status: "issued", certificateNumber: "CIE-2025-0002",
    installationType: "Local comercial", locationCategory: "Húmedo", electrificationGrade: "Básico",
    supplyVoltage: 400, installedPower: 28500, maxAdmissiblePower: 28500, phases: 3,
    groundingSystem: "TT",
    diLength: "18.0", diCableSection: "16", diCableMaterial: "Cu", diCableInsulation: "XLPE",
    ambientTemp: 35, installMethod: "tray", groupedCables: 3,
    boardLocation: "Cuarto técnico trasero", igaRating: 63, idSensitivity: 30,
    overvoltageProtection: true, earthResistance: "9.8",
    insulationResistance: "500", continuityContinuity: "0.38",
    rcdTestCurrent: 30, rcdTestTime: 20,
    observations: "Local de pública concurrencia. Instalación trifásica. Circuito de alumbrado de emergencia incluido según ITC-BT-28.",
    serviceCommissionDate: new Date("2025-09-03"),
  });
  await insertCircuits(certHost, [
    { num: "C1",  name: "Alumbrado sala comedor",    type: "Iluminación",          power: 800,  length: "32", section: "1.5", cores: 2, mcb: 10, curve: "C", rcd: false, vdrop: "2.1", current: "3.5",  desc: "Luminarias LED sala principal" },
    { num: "C2",  name: "Alumbrado cocina",          type: "Iluminación",          power: 600,  length: "18", section: "1.5", cores: 2, mcb: 10, curve: "C", rcd: false, vdrop: "0.9", current: "2.6",  desc: "Fluorescentes estancos IP65 cocina industrial" },
    { num: "C3",  name: "Alumbrado emergencia",      type: "Iluminación",          power: 200,  length: "38", section: "1.5", cores: 2, mcb: 10, curve: "C", rcd: false, vdrop: "0.7", current: "0.9",  desc: "Luminarias emergencia 1h LEGRAND — ITC-BT-28" },
    { num: "C4",  name: "Tomas cocina industrial",   type: "Tomas de uso general", power: 5750, length: "14", section: "6.0", cores: 3, mcb: 25, curve: "C", rcd: true,  rcdRating: 30, vdrop: "1.4", current: "25.0", desc: "Bases 16A trifásico zona cocina" },
    { num: "C5",  name: "Freidoras y plancha",       type: "Cocina",               power: 9000, length: "10", section: "10",  cores: 3, mcb: 40, curve: "C", rcd: false, vdrop: "1.1", current: "13.0", desc: "Circuito trifásico para maquinaria cocina" },
    { num: "C6",  name: "Cámara frigorífica",        type: "Otro",                 power: 4500, length: "16", section: "6.0", cores: 3, mcb: 25, curve: "C", rcd: false, vdrop: "1.3", current: "6.5",  desc: "Compresor cámara 400V trifásico" },
    { num: "C7",  name: "Climatización sala",        type: "Aire acondicionado",   power: 7500, length: "22", section: "10",  cores: 3, mcb: 32, curve: "C", rcd: false, vdrop: "1.8", current: "10.8", desc: "Fancoil trifásico 7.5 kW" },
    { num: "C8",  name: "TPV y equipos informáticos",type: "Tomas de uso general", power: 500,  length: "25", section: "2.5", cores: 2, mcb: 16, curve: "C", rcd: true,  rcdRating: 30, vdrop: "0.6", current: "2.2",  desc: "Bases para caja registradora y SAI" },
  ]);
  console.log("   ✅ Certificado emitido CIE-2025-0002 (8 circuitos)");

  // ════════════════════════════════════════════════════════════════════════════
  // 3. Lucía Moreno — Vivienda piso (borrador)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("🏢 Lucía Moreno — reforma piso (borrador)...");
  const instLucia = await insertInstallation({
    clientId: luciaId, name: "Vivienda C/ Xàtiva", type: "Vivienda unifamiliar",
    address: "C/ Xàtiva 31, 1º A", postalCode: "46002", city: "Valencia", province: "Valencia",
    cadastralReference: "3812047YJ2731C0001GZ",
  });
  const certLucia = await insertCertificate({
    clientId: luciaId, installationId: instLucia, installerId: ins1,
    status: "draft",
    installationType: "Vivienda unifamiliar", electrificationGrade: "Básico",
    supplyVoltage: 230, installedPower: 5750, maxAdmissiblePower: 5750, phases: 1,
    groundingSystem: "TT",
    diLength: "8.5", diCableSection: "6", diCableMaterial: "Cu", diCableInsulation: "PVC",
    ambientTemp: 30, installMethod: "embedded_conduit", groupedCables: 1,
    boardLocation: "Hall de entrada", igaRating: 25, idSensitivity: 30,
    overvoltageProtection: false, earthResistance: "22.1",
    observations: "Reforma parcial instalación eléctrica. Pendiente revisión de tierra.",
  });
  await insertCircuits(certLucia, [
    { num: "C1", name: "Iluminación",         type: "Iluminación",          power: 200,  length: "20", section: "1.5", cores: 2, mcb: 10, curve: "C", rcd: false, desc: "Puntos de luz general" },
    { num: "C2", name: "Tomas generales",     type: "Tomas de uso general", power: 3450, length: "18", section: "2.5", cores: 2, mcb: 16, curve: "C", rcd: false, desc: "Bases 16A salón y dormitorios" },
    { num: "C3", name: "Cocina",              type: "Cocina",               power: 3450, length: "6",  section: "4.0", cores: 2, mcb: 20, curve: "C", rcd: false, desc: "Placa vitrocerámica y microondas" },
    { num: "C4", name: "Baño (tomas húmedas)",type: "Tomas de uso general", power: 2300, length: "14", section: "2.5", cores: 2, mcb: 16, curve: "C", rcd: true,  rcdRating: 30, desc: "Tomas baño — diferencial 30 mA" },
    { num: "C5", name: "Lavadora",            type: "Lavadora/Lavavajillas",power: 2300, length: "12", section: "2.5", cores: 2, mcb: 16, curve: "C", rcd: false, desc: "Toma lavadora galería" },
  ]);
  console.log("   ✅ Certificado borrador (5 circuitos)");

  // ════════════════════════════════════════════════════════════════════════════
  // 4. Supermercados Orihuela — Nave industrial (presentado a industria)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("🏭 Supermercados Orihuela — nave comercial...");
  const instSuper = await insertInstallation({
    clientId: supermerId, name: "Supermercado Orihuela Centro", type: "Local comercial",
    address: "Av. Doctor García Rogel 18", postalCode: "03300", city: "Orihuela", province: "Alicante",
    cups: "ES0031406278401001XD2F",
  });
  const certSuper = await insertCertificate({
    clientId: supermerId, installationId: instSuper, installerId: ins0,
    status: "submitted", certificateNumber: "CIE-2024-0018", expedienteNumber: "ALC-IND-2024-7734",
    installationType: "Local comercial", locationCategory: "Húmedo", electrificationGrade: "Básico",
    supplyVoltage: 400, installedPower: 62000, maxAdmissiblePower: 62000, phases: 3,
    groundingSystem: "TT",
    diLength: "35.0", diCableSection: "35", diCableMaterial: "Cu", diCableInsulation: "XLPE",
    ambientTemp: 35, installMethod: "tray", groupedCables: 6,
    boardLocation: "Sala técnica planta baja", igaRating: 125, idSensitivity: 300,
    overvoltageProtection: true, earthResistance: "5.3",
    insulationResistance: "500", continuityContinuity: "0.21",
    rcdTestCurrent: 300, rcdTestTime: 150,
    observations: "Instalación gran establecimiento comercial. Medida en MT. Grupo electrógeno de respaldo 100 kVA. Presentado a Conselleria d'Industria 15/11/2024.",
    serviceCommissionDate: new Date("2024-11-01"),
  });
  await insertCircuits(certSuper, [
    { num: "C01", name: "Alumbrado sala ventas",      type: "Iluminación",          power: 4800,  length: "55", section: "4.0",  cores: 3, mcb: 25, curve: "C", rcd: false, vdrop: "2.4", current: "6.9",  desc: "Luminarias LED lineales 4000K — 600 unidades" },
    { num: "C02", name: "Alumbrado emergencia",       type: "Iluminación",          power: 800,   length: "80", section: "1.5",  cores: 2, mcb: 10, curve: "C", rcd: false, vdrop: "1.1", current: "3.5",  desc: "Bloques autónomos 1h — ITC-BT-28" },
    { num: "C03", name: "Cajas registradoras",        type: "Tomas de uso general", power: 3000,  length: "30", section: "2.5",  cores: 3, mcb: 16, curve: "C", rcd: true,  rcdRating: 30, vdrop: "0.9", current: "4.3",  desc: "14 cajas con SAI individual" },
    { num: "C04", name: "Cámaras frigoríficas 1",     type: "Otro",                 power: 12000, length: "28", section: "16",   cores: 3, mcb: 50, curve: "C", rcd: false, vdrop: "1.6", current: "17.3", desc: "Murales fríos sección lácteos y charcutería" },
    { num: "C05", name: "Cámaras frigoríficas 2",     type: "Otro",                 power: 10000, length: "32", section: "16",   cores: 3, mcb: 50, curve: "C", rcd: false, vdrop: "1.8", current: "14.4", desc: "Arcones congeladores sección congelados" },
    { num: "C06", name: "Climatización zona ventas",  type: "Aire acondicionado",   power: 15000, length: "40", section: "25",   cores: 3, mcb: 63, curve: "C", rcd: false, vdrop: "2.1", current: "21.7", desc: "Unidades de tratamiento de aire — 2×7.5 kW" },
    { num: "C07", name: "Panadería / obrador",        type: "Cocina",               power: 9000,  length: "22", section: "10",   cores: 3, mcb: 40, curve: "C", rcd: false, vdrop: "1.4", current: "13.0", desc: "Horno de convección, amasadora y cámara fermentación" },
    { num: "C08", name: "Tomas almacén",              type: "Tomas de uso general", power: 4000,  length: "45", section: "4.0",  cores: 3, mcb: 20, curve: "C", rcd: true,  rcdRating: 30, vdrop: "1.9", current: "5.8",  desc: "Bases 16A y 32A para maquinaria reposición" },
    { num: "C09", name: "Grupo electrógeno",          type: "Otro",                 power: 100000,length: "20", section: "70",   cores: 3, mcb: 200,curve: "D", rcd: false, vdrop: "0.8", current: "144",  desc: "Arranque automático — conmutador red/grupo" },
    { num: "C10", name: "SAI central informática",    type: "Otro",                 power: 2000,  length: "15", section: "2.5",  cores: 2, mcb: 16, curve: "C", rcd: true,  rcdRating: 30, vdrop: "0.4", current: "8.7",  desc: "CPD, servidores TPV y red WiFi" },
  ]);
  console.log("   ✅ Certificado presentado CIE-2024-0018 (10 circuitos)");

  // ════════════════════════════════════════════════════════════════════════════
  // 5. Ramón Giménez — Garaje comunitario (emitido)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("🚗 Ramón Giménez — garaje comunitario...");
  const instRamon = await insertInstallation({
    clientId: ramonId, name: "Garaje comunitario C/ Sorolla", type: "Garaje",
    address: "C/ Pintor Sorolla 4, sótano -1", postalCode: "46004", city: "Valencia", province: "Valencia",
    cadastralReference: "2847391YJ2724H0001PE",
  });
  const certRamon = await insertCertificate({
    clientId: ramonId, installationId: instRamon, installerId: ins1,
    status: "issued", certificateNumber: "CIE-2026-0001",
    installationType: "Garaje", locationCategory: "Húmedo", electrificationGrade: "Básico",
    supplyVoltage: 400, installedPower: 18400, maxAdmissiblePower: 18400, phases: 3,
    groundingSystem: "TT",
    diLength: "22.0", diCableSection: "10", diCableMaterial: "Cu", diCableInsulation: "XLPE",
    ambientTemp: 25, installMethod: "conduit_surface", groupedCables: 2,
    boardLocation: "Junto a escalera acceso", igaRating: 50, idSensitivity: 300,
    overvoltageProtection: false, earthResistance: "11.7",
    insulationResistance: "500", continuityContinuity: "0.55",
    rcdTestCurrent: 300, rcdTestTime: 180,
    observations: "Garaje 24 plazas. Ventilación forzada con detección CO. Preinstalación 4 puntos recarga VE (ITC-BT-52). Diferencial de alta sensibilidad en circuito de recarga.",
    serviceCommissionDate: new Date("2026-02-10"),
  });
  await insertCircuits(certRamon, [
    { num: "C1", name: "Alumbrado general sótano",   type: "Iluminación",          power: 2000, length: "45", section: "2.5", cores: 3, mcb: 16, curve: "C", rcd: false, vdrop: "1.8", current: "2.9",  desc: "Luminarias estancas IP65 LED 6500K con sensor presencia" },
    { num: "C2", name: "Alumbrado emergencia",       type: "Iluminación",          power: 300,  length: "50", section: "1.5", cores: 2, mcb: 10, curve: "C", rcd: false, vdrop: "0.6", current: "1.3",  desc: "Bloques autónomos 1h — vías evacuación" },
    { num: "C3", name: "Ventilación CO",             type: "Otro",                 power: 5500, length: "30", section: "6.0", cores: 3, mcb: 25, curve: "C", rcd: false, vdrop: "1.4", current: "7.9",  desc: "2×ventiladores trifásicos + centralita detección CO" },
    { num: "C4", name: "Puerta automática entrada",  type: "Otro",                 power: 1500, length: "28", section: "2.5", cores: 3, mcb: 16, curve: "C", rcd: true,  rcdRating: 30, vdrop: "0.9", current: "2.2",  desc: "Motor basculante con fotocélulas y pulsadores" },
    { num: "C5", name: "Recarga VE (preinstalación)",type: "Otro",                 power: 9000, length: "35", section: "10",  cores: 3, mcb: 40, curve: "C", rcd: true,  rcdRating: 30, vdrop: "2.2", current: "13.0", desc: "4 puntos 22 kW — preinstalación ITC-BT-52 — diferencial alta sensibilidad 30 mA" },
    { num: "C6", name: "Tomas servicio / limpieza",  type: "Tomas de uso general", power: 3450, length: "20", section: "2.5", cores: 2, mcb: 16, curve: "C", rcd: true,  rcdRating: 30, vdrop: "0.7", current: "15.0", desc: "Bases 16A accesibles para limpieza y mantenimiento" },
  ]);
  console.log("   ✅ Certificado emitido CIE-2026-0001 (6 circuitos)");

  await conn.end();
  console.log("\n🎉 ¡5 certificados creados con todos sus circuitos!");
  console.log("   • CIE-2025-0001 — Vivienda Antonio Ferrández    (firmado,     7 circuitos)");
  console.log("   • CIE-2025-0002 — Bar-Restaurante El Racó        (emitido,     8 circuitos)");
  console.log("   • borrador      — Reforma piso Lucía Moreno      (borrador,    5 circuitos)");
  console.log("   • CIE-2024-0018 — Supermercado Orihuela          (presentado, 10 circuitos)");
  console.log("   • CIE-2026-0001 — Garaje comunitario C/ Sorolla  (emitido,     6 circuitos)");
}

run().catch(err => { console.error("❌", err.message); process.exit(1); });
