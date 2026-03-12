import type { CertificatePDFInput } from './pdf-generation';
import {
  calculateCableSection,
  validateProtectionCoordination,
  getCorrectionFactor,
  INSTALL_METHODS,
} from './electrical-calculations';

interface CircuitReport {
  circuitNumber: string;
  circuitName: string;
  // Entradas
  power: number;
  length: number;
  material: string;
  insulation: string;
  ambientTemp: number;
  installMethod: string;
  groupedCables: number;
  // Resultados
  designCurrent: number;
  correctionFactor: number;
  izCorrected: number;
  minSectionByCurrent: number;
  minSectionByVoltageDrop: number;
  adoptedSection: number;
  voltageDrop: number;
  mcbRating: number;
  piaCoordinationValid: boolean;
  piaCoordinationMessage: string;
}

/**
 * Re-ejecuta los cálculos REBT por circuito y genera un informe técnico
 * justificativo de secciones, protecciones y caídas de tensión.
 */
export function generateCalculationReportHTML(input: CertificatePDFInput): string {
  const ambientTemp = input.ambientTemp ?? 30;
  const installMethod = input.installMethod ?? 'air';
  const groupedCables = 1;
  const voltage = input.supplyVoltage ?? 230;
  const phases = input.supplyPhases ?? 1;
  const issueDate = input.issueDate
    ? new Date(input.issueDate).toLocaleDateString('es-ES')
    : new Date().toLocaleDateString('es-ES');

  const circuitReports: CircuitReport[] = input.circuits.map(c => {
    const mat = (c.cableMaterial ?? 'Cu') as 'Cu' | 'Al';
    const ins = (c.cableInsulation ?? 'PVC') as 'PVC' | 'XLPE';
    const len = c.length ?? 0;
    const power = c.installedPower ?? 0;

    const calc = calculateCableSection(
      power, voltage, 1, len, mat, 3, ins, ambientTemp, groupedCables, installMethod
    );

    const coord = validateProtectionCoordination(c.mcbRating ?? 0, c.cableSection ?? 0, mat, ins, calc.correctionFactor);

    return {
      circuitNumber: c.circuitNumber,
      circuitName: c.circuitName,
      power,
      length: len,
      material: mat,
      insulation: ins,
      ambientTemp,
      installMethod,
      groupedCables,
      designCurrent: Math.round(calc.current * 100) / 100,
      correctionFactor: calc.correctionFactor,
      izCorrected: Math.round(calc.izCorrected * 100) / 100,
      minSectionByCurrent: calc.minSection,
      minSectionByVoltageDrop: Math.round(
        ((2 * calc.current * len * (mat === 'Cu' ? 0.02365 : 0.03817)) / (voltage * 0.03)) * 100
      ) / 100,
      adoptedSection: c.cableSection ?? calc.recommendedSection,
      voltageDrop: calc.voltageDrop,
      mcbRating: c.mcbRating ?? 0,
      piaCoordinationValid: coord.valid,
      piaCoordinationMessage: coord.message,
    };
  });

  const installMethodLabel = INSTALL_METHODS[installMethod]?.label ?? installMethod;

  const circuitRows = circuitReports.map(r => `
    <tr class="${r.piaCoordinationValid ? '' : 'row-error'}">
      <td>${r.circuitNumber}</td>
      <td>${r.circuitName}</td>
      <td class="num">${r.power}</td>
      <td class="num">${r.length}</td>
      <td>${r.material} / ${r.insulation}</td>
      <td class="num">${r.designCurrent}</td>
      <td class="num">${r.correctionFactor}</td>
      <td class="num">${r.izCorrected}</td>
      <td class="num">${r.minSectionByCurrent}</td>
      <td class="num">${r.minSectionByVoltageDrop}</td>
      <td class="num bold">${r.adoptedSection}</td>
      <td class="num">${r.voltageDrop.toFixed(2)}%</td>
      <td class="num">${r.mcbRating}</td>
      <td class="${r.piaCoordinationValid ? 'ok' : 'error'}">
        ${r.piaCoordinationValid ? '✓ Correcto' : '✗ ' + r.piaCoordinationMessage}
      </td>
    </tr>
  `).join('');

  const hasErrors = circuitReports.some(r => !r.piaCoordinationValid);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Informe de Cálculo REBT — ${input.certificateNumber ?? 'S/N'}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; padding: 20px; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    h2 { font-size: 12px; margin: 18px 0 6px; border-bottom: 1px solid #333; padding-bottom: 3px; }
    h3 { font-size: 11px; margin: 12px 0 4px; color: #444; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
    .header-left h1 { font-size: 15px; }
    .header-right { text-align: right; font-size: 9px; color: #555; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: bold; }
    .badge-ok { background: #d1fae5; color: #065f46; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
    .field-group { margin-bottom: 6px; }
    .field-label { font-size: 9px; color: #666; text-transform: uppercase; }
    .field-value { font-size: 10px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9px; }
    th { background: #1e3a5f; color: white; padding: 4px 5px; text-align: center; font-weight: bold; }
    td { border: 1px solid #ddd; padding: 3px 5px; text-align: left; }
    tr:nth-child(even) td { background: #f9f9f9; }
    td.num { text-align: right; }
    td.ok { color: #065f46; font-weight: bold; }
    td.error { color: #991b1b; font-weight: bold; font-size: 8px; }
    td.bold { font-weight: bold; }
    tr.row-error td { background: #fff5f5 !important; }
    .warning-box { background: #fff3cd; border: 1px solid #ffc107; padding: 8px 10px; margin: 10px 0; border-radius: 4px; }
    .warning-box p { font-size: 9px; color: #856404; }
    .normas { font-size: 9px; color: #444; line-height: 1.6; }
    .footer { margin-top: 24px; border-top: 1px solid #ccc; padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .firma-box { border: 1px solid #ccc; padding: 8px; min-height: 50px; }
    .firma-label { font-size: 9px; color: #666; margin-bottom: 4px; }
    @media print { body { padding: 10mm; } }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <h1>INFORME DE CÁLCULO REBT</h1>
      <p style="font-size:9px; color:#555;">Justificación técnica de secciones y protecciones</p>
      <p style="font-size:9px; margin-top:4px;">
        CIE nº <strong>${input.certificateNumber ?? 'S/N'}</strong> &nbsp;|&nbsp; Fecha: ${issueDate}
      </p>
    </div>
    <div class="header-right">
      <strong>${input.companyName ?? input.installerFullName ?? 'Instalador'}</strong><br/>
      ${input.companyNif ? 'CIF: ' + input.companyNif + '<br/>' : ''}
      ${input.installerNumber ? 'Nº instalador: ' + input.installerNumber + '<br/>' : ''}
      ${input.autonomousCommunity ? input.autonomousCommunity : ''}
    </div>
  </div>

  <h2>1. Datos generales de la instalación</h2>
  <div class="grid2">
    <div>
      <div class="field-group">
        <div class="field-label">Titular</div>
        <div class="field-value">${input.clientName} ${input.clientDni ? '(' + input.clientDni + ')' : ''}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Tipo de instalación</div>
        <div class="field-value">${input.installationType}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Emplazamiento</div>
        <div class="field-value">${input.installationAddress}${input.installationCity ? ', ' + input.installationCity : ''}</div>
      </div>
    </div>
    <div>
      <div class="field-group">
        <div class="field-label">Tensión de suministro</div>
        <div class="field-value">${input.supplyVoltage} V — ${input.supplyPhases === 3 ? 'Trifásico' : 'Monofásico'}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Potencia instalada</div>
        <div class="field-value">${input.installedPower} W</div>
      </div>
      <div class="field-group">
        <div class="field-label">IGA / Diferencial principal</div>
        <div class="field-value">${input.mainSwitchRating} A / ${input.mainRcdRating} mA</div>
      </div>
    </div>
  </div>

  <h3>Condiciones de instalación (factores de corrección ITC-BT-19)</h3>
  <table style="max-width:500px;">
    <tr>
      <th>Parámetro</th><th>Valor</th><th>Factor</th>
    </tr>
    <tr>
      <td>Temperatura ambiente</td>
      <td class="num">${ambientTemp} °C</td>
      <td class="num">kt — según ITC-BT-07 Tabla 6</td>
    </tr>
    <tr>
      <td>Método de instalación</td>
      <td>${installMethodLabel}</td>
      <td class="num">ki — según ITC-BT-19</td>
    </tr>
    <tr>
      <td>Cables agrupados</td>
      <td class="num">${groupedCables}</td>
      <td class="num">kg — según ITC-BT-07 Tabla 7</td>
    </tr>
  </table>

  <h2>2. Normas y criterios aplicados</h2>
  <div class="normas">
    <strong>Normas de referencia:</strong><br/>
    • ITC-BT-07: Redes subterráneas — Resistividades a temperatura de servicio<br/>
    • ITC-BT-15: Derivación individual — Caída de tensión máxima 1%<br/>
    • ITC-BT-19: Instalaciones interiores — Tablas Imax, factores de corrección kt, kg, ki<br/>
    • ITC-BT-24: Protección contra contactos — Tensión de contacto ≤ 50 V<br/>
    • ITC-BT-25: Instalaciones interiores viviendas — Circuitos y PIA mínimos<br/>
    • UNE 211435: Guía para la elección de cables eléctricos<br/><br/>
    <strong>Criterios de cálculo:</strong><br/>
    • Caída de tensión máxima admisible: 3% en circuitos interiores, 1% en derivación individual<br/>
    • Se adopta la sección más desfavorable entre criterio de corriente e criterio de caída de tensión<br/>
    • Coordinación PIA ↔ cable: I_PIA ≤ Iz_corregida (ITC-BT-19 art. 3)<br/>
    • Temperatura de referencia para factores de temperatura: 30°C
  </div>

  <h2>3. Tabla de cálculo por circuito</h2>
  ${hasErrors ? `
    <div class="warning-box">
      <p>⚠️ Se han detectado circuitos con coordinación PIA ↔ cable incorrecta (marcados en rojo).
      La corriente del PIA supera la capacidad máxima admisible corregida del cable, lo que puede
      implicar que el cable no quede protegido. Revisar antes de emitir el CIE.</p>
    </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        <th rowspan="2">Nº</th>
        <th rowspan="2">Circuito</th>
        <th colspan="4">Datos de entrada</th>
        <th colspan="4">Criterio corriente (ITC-BT-19)</th>
        <th colspan="3">Resultado</th>
        <th rowspan="2">Coordinación PIA ↔ cable</th>
      </tr>
      <tr>
        <th>P (W)</th>
        <th>L (m)</th>
        <th>Mat.</th>
        <th>Id (A)</th>
        <th>F. corr.</th>
        <th>Iz corr. (A)</th>
        <th>S_I (mm²)</th>
        <th>S_U (mm²)</th>
        <th>S adopt. (mm²)</th>
        <th>ΔU (%)</th>
        <th>PIA (A)</th>
      </tr>
    </thead>
    <tbody>
      ${circuitRows}
    </tbody>
  </table>
  <p style="font-size:8px; color:#666; margin-top:4px;">
    Id = Intensidad de diseño &nbsp;|&nbsp; F. corr. = Factor de corrección kt×kg×ki &nbsp;|&nbsp;
    Iz corr. = Imax admisible corregida &nbsp;|&nbsp; S_I = Sección mínima por corriente &nbsp;|&nbsp;
    S_U = Sección mínima por caída de tensión &nbsp;|&nbsp; S adopt. = Sección adoptada &nbsp;|&nbsp; ΔU = Caída de tensión real
  </p>

  <h2>4. Justificación IGA y RCD</h2>
  <table style="max-width:500px;">
    <tr><th>Elemento</th><th>Valor adoptado</th><th>Justificación</th></tr>
    <tr>
      <td>IGA (Interruptor General Automático)</td>
      <td class="num bold">${input.mainSwitchRating} A</td>
      <td>In_IGA ≥ I_total instalación — ITC-BT-25</td>
    </tr>
    <tr>
      <td>RCD principal (Diferencial)</td>
      <td class="num bold">${input.mainRcdRating} mA</td>
      <td>Sensibilidad según ITC-BT-24</td>
    </tr>
    <tr>
      <td>Sistema de puesta a tierra</td>
      <td class="num bold">${input.groundingSystem ?? 'TT'}</td>
      <td>ITC-BT-08 / ITC-BT-18</td>
    </tr>
  </table>

  <h2>5. Sistema de tierra (ITC-BT-24)</h2>
  <table style="max-width:500px;">
    <tr><th>Parámetro</th><th>Valor medido</th><th>Límite reglamentario</th><th>Resultado</th></tr>
    <tr>
      <td>Resistencia de tierra (Rt)</td>
      <td class="num">${input.earthResistance} Ω</td>
      <td class="num">${Math.round(50 / ((input.mainRcdRating ?? 30) / 1000))} Ω máx. (Uc ≤ 50 V)</td>
      <td class="${input.earthResistance <= Math.round(50 / ((input.mainRcdRating ?? 30) / 1000)) ? 'ok' : 'error'}">
        ${input.earthResistance <= Math.round(50 / ((input.mainRcdRating ?? 30) / 1000)) ? '✓ CONFORME' : '✗ NO CONFORME'}
      </td>
    </tr>
    <tr>
      <td>Tensión de contacto (Uc = Rt × Idn)</td>
      <td class="num">${Math.round(input.earthResistance * ((input.mainRcdRating ?? 30) / 1000) * 10) / 10} V</td>
      <td class="num">≤ 50 V</td>
      <td class="${input.earthResistance * ((input.mainRcdRating ?? 30) / 1000) <= 50 ? 'ok' : 'error'}">
        ${input.earthResistance * ((input.mainRcdRating ?? 30) / 1000) <= 50 ? '✓ CONFORME' : '✗ NO CONFORME'}
      </td>
    </tr>
  </table>

  <div class="footer">
    <div>
      <div class="firma-label">Instalador autorizado</div>
      <div class="firma-box">
        <p><strong>${input.installerFullName ?? input.installerName ?? '—'}</strong></p>
        ${input.installerNumber ? '<p>Nº: ' + input.installerNumber + '</p>' : ''}
        ${input.installerCategory ? '<p>Categoría: ' + input.installerCategory + '</p>' : ''}
      </div>
    </div>
    <div>
      <div class="firma-label">Empresa instaladora</div>
      <div class="firma-box">
        <p><strong>${input.companyName ?? '—'}</strong></p>
        ${input.companyNif ? '<p>CIF: ' + input.companyNif + '</p>' : ''}
        ${input.companyAuthNumber ? '<p>Nº autorización: ' + input.companyAuthNumber + '</p>' : ''}
      </div>
    </div>
  </div>

</body>
</html>`;
}
