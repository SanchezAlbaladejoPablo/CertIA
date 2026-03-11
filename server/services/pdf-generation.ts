/**
 * Servicio de generación de PDF para certificados de instalación eléctrica.
 * Genera HTML optimizado para impresión/PDF desde el navegador.
 * El endpoint REST /api/pdf/:id sirve este HTML con window.print() automático.
 */

export interface CertificatePDFInput {
  certificateId: number;
  certificateNumber?: string;
  // Datos del titular
  clientName: string;
  clientDni?: string;
  clientAddress?: string;
  clientPhone?: string;
  // Datos instalación
  installationType: string;
  locationCategory?: string;
  electrificationGrade?: string;
  groundingSystem?: string;
  maxAdmissiblePower?: number;
  serviceCommissionDate?: string;
  lightingPointsCount?: number;
  outletsCount?: number;
  installationAddress: string;
  installationCity?: string;
  installationProvince?: string;
  postalCode?: string;
  cadastralReference?: string;
  cups?: string;
  supplyVoltage: number;
  supplyPhases: number;
  installedPower: number;
  mainSwitchRating: number;
  mainRcdRating: number;
  idSensitivity?: number;
  overvoltageProtection?: boolean;
  earthResistance: number;
  // Derivación Individual
  diLength: number;
  diCableSection: number;
  diCableMaterial: string;
  diCableInsulation?: string;
  ambientTemp?: number;
  installMethod?: string;
  // Mediciones
  insulationResistance: number;
  continuityContinuity: number;
  rcdTestCurrent: number;
  rcdTestTime: number;
  observations?: string;
  circuits: Array<{
    circuitNumber: string;
    circuitName: string;
    circuitType?: string;
    installedPower: number;
    length?: number;
    cableSection: number;
    cableMaterial?: string;
    cableInsulation?: string;
    mcbRating: number;
    mcbCurve?: string;
    rcdRequired: boolean;
    rcdRating?: number;
    loadDescription?: string;
  }>;
  mermaidDiagram?: string;
  // Datos del instalador autorizado
  installerFullName?: string;
  installerNumber?: string;
  installerCategory?: string;
  companyName?: string;
  companyNif?: string;
  companyAuthNumber?: string;
  installerName?: string; // legacy alias
  autonomousCommunity?: string;
  issueDate?: Date;
}

// ── ITCs aplicables según tipo de instalación (ITC-BT-03 / REBT) ────────────

interface ItcEntry { code: string; description: string }

function getApplicableITCs(installationType: string): ItcEntry[] {
  const type = (installationType || '').toLowerCase();

  const base: ItcEntry[] = [
    { code: 'ITC-BT-01', description: 'Terminología' },
    { code: 'ITC-BT-02', description: 'Normas de referencia' },
    { code: 'ITC-BT-04', description: 'Documentación y puesta en servicio' },
    { code: 'ITC-BT-05', description: 'Verificaciones e inspecciones' },
    { code: 'ITC-BT-08', description: 'Sistemas de conexión del neutro y masas' },
    { code: 'ITC-BT-10', description: 'Previsión de cargas para suministros en baja tensión' },
    { code: 'ITC-BT-11', description: 'Redes de distribución de energía eléctrica' },
    { code: 'ITC-BT-12', description: 'Instalaciones de enlace — Esquemas' },
    { code: 'ITC-BT-13', description: 'Instalaciones de enlace — Cajas generales de protección' },
    { code: 'ITC-BT-14', description: 'Instalaciones de enlace — Línea general de alimentación' },
    { code: 'ITC-BT-15', description: 'Instalaciones de enlace — Derivaciones individuales' },
    { code: 'ITC-BT-16', description: 'Instalaciones de enlace — Contadores' },
    { code: 'ITC-BT-17', description: 'Dispositivos generales e individuales de mando y protección' },
    { code: 'ITC-BT-18', description: 'Instalaciones de puesta a tierra' },
    { code: 'ITC-BT-19', description: 'Instalaciones interiores — Prescripciones generales' },
    { code: 'ITC-BT-20', description: 'Instalaciones interiores — Sistemas de instalación' },
    { code: 'ITC-BT-21', description: 'Instalaciones interiores — Tubos protectores' },
    { code: 'ITC-BT-22', description: 'Protección contra sobreintensidades' },
    { code: 'ITC-BT-23', description: 'Protección contra sobretensiones' },
    { code: 'ITC-BT-24', description: 'Protección contra contactos eléctricos' },
    { code: 'ITC-BT-43', description: 'Receptores — Prescripciones generales' },
    { code: 'ITC-BT-44', description: 'Receptores para alumbrado' },
  ];

  const isVivienda = /vivienda|residencial|doméstico|domestico|piso|apartamento|chalet/.test(type);
  const isIndustrial = /industrial|industria|nave|fábrica|fabrica|almacén|almacen/.test(type);
  const isComercial = /comercial|local|oficina|tienda|restaurante|hostelería|hosteleria|hotel|público|publico/.test(type);

  if (isVivienda) {
    return [
      ...base,
      { code: 'ITC-BT-25', description: 'Instalaciones interiores en viviendas — Número de circuitos y características' },
      { code: 'ITC-BT-26', description: 'Instalaciones interiores en viviendas — Prescripciones generales' },
      { code: 'ITC-BT-47', description: 'Receptores — Motores' },
      { code: 'ITC-BT-51', description: 'Sistemas de automatización, gestión técnica de la energía y seguridad' },
    ];
  }

  if (isIndustrial) {
    return [
      ...base,
      { code: 'ITC-BT-29', description: 'Prescripciones para locales con riesgo de incendio o explosión' },
      { code: 'ITC-BT-47', description: 'Receptores — Motores' },
      { code: 'ITC-BT-48', description: 'Receptores — Transformadores, reactancias y rectificadores' },
    ];
  }

  if (isComercial) {
    return [
      ...base,
      { code: 'ITC-BT-25', description: 'Instalaciones interiores en viviendas — Número de circuitos y características' },
      { code: 'ITC-BT-28', description: 'Instalaciones en locales de pública concurrencia' },
      { code: 'ITC-BT-47', description: 'Receptores — Motores' },
    ];
  }

  // Genérico
  return [
    ...base,
    { code: 'ITC-BT-25', description: 'Instalaciones interiores — Número de circuitos y características' },
    { code: 'ITC-BT-26', description: 'Instalaciones interiores — Prescripciones generales' },
  ];
}

const INSTALL_METHOD_LABELS: Record<string, string> = {
  air: 'Al aire libre',
  surface_conduit: 'Bajo tubo en superficie',
  embedded_wall: 'Empotrado en pared',
  embedded_conduit: 'Bajo tubo empotrado',
  perforated_tray: 'Bandeja perforada',
  solid_tray: 'Bandeja no perforada',
};

/**
 * Genera HTML completo del certificado, listo para imprimir/exportar a PDF.
 * Incluye window.print() automático cuando se abre en nueva pestaña.
 */
export function generateCertificateHTML(input: CertificatePDFInput, autoPrint = false): string {
  const {
    certificateNumber,
    clientName,
    clientDni,
    clientAddress,
    clientPhone,
    installationType,
    locationCategory,
    electrificationGrade,
    groundingSystem,
    installationAddress,
    installationCity,
    installationProvince,
    postalCode,
    cadastralReference,
    cups,
    supplyVoltage,
    supplyPhases,
    installedPower,
    mainSwitchRating,
    mainRcdRating,
    idSensitivity,
    overvoltageProtection,
    earthResistance,
    diLength,
    diCableSection,
    diCableMaterial,
    diCableInsulation,
    ambientTemp,
    installMethod,
    insulationResistance,
    continuityContinuity,
    rcdTestCurrent,
    rcdTestTime,
    observations,
    circuits,
    installerFullName,
    installerName,
    installerNumber,
    installerCategory,
    companyName,
    companyNif,
    companyAuthNumber,
    autonomousCommunity,
    issueDate,
  } = input;

  const displayInstallerName = installerFullName || installerName || '';
  const phaseText = supplyPhases === 1 ? 'Monofásico (230V)' : 'Trifásico (400V)';
  const issueDateStr = issueDate
    ? new Date(issueDate).toLocaleDateString('es-ES')
    : new Date().toLocaleDateString('es-ES');
  const installMethodLabel = installMethod ? (INSTALL_METHOD_LABELS[installMethod] || installMethod) : '-';

  const circuitRows = circuits
    .map(
      (c) => `
    <tr>
      <td>${c.circuitNumber}</td>
      <td>${c.circuitName}${c.circuitType ? `<br><span class="sub">${c.circuitType}</span>` : ''}</td>
      <td class="num">${c.installedPower}W</td>
      <td class="num">${c.length != null ? c.length + 'm' : '-'}</td>
      <td class="num">${c.cableSection}mm²${c.cableMaterial ? ` ${c.cableMaterial}` : ''}${c.cableInsulation ? `/${c.cableInsulation}` : ''}</td>
      <td class="num">${c.mcbRating}A${c.mcbCurve ? ` (${c.mcbCurve})` : ''}</td>
      <td class="center">${c.rcdRequired ? `Sí${c.rcdRating ? ' ' + c.rcdRating + 'mA' : ''}` : 'No'}</td>
    </tr>
  `
    )
    .join('');

  const autoPrintScript = autoPrint
    ? `<script>window.addEventListener('load', () => { setTimeout(() => window.print(), 300); });</script>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CIE ${certificateNumber || ''} - ${clientName}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #111;
      background: #e5e5e5;
    }

    @media print {
      body { background: white; }
      .no-print { display: none !important; }
      .page { box-shadow: none !important; margin: 0 !important; }
      @page { size: A4 portrait; margin: 12mm 15mm; }
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 10mm auto;
      padding: 14mm 16mm 18mm;
      background: white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.18);
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1565c0;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .header-title h1 {
      font-size: 16px;
      color: #1565c0;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .header-title p { font-size: 9px; color: #555; margin-top: 2px; }
    .header-cert {
      text-align: right;
      font-size: 9px;
      color: #444;
    }
    .header-cert .cert-num {
      font-size: 13px;
      font-weight: 700;
      color: #1565c0;
      display: block;
      margin-bottom: 2px;
    }

    /* ── Sections ── */
    .section { margin-bottom: 12px; }
    .section-title {
      font-size: 9.5px;
      font-weight: 700;
      color: white;
      background: #1565c0;
      padding: 4px 10px;
      border-radius: 2px;
      margin-bottom: 7px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .section-content { padding: 0 4px; }

    /* ── Field grid ── */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin-bottom: 5px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 18px; margin-bottom: 5px; }
    .grid-1 { display: grid; grid-template-columns: 1fr; gap: 5px; margin-bottom: 5px; }

    .field { }
    .field-label { font-size: 8px; font-weight: 700; color: #1565c0; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 1px; }
    .field-value { font-size: 10.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; min-height: 16px; color: #111; }
    .field-value.empty { color: #999; }

    /* ── Circuits table ── */
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9px; }
    thead tr { background: #e3f0ff; }
    th {
      padding: 5px 6px;
      text-align: left;
      font-weight: 700;
      color: #1565c0;
      border: 1px solid #90caf9;
      font-size: 8.5px;
      text-transform: uppercase;
    }
    td {
      padding: 4px 6px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #f7fbff; }
    td.num { text-align: right; white-space: nowrap; }
    td.center { text-align: center; }
    .sub { color: #666; font-size: 8px; }

    /* ── Measurements highlight ── */
    .meas-box {
      background: #f0f7ff;
      border: 1px solid #90caf9;
      border-radius: 3px;
      padding: 7px 10px;
    }

    /* ── Observations ── */
    .obs-box {
      background: #fafafa;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 7px 10px;
      font-size: 10px;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    /* ── Declaration ── */
    .declaration {
      background: #fffde7;
      border: 1px solid #f9a825;
      border-radius: 3px;
      padding: 8px 10px;
      font-size: 9px;
      line-height: 1.6;
      color: #444;
    }
    .declaration strong { color: #1565c0; }
    .itc-list { margin: 6px 0 4px; line-height: 2; }
    .itc-badge {
      display: inline-block;
      background: #e3f0ff;
      color: #1565c0;
      border: 1px solid #90caf9;
      border-radius: 3px;
      padding: 1px 5px;
      font-size: 8px;
      font-weight: 700;
      margin: 1px 2px 1px 0;
      white-space: nowrap;
    }

    /* ── Signature ── */
    .signature-area {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 18px;
    }
    .signature-box {
      border-top: 1.5px solid #555;
      padding-top: 28px;
      text-align: center;
      font-size: 9px;
    }
    .signature-box strong { display: block; font-size: 9.5px; margin-bottom: 3px; }

    /* ── Footer ── */
    .footer {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #ccc;
      font-size: 8px;
      color: #888;
      text-align: center;
    }

    /* ── Print hint ── */
    .print-hint {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #1565c0;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      font-family: Arial, sans-serif;
      z-index: 9999;
    }
  </style>
  ${autoPrintScript}
</head>
<body>
  <button class="no-print print-hint" onclick="window.print()">🖨 Guardar como PDF</button>

  <div class="page">
    <!-- HEADER -->
    <div class="header">
      <div class="header-title">
        <h1>CERTIFICADO DE INSTALACIÓN ELÉCTRICA</h1>
        <p>Según Reglamento Electrotécnico para Baja Tensión (REBT) — Real Decreto 842/2002</p>
        <p>Instrucciones Técnicas Complementarias ITC-BT-05, ITC-BT-25, ITC-BT-30</p>
      </div>
      <div class="header-cert">
        ${certificateNumber ? `<span class="cert-num">${certificateNumber}</span>` : ''}
        <div>Fecha de emisión</div>
        <div style="font-weight:700;">${issueDateStr}</div>
      </div>
    </div>

    <!-- DATOS DEL INSTALADOR AUTORIZADO -->
    <div class="section">
      <div class="section-title">Datos del Instalador Autorizado</div>
      <div class="section-content">
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Nombre del instalador</div>
            <div class="field-value">${displayInstallerName || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Nº Carnet RITSIC</div>
            <div class="field-value">${installerNumber || '-'}</div>
          </div>
        </div>
        <div class="grid-3">
          <div class="field">
            <div class="field-label">Categoría</div>
            <div class="field-value">${installerCategory || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Empresa instaladora</div>
            <div class="field-value">${companyName || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">CIF/NIF empresa</div>
            <div class="field-value">${companyNif || '-'}</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Nº autorización empresa</div>
            <div class="field-value">${companyAuthNumber || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Comunidad Autónoma</div>
            <div class="field-value">${autonomousCommunity || '-'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- DATOS DEL TITULAR -->
    <div class="section">
      <div class="section-title">Datos del Titular</div>
      <div class="section-content">
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Nombre / Razón Social</div>
            <div class="field-value">${clientName || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">DNI / NIF</div>
            <div class="field-value">${clientDni || '-'}</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Dirección del titular</div>
            <div class="field-value">${clientAddress || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Teléfono</div>
            <div class="field-value">${clientPhone || '-'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- DATOS DE LA INSTALACIÓN -->
    <div class="section">
      <div class="section-title">Datos de la Instalación</div>
      <div class="section-content">
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Tipo de instalación</div>
            <div class="field-value">${installationType || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Tensión de suministro</div>
            <div class="field-value">${supplyVoltage}V — ${phaseText}</div>
          </div>
        </div>
        <div class="grid-3">
          <div class="field">
            <div class="field-label">Clasificación local (ITC-BT-30)</div>
            <div class="field-value">${locationCategory || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Sistema puesta a tierra (ITC-BT-08)</div>
            <div class="field-value">${groundingSystem || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Grado electrificación (ITC-BT-25)</div>
            <div class="field-value">${electrificationGrade || '-'}</div>
          </div>
        </div>
        <div class="grid-1">
          <div class="field">
            <div class="field-label">Dirección de la instalación</div>
            <div class="field-value">${installationAddress || '-'}</div>
          </div>
        </div>
        <div class="grid-3">
          <div class="field">
            <div class="field-label">Código Postal</div>
            <div class="field-value">${postalCode || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Municipio</div>
            <div class="field-value">${installationCity || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Provincia</div>
            <div class="field-value">${installationProvince || '-'}</div>
          </div>
        </div>
        ${cadastralReference || cups ? `
        <div class="grid-2">
          ${cadastralReference ? `<div class="field"><div class="field-label">Referencia Catastral</div><div class="field-value">${cadastralReference}</div></div>` : '<div></div>'}
          ${cups ? `<div class="field"><div class="field-label">CUPS</div><div class="field-value">${cups}</div></div>` : ''}
        </div>` : ''}
      </div>
    </div>

    <!-- CARACTERÍSTICAS ELÉCTRICAS -->
    <div class="section">
      <div class="section-title">Características Eléctricas del Cuadro</div>
      <div class="section-content">
        <div class="grid-3">
          <div class="field">
            <div class="field-label">Potencia instalada</div>
            <div class="field-value">${installedPower} W</div>
          </div>
          <div class="field">
            <div class="field-label">IGA — Interruptor General</div>
            <div class="field-value">${mainSwitchRating} A</div>
          </div>
          <div class="field">
            <div class="field-label">ID — Diferencial general</div>
            <div class="field-value">${mainRcdRating} A / ${idSensitivity != null ? idSensitivity + ' mA' : '-'}</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Resistencia de tierra</div>
            <div class="field-value">${earthResistance} Ω</div>
          </div>
          <div class="field">
            <div class="field-label">Protección sobretensión (ITC-BT-23)</div>
            <div class="field-value">${overvoltageProtection != null ? (overvoltageProtection ? 'Sí — Instalada' : 'No requerida') : '-'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- DERIVACIÓN INDIVIDUAL -->
    <div class="section">
      <div class="section-title">Derivación Individual (ITC-BT-15)</div>
      <div class="section-content">
        <div class="grid-3">
          <div class="field">
            <div class="field-label">Longitud</div>
            <div class="field-value">${diLength} m</div>
          </div>
          <div class="field">
            <div class="field-label">Sección de cable</div>
            <div class="field-value">${diCableSection} mm²</div>
          </div>
          <div class="field">
            <div class="field-label">Material / Aislamiento</div>
            <div class="field-value">${diCableMaterial}${diCableInsulation ? ' / ' + diCableInsulation : ''}</div>
          </div>
        </div>
        ${ambientTemp != null || installMethod ? `
        <div class="grid-2">
          ${ambientTemp != null ? `<div class="field"><div class="field-label">Temperatura ambiente</div><div class="field-value">${ambientTemp} °C</div></div>` : '<div></div>'}
          ${installMethod ? `<div class="field"><div class="field-label">Método de instalación (ITC-BT-19)</div><div class="field-value">${installMethodLabel}</div></div>` : ''}
        </div>` : ''}
      </div>
    </div>

    <!-- CIRCUITOS -->
    <div class="section">
      <div class="section-title">Circuitos Interiores (ITC-BT-25)</div>
      <div class="section-content">
        <table>
          <thead>
            <tr>
              <th>Nº</th>
              <th>Circuito / Tipo</th>
              <th>Potencia</th>
              <th>Longitud</th>
              <th>Cable</th>
              <th>PIA (curva)</th>
              <th>RCD</th>
            </tr>
          </thead>
          <tbody>
            ${circuitRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- MEDICIONES ELÉCTRICAS -->
    <div class="section">
      <div class="section-title">Mediciones Eléctricas (ITC-BT-05)</div>
      <div class="section-content meas-box">
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Resistencia de aislamiento (≥0,5 MΩ)</div>
            <div class="field-value">${insulationResistance} MΩ</div>
          </div>
          <div class="field">
            <div class="field-label">Continuidad de conductores de protección</div>
            <div class="field-value">${continuityContinuity} Ω</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Test diferencial — Corriente de disparo</div>
            <div class="field-value">${rcdTestCurrent} mA (1×I<sub>dn</sub>)</div>
          </div>
          <div class="field">
            <div class="field-label">Test diferencial — Tiempo de disparo</div>
            <div class="field-value" style="display:flex;align-items:center;gap:8px;">
              <span>${rcdTestTime} ms</span>
              <span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;${
                rcdTestTime <= 300
                  ? 'background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;'
                  : 'background:#ffebee;color:#c62828;border:1px solid #ef9a9a;'
              }">
                ${rcdTestTime <= 300 ? `CONFORME ≤300ms` : `NO CONFORME — máx. 300ms`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${observations ? `
    <!-- OBSERVACIONES -->
    <div class="section">
      <div class="section-title">Observaciones</div>
      <div class="section-content">
        <div class="obs-box">${observations.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>
    </div>` : ''}

    <!-- DECLARACIÓN DE CONFORMIDAD CON ITCs APLICABLES -->
    <div class="section">
      <div class="section-title">Declaración de Conformidad — ITCs Aplicables (ITC-BT-03)</div>
      <div class="section-content">
        <div class="declaration">
          El abajo firmante declara que la instalación eléctrica descrita en el presente certificado
          ha sido ejecutada conforme al <strong>Reglamento Electrotécnico para Baja Tensión</strong>
          (Real Decreto 842/2002, BOE núm. 224) y las siguientes Instrucciones Técnicas
          Complementarias de aplicación para el tipo de instalación
          <strong>${installationType}</strong>:
          <div class="itc-list">
            ${getApplicableITCs(installationType).map(itc =>
              `<span class="itc-badge" title="${itc.description}">${itc.code}</span>`
            ).join('')}
          </div>
          La instalación ha superado todas las pruebas y verificaciones reglamentarias
          establecidas en la <strong>ITC-BT-05</strong>.
        </div>
      </div>
    </div>

    <!-- FIRMAS -->
    <div class="signature-area">
      <div class="signature-box">
        <strong>Firma del Instalador Autorizado</strong>
        <div style="border-bottom:1px solid #666; width:180px; margin: 20px 0 6px;"></div>
        ${displayInstallerName ? `<div>${displayInstallerName}</div>` : ''}
        ${installerNumber ? `<div>Carnet RITSIC: ${installerNumber}</div>` : ''}
        ${installerCategory ? `<div>Categoría: ${installerCategory}</div>` : ''}
        ${companyName ? `<div>${companyName}</div>` : ''}
        ${companyAuthNumber ? `<div>Nº Aut. Empresa: ${companyAuthNumber}</div>` : ''}
      </div>
      <div class="signature-box">
        <strong>Firma del Titular</strong>
        <div>${clientName}</div>
        ${clientDni ? `<div>DNI/NIF: ${clientDni}</div>` : ''}
        <div style="margin-top:3px; font-size:8.5px; color:#777;">Conforme con la instalación realizada</div>
      </div>
    </div>

    <div class="footer">
      <p>Certificado generado por <strong>CertIA</strong> — Plataforma de Certificación para Instaladores Eléctricos</p>
      <p>Este documento tiene validez legal según el REBT (Real Decreto 842/2002)</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Stub mantenido por compatibilidad. La generación real de PDF
 * se hace via navegador con window.print() desde el endpoint /api/pdf/:id
 */
export async function convertHTMLToPDF(_html: string): Promise<Buffer> {
  return Buffer.from('Use /api/pdf/:id endpoint to get the printable HTML');
}

/**
 * Genera un PDF real usando Puppeteer a partir del HTML del certificado.
 * Requiere puppeteer instalado (pnpm add puppeteer).
 */
export async function generateCertificatePDF(html: string): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', bottom: '15mm', left: '15mm', right: '15mm' },
  });
  await browser.close();
  return Buffer.from(pdf);
}

/**
 * Genera HTML de la hoja de verificaciones y ensayos (acta de inspección).
 * Documento independiente, firmable por separado.
 */
export function generateTestsSheetHTML(input: CertificatePDFInput): string {
  const { certificateNumber, clientName, installationType, installationAddress, installerFullName, installerName, installerNumber, companyName, insulationResistance, continuityContinuity, rcdTestCurrent, rcdTestTime, earthResistance, observations, issueDate } = input;
  const displayInstallerName = installerFullName || installerName || '';
  const issueDateStr = issueDate ? new Date(issueDate).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Hoja de Ensayos ${certificateNumber || ''}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; background: #e5e5e5; color: #111; }
    @media print { body { background: white; } .no-print { display: none !important; } @page { size: A4; margin: 12mm 15mm; } }
    .page { width: 210mm; min-height: 297mm; margin: 10mm auto; padding: 14mm 16mm; background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.18); }
    h1 { font-size: 14px; color: #1565c0; border-bottom: 2px solid #1565c0; padding-bottom: 8px; margin-bottom: 12px; }
    h2 { font-size: 10px; color: white; background: #1565c0; padding: 4px 10px; margin: 14px 0 8px; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin-bottom: 10px; font-size: 10px; }
    .field-label { font-size: 8px; color: #1565c0; font-weight: 700; text-transform: uppercase; }
    .field-value { border-bottom: 1px solid #ccc; min-height: 16px; padding-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 6px; }
    th { background: #e3f0ff; color: #1565c0; font-size: 8.5px; text-transform: uppercase; padding: 5px 8px; border: 1px solid #90caf9; text-align: left; }
    td { border: 1px solid #ddd; padding: 8px 8px; vertical-align: top; }
    .result-ok { color: #2e7d32; font-weight: 700; }
    .result-fail { color: #c62828; font-weight: 700; }
    .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
    .sig-box { border-top: 1.5px solid #555; padding-top: 30px; text-align: center; font-size: 9px; }
    .obs { background: #fafafa; border: 1px solid #ddd; border-radius: 3px; padding: 8px; min-height: 60px; font-size: 10px; white-space: pre-wrap; margin-top: 6px; }
    .print-hint { position: fixed; top: 10px; right: 10px; background: #1565c0; color: white; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; z-index: 9999; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <button class="no-print print-hint" onclick="window.print()">🖨 Guardar como PDF</button>
  <div class="page">
    <h1>HOJA DE VERIFICACIONES Y ENSAYOS<br><span style="font-size:10px;font-weight:normal;">Certificado de Instalación Eléctrica — ITC-BT-05</span></h1>
    <div class="info">
      <div><div class="field-label">Nº Certificado</div><div class="field-value">${certificateNumber || '-'}</div></div>
      <div><div class="field-label">Fecha</div><div class="field-value">${issueDateStr}</div></div>
      <div><div class="field-label">Titular</div><div class="field-value">${clientName || '-'}</div></div>
      <div><div class="field-label">Dirección instalación</div><div class="field-value">${installationAddress || '-'}</div></div>
      <div><div class="field-label">Tipo de instalación</div><div class="field-value">${installationType || '-'}</div></div>
      <div><div class="field-label">Instalador</div><div class="field-value">${displayInstallerName || '-'} ${installerNumber ? '(Carnet: ' + installerNumber + ')' : ''}</div></div>
    </div>

    <h2>Mediciones eléctricas (ITC-BT-05)</h2>
    <table>
      <thead>
        <tr><th>Ensayo</th><th>Norma / Límite</th><th>Valor medido</th><th>Resultado</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Resistencia de aislamiento</td>
          <td>ITC-BT-19 / ≥ 0,5 MΩ</td>
          <td>${insulationResistance} MΩ</td>
          <td class="${insulationResistance >= 0.5 ? 'result-ok' : 'result-fail'}">${insulationResistance >= 0.5 ? 'CONFORME' : 'NO CONFORME'}</td>
        </tr>
        <tr>
          <td>Continuidad conductores de protección</td>
          <td>ITC-BT-19 / ≤ 1 Ω</td>
          <td>${continuityContinuity} Ω</td>
          <td class="${continuityContinuity <= 1 ? 'result-ok' : 'result-fail'}">${continuityContinuity <= 1 ? 'CONFORME' : 'NO CONFORME'}</td>
        </tr>
        <tr>
          <td>Resistencia de tierra</td>
          <td>ITC-BT-18 / según diferencial</td>
          <td>${earthResistance} Ω</td>
          <td class="result-ok">MEDIDA</td>
        </tr>
        <tr>
          <td>Test diferencial — Corriente de disparo</td>
          <td>IEC 60755 / ≤ sensibilidad nominal</td>
          <td>${rcdTestCurrent} mA</td>
          <td class="result-ok">CONFORME</td>
        </tr>
        <tr>
          <td>Test diferencial — Tiempo de disparo</td>
          <td>IEC 60755 / ≤ 300 ms</td>
          <td>${rcdTestTime} ms</td>
          <td class="${rcdTestTime <= 300 ? 'result-ok' : 'result-fail'}">${rcdTestTime <= 300 ? 'CONFORME' : 'NO CONFORME'}</td>
        </tr>
      </tbody>
    </table>

    <h2>Observaciones</h2>
    <div class="obs">${observations ? observations.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Sin observaciones adicionales.'}</div>

    <div class="sig">
      <div class="sig-box">
        <strong>Firma del Instalador Autorizado</strong>
        ${displayInstallerName ? `<div>${displayInstallerName}</div>` : ''}
        ${installerNumber ? `<div>Carnet: ${installerNumber}</div>` : ''}
        ${companyName ? `<div>${companyName}</div>` : ''}
      </div>
      <div class="sig-box">
        <strong>Firma del Titular</strong>
        <div>${clientName}</div>
        <div style="margin-top:3px; font-size:8.5px; color:#777;">Conforme con las verificaciones realizadas</div>
      </div>
    </div>

    <div style="margin-top:14px; border-top:1px solid #ccc; padding-top:8px; font-size:8px; color:#888; text-align:center;">
      Documento generado por <strong>CertIA</strong> — Hoja de verificaciones según ITC-BT-05
    </div>
  </div>
</body>
</html>`;
}

// ── Selector de plantilla por Comunidad Autónoma ────────────────────────────
/**
 * Genera el HTML del CIE usando la plantilla oficial de la CCAA si existe,
 * o la plantilla genérica en caso contrario.
 */
export async function generateCertificateHTMLByCCAA(input: CertificatePDFInput, ccaa?: string): Promise<string> {
  switch ((ccaa || '').toLowerCase()) {
    case 'murcia': {
      const { generateMurciaCertificateHTML } = await import('./templates/murcia');
      return generateMurciaCertificateHTML(input);
    }
    case 'madrid': {
      const { generateMadridCertificateHTML } = await import('./templates/madrid');
      return generateMadridCertificateHTML(input);
    }
    case 'cataluña':
    case 'cataluna':
    case 'catalunya': {
      const { generateCatalunaCertificateHTML } = await import('./templates/cataluna');
      return generateCatalunaCertificateHTML(input);
    }
    case 'andalucía':
    case 'andalucia': {
      const { generateAndaluciaCertificateHTML } = await import('./templates/andalucia');
      return generateAndaluciaCertificateHTML(input);
    }
    case 'comunidad valenciana':
    case 'valencia': {
      const { generateValenciaCertificateHTML } = await import('./templates/valencia');
      return generateValenciaCertificateHTML(input);
    }
    case 'país vasco':
    case 'pais vasco':
    case 'euskadi': {
      const { generatePaisVascoCertificateHTML } = await import('./templates/paisvasco');
      return generatePaisVascoCertificateHTML(input);
    }
    default:
      return generateCertificateHTML(input);
  }
}
