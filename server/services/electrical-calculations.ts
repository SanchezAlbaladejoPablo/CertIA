/**
 * Funciones de cálculos eléctricos según REBT (Reglamento Electrotécnico para Baja Tensión)
 */

export interface CableCalculationResult {
  current: number;              // Intensidad calculada (A)
  minSection: number;           // Sección mínima reglamentaria (mm²)
  recommendedSection: number;   // Sección normalizada recomendada (mm²)
  voltageDrop: number;          // Caída de tensión real (%)
  resistance: number;           // Resistencia del cable (Ω)
  correctionFactor: number;     // Factor de corrección aplicado
  izCorrected: number;          // Imax corregida con factores (A)
}

// Secciones normalizadas de cable (mm²)
const STANDARD_SECTIONS = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

// ── Resistividades a temperatura de servicio (Ω·mm²/m) ──────────────────────
// ITC-BT-07 / ITC-BT-19: calcular con temperatura máxima del conductor
// ρ(T) = ρ20 × [1 + α × (T - 20)]   α_Cu=0.00393  α_Al=0.00403
const RESISTIVITY: Record<string, number> = {
  'Cu-PVC':  0.02365, // Cu a 70°C
  'Cu-XLPE': 0.02634, // Cu a 90°C
  'Al-PVC':  0.03817, // Al a 70°C
  'Al-XLPE': 0.04150, // Al a 90°C
};

// ── Tablas Imax ITC-BT-19 — PVC (70°C), al aire, cable único ────────────────
const IMAX_CU_PVC: Record<number, number> = {
  0.5: 6, 0.75: 10, 1: 13, 1.5: 16, 2.5: 20, 4: 25, 6: 32,
  10: 44, 16: 57, 25: 76, 35: 92, 50: 119, 70: 154,
  95: 193, 120: 227, 150: 261, 185: 299, 240: 356,
};
const IMAX_AL_PVC: Record<number, number> = {
  0.5: 5, 0.75: 8, 1: 10, 1.5: 13, 2.5: 16, 4: 20, 6: 25,
  10: 34, 16: 44, 25: 59, 35: 71, 50: 92, 70: 119,
  95: 149, 120: 176, 150: 202, 185: 231, 240: 276,
};

// ── Tablas Imax ITC-BT-19 — XLPE (90°C), al aire, cable único ───────────────
// Valores aprox. 15-20% superiores a PVC según UNE 211435
const IMAX_CU_XLPE: Record<number, number> = {
  0.5: 7, 0.75: 11, 1: 15, 1.5: 18, 2.5: 24, 4: 30, 6: 38,
  10: 52, 16: 68, 25: 90, 35: 109, 50: 141, 70: 182,
  95: 228, 120: 269, 150: 308, 185: 354, 240: 420,
};
const IMAX_AL_XLPE: Record<number, number> = {
  0.5: 6, 0.75: 9, 1: 12, 1.5: 15, 2.5: 19, 4: 24, 6: 30,
  10: 41, 16: 53, 25: 70, 35: 84, 50: 109, 70: 141,
  95: 177, 120: 208, 150: 238, 185: 273, 240: 325,
};

function getImaxTable(material: 'Cu' | 'Al', insulation: 'PVC' | 'XLPE'): Record<number, number> {
  if (material === 'Cu') return insulation === 'XLPE' ? IMAX_CU_XLPE : IMAX_CU_PVC;
  return insulation === 'XLPE' ? IMAX_AL_XLPE : IMAX_AL_PVC;
}

// ── Factor de temperatura kt — ITC-BT-07 Tabla 6 ────────────────────────────
// Temperatura de referencia: 30°C (kt=1.00)
const KT_CU_PVC: Record<number, number>  = { 25: 1.04, 30: 1.00, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82 };
const KT_CU_XLPE: Record<number, number> = { 25: 1.04, 30: 1.00, 35: 0.97, 40: 0.94, 45: 0.91, 50: 0.87 };
const KT_AL_PVC  = KT_CU_PVC;
const KT_AL_XLPE = KT_CU_XLPE;

// ── Factor de agrupamiento kg — ITC-BT-07 Tabla 7 ───────────────────────────
const GROUPING_FACTOR: Record<number, number> = {
  1: 1.00, 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60,
  6: 0.57, 7: 0.54, 8: 0.54, 9: 0.54, 10: 0.50,
  11: 0.50, 12: 0.50,
};

// ── Factor de instalación ki ─────────────────────────────────────────────────
export const INSTALL_METHODS: Record<string, { label: string; factor: number }> = {
  'air':            { label: 'Al aire libre',          factor: 1.00 },
  'surface_conduit':{ label: 'Bajo tubo en superficie',factor: 0.85 },
  'embedded_wall':  { label: 'Empotrado en pared',     factor: 0.77 },
  'embedded_conduit':{ label:'Bajo tubo empotrado',    factor: 0.77 },
  'perforated_tray':{ label: 'Bandeja perforada',      factor: 1.00 },
  'solid_tray':     { label: 'Bandeja no perforada',   factor: 0.85 },
};

/**
 * Calcula el factor de corrección combinado kt × kg × ki
 */
export function getCorrectionFactor(
  ambientTemp: number = 30,
  groupedCables: number = 1,
  installMethod: string = 'air',
  material: 'Cu' | 'Al' = 'Cu',
  insulation: 'PVC' | 'XLPE' = 'PVC'
): number {
  // kt
  const ktTable = material === 'Cu'
    ? (insulation === 'XLPE' ? KT_CU_XLPE : KT_CU_PVC)
    : (insulation === 'XLPE' ? KT_AL_XLPE : KT_AL_PVC);
  const temps = Object.keys(ktTable).map(Number).sort((a, b) => a - b);
  const nearestTemp = temps.reduce((prev, t) => Math.abs(t - ambientTemp) < Math.abs(prev - ambientTemp) ? t : prev);
  const kt = ktTable[nearestTemp] ?? 1.00;

  // kg
  const clampedCables = Math.min(groupedCables, 12);
  const kg = GROUPING_FACTOR[clampedCables] ?? 0.50;

  // ki
  const ki = INSTALL_METHODS[installMethod]?.factor ?? 1.00;

  return Math.round(kt * kg * ki * 10000) / 10000;
}

/**
 * Calcula la sección mínima de cable según REBT
 * ITC-BT-07, ITC-BT-15, ITC-BT-19
 *
 * maxVoltageDrop:
 *   - DI (ITC-BT-15): 1%
 *   - Circuitos interiores (ITC-BT-19): 3%
 *   - Instalaciones industriales (ITC-BT-47): 5%
 */
export function calculateCableSection(
  power: number,                    // Potencia (W)
  voltage: number,                  // Tensión (V)
  phases: number,                   // 1 = monofásico, 3 = trifásico
  length: number,                   // Longitud (m)
  material: 'Cu' | 'Al',            // Material conductor
  maxVoltageDrop: number = 3,       // Máxima caída de tensión permitida (%)
  insulation: 'PVC' | 'XLPE' = 'PVC',
  ambientTemp: number = 30,
  groupedCables: number = 1,
  installMethod: string = 'air'
): CableCalculationResult {

  // 1. Calcular intensidad (A)
  const current = phases === 1
    ? power / voltage
    : power / (Math.sqrt(3) * voltage);

  // 2. Resistividad a temperatura de servicio (ITC-BT-07 / ITC-BT-19)
  const resistivityKey = `${material}-${insulation}`;
  const resistivity = RESISTIVITY[resistivityKey] ?? (material === 'Cu' ? 0.02365 : 0.03817);

  // 3. Calcular sección por criterio de caída de tensión
  const maxDropVolts = (voltage * maxVoltageDrop) / 100;
  let minSectionVoltageDrop: number;
  if (phases === 1) {
    minSectionVoltageDrop = (2 * current * length * resistivity) / maxDropVolts;
  } else {
    minSectionVoltageDrop = (Math.sqrt(3) * current * length * resistivity) / maxDropVolts;
  }

  // 4. Factor de corrección combinado
  const correctionFactor = getCorrectionFactor(ambientTemp, groupedCables, installMethod, material, insulation);

  // 5. Calcular sección por criterio de Imax corregida
  const imaxTable = getImaxTable(material, insulation);
  let minSectionCurrent = 0.5;
  for (const [section, imax] of Object.entries(imaxTable)) {
    const izCorrected = imax * correctionFactor;
    if (izCorrected >= current) {
      minSectionCurrent = parseFloat(section);
      break;
    }
  }

  // 6. Tomar el máximo de ambos criterios
  const minSection = Math.max(minSectionVoltageDrop, minSectionCurrent);

  // 7. Sección normalizada recomendada
  const recommendedSection = getNextStandardSection(minSection);

  // 8. Caída de tensión real con sección recomendada
  const resistance = (resistivity * length) / recommendedSection;
  let realVoltageDrop: number;
  if (phases === 1) {
    realVoltageDrop = (2 * current * resistance * 100) / voltage;
  } else {
    realVoltageDrop = (Math.sqrt(3) * current * resistance * 100) / voltage;
  }

  // Imax corregida para la sección recomendada
  const izCorrected = (imaxTable[recommendedSection] ?? 0) * correctionFactor;

  return {
    current: Math.round(current * 100) / 100,
    minSection: Math.round(minSection * 100) / 100,
    recommendedSection,
    voltageDrop: Math.round(realVoltageDrop * 100) / 100,
    resistance: Math.round(resistance * 10000) / 10000,
    correctionFactor,
    izCorrected: Math.round(izCorrected * 100) / 100,
  };
}

/**
 * Obtiene la siguiente sección normalizada
 */
function getNextStandardSection(section: number): number {
  for (const std of STANDARD_SECTIONS) {
    if (std >= section) return std;
  }
  return STANDARD_SECTIONS[STANDARD_SECTIONS.length - 1];
}

/**
 * Valida coordinación PIA ↔ cable (ITC-BT-19)
 * Regla: In_PIA ≤ Iz_cable_corregida
 */
export interface ProtectionCoordinationResult {
  valid: boolean;
  izCorrected: number;   // Imax admisible del cable con correcciones (A)
  message: string;
}

export function validateProtectionCoordination(
  mcbRating: number,
  cableSection: number,
  material: 'Cu' | 'Al' = 'Cu',
  insulation: 'PVC' | 'XLPE' = 'PVC',
  correctionFactor: number = 1.0
): ProtectionCoordinationResult {
  const imaxTable = getImaxTable(material, insulation);
  const izTable = imaxTable[cableSection] ?? 0;
  const izCorrected = Math.round(izTable * correctionFactor * 100) / 100;
  const valid = mcbRating <= izCorrected;
  return {
    valid,
    izCorrected,
    message: valid
      ? `PIA ${mcbRating}A ≤ Iz ${izCorrected}A ✓`
      : `PIA ${mcbRating}A > Iz ${izCorrected}A — el PIA puede no proteger el cable`,
  };
}

/**
 * Calcula tensión de contacto (ITC-BT-24)
 * Uc = Rt × Idn   — debe ser ≤ 50V en sistemas TT
 */
export function calculateContactVoltage(
  earthResistance: number,  // Rt (Ω)
  rcdSensitivity: number    // Idn (mA)
): { contactVoltage: number; compliant: boolean; limit: number } {
  const contactVoltage = Math.round(earthResistance * (rcdSensitivity / 1000) * 100) / 100;
  return { contactVoltage, compliant: contactVoltage <= 50, limit: 50 };
}

/**
 * Calcula la intensidad nominal del interruptor general (IGA)
 * según potencia instalada y tipo de instalación
 */
export function calculateMainSwitchRating(
  installedPower: number,  // Potencia instalada (W)
  phases: number           // 1 = monofásico, 3 = trifásico
): number {
  // Intensidad = P / (V * √3) para trifásico
  // Intensidad = P / V para monofásico
  
  const voltage = phases === 1 ? 230 : 400;
  const current = phases === 1
    ? installedPower / voltage
    : installedPower / (Math.sqrt(3) * voltage);

  // Secciones normalizadas de IGA
  const standardRatings = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200];
  
  // Obtener el siguiente valor normalizado
  for (const rating of standardRatings) {
    if (rating >= current) {
      return rating;
    }
  }
  
  return standardRatings[standardRatings.length - 1];
}

/**
 * Calcula la resistencia máxima de tierra recomendada
 * según ITC-BT-18: Puesta a tierra
 */
export function calculateMaxEarthResistance(
  rcdRating: number  // Sensibilidad del diferencial (mA)
): number {
  // Fórmula: R = U / I
  // U = 50V (tensión de contacto segura)
  // I = corriente del diferencial (A)
  
  const safeVoltage = 50;
  const currentA = rcdRating / 1000;
  
  return Math.round((safeVoltage / currentA) * 10) / 10;
}

// ── Verificación del tiempo de disparo del diferencial ────────────────────────
// IEC 60755 + IEC 60364-4-41 / ITC-BT-24

export type RcdType = 'AC' | 'A' | 'S' | 'B';

export interface RcdTripTimeResult {
  measuredTimeMs: number;       // Tiempo medido (ms)
  maxTimeMs: number;            // Tiempo máximo admisible (ms)
  multiplier: number;           // Factor de prueba aplicado (1×, 2×, 5×Idn)
  sensitivityMa: number;        // Sensibilidad del diferencial (mA)
  rcdType: RcdType;             // Tipo de diferencial
  conforme: boolean;            // true si measuredTime ≤ maxTime
  standard: string;             // Norma de referencia
  margin?: number;              // Margen disponible (ms), solo si conforme
}

/**
 * Verifica si el tiempo de disparo medido cumple con IEC 60755.
 *
 * @param measuredTimeMs   Tiempo de disparo medido en la prueba (ms)
 * @param sensitivityMa    Sensibilidad nominal del diferencial (mA): 10/30/100/300
 * @param multiplier       Factor aplicado en la prueba: 1 (a Idn), 2 (a 2×Idn), 5 (a 5×Idn)
 * @param rcdType          Tipo de diferencial: AC (estándar), A (pulsante), S (selectivo/retardado), B (CC)
 */
export function verifyRcdTripTime(
  measuredTimeMs: number,
  sensitivityMa: number,
  multiplier: 1 | 2 | 5 = 1,
  rcdType: RcdType = 'AC'
): RcdTripTimeResult {
  // Tiempos máximos por IEC 60755 tabla 1 (tipo AC/A)
  // y tabla 2 (tipo S selectivo)
  let maxTimeMs: number;

  if (rcdType === 'S') {
    // Diferencial selectivo/retardado — IEC 60755 tabla 2
    if (multiplier === 1)      maxTimeMs = 500;
    else if (multiplier === 2) maxTimeMs = 200;
    else                       maxTimeMs = 150;
  } else {
    // Diferencial estándar (AC/A/B) — IEC 60755 tabla 1
    if (multiplier === 1)      maxTimeMs = 300;
    else if (multiplier === 2) maxTimeMs = 150;
    else                       maxTimeMs = 40;
  }

  const conforme = measuredTimeMs <= maxTimeMs;

  return {
    measuredTimeMs,
    maxTimeMs,
    multiplier,
    sensitivityMa,
    rcdType,
    conforme,
    standard: 'IEC 60755 / ITC-BT-24',
    margin: conforme ? maxTimeMs - measuredTimeMs : undefined,
  };
}

/**
 * Sugiere circuitos típicos según tipo de instalación
 */
export interface CircuitSuggestion {
  circuitNumber: string;
  circuitName: string;
  circuitType: string;
  installedPower: number;
  cableSection: number;
  mcbRating: number;
  mcbCurve: string;
  rcdRequired: boolean;
  explanation: string;
}

export function suggestCircuitsForInstallationType(
  installationType: string,
  installedPower: number
): CircuitSuggestion[] {
  const circuits: CircuitSuggestion[] = [];

  switch (installationType.toLowerCase()) {
    case 'vivienda unifamiliar':
    case 'vivienda_unifamiliar':
      // Circuitos típicos para vivienda unifamiliar
      circuits.push(
        {
          circuitNumber: 'C1',
          circuitName: 'Iluminación',
          circuitType: 'lighting',
          installedPower: 1000,
          cableSection: 1.5,
          mcbRating: 10,
          mcbCurve: 'C',
          rcdRequired: false,
          explanation: 'Circuito de iluminación general según ITC-BT-25'
        },
        {
          circuitNumber: 'C2',
          circuitName: 'Tomas uso general',
          circuitType: 'sockets',
          installedPower: 3500,
          cableSection: 2.5,
          mcbRating: 16,
          mcbCurve: 'C',
          rcdRequired: true,
          explanation: 'Tomas de corriente de uso general, requiere RCD'
        },
        {
          circuitNumber: 'C3',
          circuitName: 'Cocina',
          circuitType: 'appliances',
          installedPower: 5000,
          cableSection: 6,
          mcbRating: 25,
          mcbCurve: 'C',
          rcdRequired: false,
          explanation: 'Circuito dedicado para cocina eléctrica'
        },
        {
          circuitNumber: 'C4',
          circuitName: 'Lavadora/Lavavajillas',
          circuitType: 'appliances',
          installedPower: 2500,
          cableSection: 2.5,
          mcbRating: 16,
          mcbCurve: 'C',
          rcdRequired: true,
          explanation: 'Circuito para electrodomésticos con RCD'
        },
        {
          circuitNumber: 'C5',
          circuitName: 'Baños y cuartos de aseo',
          circuitType: 'sockets',
          installedPower: 1500,
          cableSection: 2.5,
          mcbRating: 16,
          mcbCurve: 'C',
          rcdRequired: true,
          explanation: 'Circuito obligatorio ITC-BT-25. Tomas en baños y aseos con protección diferencial de alta sensibilidad (30mA).'
        }
      );

      // Grado de electrificación elevado: añadir circuitos adicionales (ITC-BT-25)
      if (installedPower > 5750) {
        circuits.push({
          circuitNumber: 'C6',
          circuitName: 'Calefacción eléctrica',
          circuitType: 'hvac',
          installedPower: 3000,
          cableSection: 2.5,
          mcbRating: 16,
          mcbCurve: 'C',
          rcdRequired: false,
          explanation: 'Circuito para sistema de calefacción (electrificación elevada)'
        });
      }
      break;

    case 'local comercial':
    case 'local_comercial':
      circuits.push(
        {
          circuitNumber: 'C1',
          circuitName: 'Iluminación',
          circuitType: 'lighting',
          installedPower: 2000,
          cableSection: 2.5,
          mcbRating: 16,
          mcbCurve: 'C',
          rcdRequired: false,
          explanation: 'Iluminación general del local'
        },
        {
          circuitNumber: 'C2',
          circuitName: 'Tomas uso general',
          circuitType: 'sockets',
          installedPower: 5000,
          cableSection: 4,
          mcbRating: 20,
          mcbCurve: 'C',
          rcdRequired: true,
          explanation: 'Tomas de corriente con RCD'
        },
        {
          circuitNumber: 'C3',
          circuitName: 'Aire acondicionado',
          circuitType: 'hvac',
          installedPower: 3500,
          cableSection: 2.5,
          mcbRating: 16,
          mcbCurve: 'C',
          rcdRequired: false,
          explanation: 'Circuito dedicado para climatización'
        }
      );
      break;

    case 'nave industrial':
    case 'nave_industrial':
      circuits.push(
        {
          circuitNumber: 'C1',
          circuitName: 'Iluminación',
          circuitType: 'lighting',
          installedPower: 3000,
          cableSection: 4,
          mcbRating: 20,
          mcbCurve: 'C',
          rcdRequired: false,
          explanation: 'Iluminación industrial'
        },
        {
          circuitNumber: 'C2',
          circuitName: 'Tomas industriales',
          circuitType: 'sockets',
          installedPower: 10000,
          cableSection: 10,
          mcbRating: 50,
          mcbCurve: 'D',
          rcdRequired: true,
          explanation: 'Tomas de corriente trifásicas'
        }
      );
      break;

    default:
      // Circuitos genéricos por defecto
      circuits.push(
        {
          circuitNumber: 'C1',
          circuitName: 'Iluminación',
          circuitType: 'lighting',
          installedPower: 1000,
          cableSection: 1.5,
          mcbRating: 10,
          mcbCurve: 'C',
          rcdRequired: false,
          explanation: 'Circuito de iluminación'
        },
        {
          circuitNumber: 'C2',
          circuitName: 'Tomas uso general',
          circuitType: 'sockets',
          installedPower: 3500,
          cableSection: 2.5,
          mcbRating: 16,
          mcbCurve: 'C',
          rcdRequired: true,
          explanation: 'Tomas de corriente'
        }
      );
  }

  return circuits;
}

/**
 * Genera recomendaciones de protecciones generales
 */
export interface ProtectionSuggestion {
  mainSwitchRating: number;
  mainRcdRating: number;
  earthResistanceMax: number;
  explanation: string;
}

export function suggestProtections(
  installedPower: number,
  phases: number
): ProtectionSuggestion {
  const mainSwitchRating = calculateMainSwitchRating(installedPower, phases);
  
  // Sensibilidad del diferencial general
  // 30mA para instalaciones normales
  // 300mA para protección de masas en edificios
  const mainRcdRating = 30;
  
  const earthResistanceMax = calculateMaxEarthResistance(mainRcdRating);

  return {
    mainSwitchRating,
    mainRcdRating,
    earthResistanceMax,
    explanation: `Para una instalación de ${installedPower}W se recomienda IGA de ${mainSwitchRating}A, diferencial de ${mainRcdRating}mA y resistencia de tierra máxima de ${earthResistanceMax}Ω según ITC-BT-18.`
  };
}
