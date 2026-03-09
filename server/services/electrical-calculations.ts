/**
 * Funciones de cálculos eléctricos según REBT (Reglamento Electrotécnico para Baja Tensión)
 */

export interface CableCalculationResult {
  current: number;              // Intensidad calculada (A)
  minSection: number;           // Sección mínima reglamentaria (mm²)
  recommendedSection: number;   // Sección normalizada recomendada (mm²)
  voltageDrop: number;          // Caída de tensión real (%)
  resistance: number;           // Resistencia del cable (Ω)
}

// Secciones normalizadas de cable (mm²)
const STANDARD_SECTIONS = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

// Tabla ITC-BT-19: Intensidad máxima admisible para cables de cobre (A)
// Formato: { section: intensidad }
const COPPER_INTENSITY_TABLE: Record<number, number> = {
  0.5: 6,
  0.75: 10,
  1: 13,
  1.5: 16,
  2.5: 20,
  4: 25,
  6: 32,
  10: 44,
  16: 57,
  25: 76,
  35: 92,
  50: 119,
  70: 154,
  95: 193,
  120: 227,
  150: 261,
  185: 299,
  240: 356,
};

// Tabla ITC-BT-19: Intensidad máxima admisible para cables de aluminio (A)
const ALUMINUM_INTENSITY_TABLE: Record<number, number> = {
  0.5: 5,
  0.75: 8,
  1: 10,
  1.5: 13,
  2.5: 16,
  4: 20,
  6: 25,
  10: 34,
  16: 44,
  25: 59,
  35: 71,
  50: 92,
  70: 119,
  95: 149,
  120: 176,
  150: 202,
  185: 231,
  240: 276,
};

/**
 * Calcula la sección mínima de cable según REBT
 * ITC-BT-07: Redes subterráneas de distribución
 * ITC-BT-19: Protección contra sobreintensidades
 */
export function calculateCableSection(
  power: number,          // Potencia (W)
  voltage: number,        // Tensión (V)
  phases: number,         // 1 = monofásico, 3 = trifásico
  length: number,         // Longitud (m)
  material: 'Cu' | 'Al',  // Material conductor
  maxVoltageDrop: number = 3 // Máxima caída de tensión permitida (%)
): CableCalculationResult {
  
  // 1. Calcular intensidad (A)
  const current = phases === 1
    ? power / voltage
    : power / (Math.sqrt(3) * voltage);

  // 2. Resistividad del material (Ω·mm²/m a 20°C)
  const resistivity = material === 'Cu' ? 0.01724 : 0.028264;

  // 3. Calcular sección por criterio de caída de tensión
  const voltageDrop = (voltage * maxVoltageDrop) / 100;
  
  let minSectionVoltageDrop: number;
  
  if (phases === 1) {
    // Fórmula monofásica: S = 2 * I * L * ρ / e
    minSectionVoltageDrop = (2 * current * length * resistivity) / voltageDrop;
  } else {
    // Fórmula trifásica: S = √3 * I * L * ρ / e
    minSectionVoltageDrop = (Math.sqrt(3) * current * length * resistivity) / voltageDrop;
  }

  // 4. Calcular sección por criterio de intensidad máxima admisible
  const intensityTable = material === 'Cu' ? COPPER_INTENSITY_TABLE : ALUMINUM_INTENSITY_TABLE;
  
  let minSectionCurrent = 0.5;
  for (const [section, maxCurrent] of Object.entries(intensityTable)) {
    if (parseFloat(section) >= current) {
      minSectionCurrent = parseFloat(section);
      break;
    }
  }
  
  // 5. Tomar el máximo de ambos criterios
  const minSection = Math.max(minSectionVoltageDrop, minSectionCurrent);

  // 6. Obtener sección normalizada recomendada
  const recommendedSection = getNextStandardSection(minSection);

  // 7. Calcular caída de tensión real con la sección recomendada
  const resistance = (resistivity * length) / recommendedSection;
  
  let realVoltageDrop: number;
  if (phases === 1) {
    realVoltageDrop = (2 * current * resistance * 100) / voltage;
  } else {
    realVoltageDrop = (Math.sqrt(3) * current * resistance * 100) / voltage;
  }

  return {
    current: Math.round(current * 100) / 100,
    minSection: Math.round(minSection * 100) / 100,
    recommendedSection,
    voltageDrop: Math.round(realVoltageDrop * 100) / 100,
    resistance: Math.round(resistance * 10000) / 10000,
  };
}

/**
 * Obtiene la siguiente sección normalizada
 */
function getNextStandardSection(section: number): number {
  for (const std of STANDARD_SECTIONS) {
    if (std >= section) {
      return std;
    }
  }
  return STANDARD_SECTIONS[STANDARD_SECTIONS.length - 1];
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
        }
      );
      
      // Agregar circuitos adicionales según potencia
      if (installedPower > 5000) {
        circuits.push({
          circuitNumber: 'C5',
          circuitName: 'Calefacción',
          circuitType: 'hvac',
          installedPower: 3000,
          cableSection: 2.5,
          mcbRating: 16,
          mcbCurve: 'C',
          rcdRequired: false,
          explanation: 'Circuito para sistema de calefacción'
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
