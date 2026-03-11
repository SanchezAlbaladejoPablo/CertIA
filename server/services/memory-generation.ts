import type { CertificatePDFInput } from './pdf-generation';

/**
 * Genera HTML de la memoria técnica abreviada según ITC-BT.
 */
export function generateMemoryHTML(input: CertificatePDFInput): string {
  const {
    certificateNumber,
    clientName,
    clientDni,
    installationType,
    installationAddress,
    installationCity,
    installationProvince,
    postalCode,
    supplyVoltage,
    supplyPhases,
    installedPower,
    mainSwitchRating,
    mainRcdRating,
    idSensitivity,
    groundingSystem,
    earthResistance,
    diLength,
    diCableSection,
    diCableMaterial,
    diCableInsulation,
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
  const phaseText = supplyPhases === 1 ? 'Monofásico (230 V)' : 'Trifásico (400 V)';
  const issueDateStr = issueDate
    ? new Date(issueDate).toLocaleDateString('es-ES')
    : new Date().toLocaleDateString('es-ES');

  const circuitRows = circuits
    .map(
      (c) => `
    <tr>
      <td>${c.circuitNumber}</td>
      <td>${c.circuitName}${c.circuitType ? ` (${c.circuitType})` : ''}</td>
      <td>${c.installedPower} W</td>
      <td>${c.length != null ? c.length + ' m' : '-'}</td>
      <td>${c.cableSection} mm²${c.cableMaterial ? ' ' + c.cableMaterial : ''}${c.cableInsulation ? '/' + c.cableInsulation : ''}</td>
      <td>${c.mcbRating} A${c.mcbCurve ? ' (' + c.mcbCurve + ')' : ''}</td>
      <td>${c.rcdRequired ? 'Sí' + (c.rcdRating ? ' ' + c.rcdRating + ' mA' : '') : 'No'}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Memoria Técnica ${certificateNumber || ''} - ${clientName}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.6; color: #111; background: #e5e5e5; }
    @media print {
      body { background: white; }
      .no-print { display: none !important; }
      .page { box-shadow: none !important; margin: 0 !important; }
      @page { size: A4 portrait; margin: 12mm 15mm; }
    }
    .page { width: 210mm; min-height: 297mm; margin: 10mm auto; padding: 14mm 16mm 18mm; background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.18); }
    .header { border-bottom: 3px solid #1565c0; padding-bottom: 10px; margin-bottom: 14px; }
    .header h1 { font-size: 13px; color: #1565c0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
    .header p { font-size: 9px; color: #555; margin-top: 3px; }
    .header-meta { display: flex; justify-content: space-between; align-items: flex-start; }
    .cert-num { font-size: 12px; font-weight: 700; color: #1565c0; }
    .section { margin-bottom: 14px; }
    .section-title { font-size: 9.5px; font-weight: 700; color: white; background: #1565c0; padding: 4px 10px; border-radius: 2px; margin-bottom: 7px; letter-spacing: 0.5px; text-transform: uppercase; }
    .section-body { padding: 0 4px; font-size: 10.5px; line-height: 1.7; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin-bottom: 5px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 18px; margin-bottom: 5px; }
    .field-label { font-size: 8px; font-weight: 700; color: #1565c0; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 1px; }
    .field-value { font-size: 10.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; min-height: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 6px; }
    thead tr { background: #e3f0ff; }
    th { padding: 5px 6px; text-align: left; font-weight: 700; color: #1565c0; border: 1px solid #90caf9; font-size: 8.5px; text-transform: uppercase; }
    td { padding: 4px 6px; border: 1px solid #ddd; vertical-align: top; }
    tr:nth-child(even) td { background: #f7fbff; }
    .declaration { background: #fffde7; border: 1px solid #f9a825; border-radius: 3px; padding: 8px 10px; font-size: 9px; line-height: 1.6; color: #444; }
    .declaration strong { color: #1565c0; }
    .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 18px; }
    .signature-box { border-top: 1.5px solid #555; padding-top: 28px; text-align: center; font-size: 9px; }
    .signature-box strong { display: block; font-size: 9.5px; margin-bottom: 3px; }
    .footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 8px; color: #888; text-align: center; }
    .print-hint { position: fixed; top: 10px; right: 10px; background: #1565c0; color: white; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.25); font-family: Arial, sans-serif; z-index: 9999; }
  </style>
</head>
<body>
  <button class="no-print print-hint" onclick="window.print()">🖨 Guardar como PDF</button>
  <div class="page">

    <div class="header">
      <div class="header-meta">
        <div>
          <h1>MEMORIA TÉCNICA ABREVIADA</h1>
          <h1 style="font-size:11px; font-weight:600; margin-top:2px;">INSTALACIÓN ELÉCTRICA DE BAJA TENSIÓN</h1>
          <p>Según Reglamento Electrotécnico para Baja Tensión (REBT) — Real Decreto 842/2002</p>
          ${autonomousCommunity ? `<p>Comunidad Autónoma: <strong>${autonomousCommunity}</strong></p>` : ''}
        </div>
        <div style="text-align:right; font-size:9px; color:#444;">
          ${certificateNumber ? `<div class="cert-num">${certificateNumber}</div>` : ''}
          <div>Fecha: <strong>${issueDateStr}</strong></div>
        </div>
      </div>
    </div>

    <!-- 1. OBJETO -->
    <div class="section">
      <div class="section-title">1. Objeto</div>
      <div class="section-body">
        <p>La presente Memoria Técnica Abreviada tiene por objeto describir las características de la instalación eléctrica de baja tensión correspondiente a <strong>${installationType || 'instalación'}</strong>, ubicada en <strong>${installationAddress || '-'}${installationCity ? ', ' + installationCity : ''}${installationProvince ? ' (' + installationProvince + ')' : ''}${postalCode ? ' — CP ' + postalCode : ''}</strong>, propiedad de <strong>${clientName || '-'}${clientDni ? ' (DNI/NIF: ' + clientDni + ')' : ''}</strong>.</p>
      </div>
    </div>

    <!-- 2. NORMATIVA -->
    <div class="section">
      <div class="section-title">2. Normativa Aplicable</div>
      <div class="section-body">
        <ul style="padding-left:18px; list-style:disc;">
          <li>Real Decreto 842/2002 — Reglamento Electrotécnico para Baja Tensión (REBT)</li>
          <li>ITC-BT-05: Verificaciones e inspecciones</li>
          <li>ITC-BT-08: Sistemas de conexión del neutro y de las masas en redes de distribución de energía eléctrica</li>
          <li>ITC-BT-15: Instalaciones de enlace — Derivaciones individuales</li>
          <li>ITC-BT-18: Instalaciones de puesta a tierra</li>
          <li>ITC-BT-19: Instalaciones interiores o receptoras — Prescripciones generales</li>
          <li>ITC-BT-23: Protección contra sobretensiones</li>
          <li>ITC-BT-24: Protección contra contactos directos e indirectos</li>
          <li>ITC-BT-25: Instalaciones interiores en viviendas</li>
          <li>UNE-EN 60364 — Instalaciones eléctricas de baja tensión</li>
        </ul>
      </div>
    </div>

    <!-- 3. DESCRIPCIÓN -->
    <div class="section">
      <div class="section-title">3. Descripción de la Instalación</div>
      <div class="section-body">
        <div class="grid-3">
          <div>
            <div class="field-label">Tipo de instalación</div>
            <div class="field-value">${installationType || '-'}</div>
          </div>
          <div>
            <div class="field-label">Tensión suministro</div>
            <div class="field-value">${supplyVoltage} V — ${phaseText}</div>
          </div>
          <div>
            <div class="field-label">Potencia instalada</div>
            <div class="field-value">${installedPower} W</div>
          </div>
        </div>
        <div class="grid-3">
          <div>
            <div class="field-label">IGA</div>
            <div class="field-value">${mainSwitchRating} A</div>
          </div>
          <div>
            <div class="field-label">ID General</div>
            <div class="field-value">${mainRcdRating} A / ${idSensitivity != null ? idSensitivity + ' mA' : '-'}</div>
          </div>
          <div>
            <div class="field-label">Sistema puesta a tierra</div>
            <div class="field-value">${groundingSystem || '-'}</div>
          </div>
        </div>
        <div class="grid-2">
          <div>
            <div class="field-label">Resistencia de tierra</div>
            <div class="field-value">${earthResistance} Ω</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. DERIVACIÓN INDIVIDUAL -->
    <div class="section">
      <div class="section-title">4. Derivación Individual (ITC-BT-15)</div>
      <div class="section-body">
        <div class="grid-3">
          <div>
            <div class="field-label">Longitud</div>
            <div class="field-value">${diLength} m</div>
          </div>
          <div>
            <div class="field-label">Sección de cable</div>
            <div class="field-value">${diCableSection} mm²</div>
          </div>
          <div>
            <div class="field-label">Material / Aislamiento</div>
            <div class="field-value">${diCableMaterial}${diCableInsulation ? ' / ' + diCableInsulation : ''}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. CIRCUITOS INTERIORES -->
    <div class="section">
      <div class="section-title">5. Circuitos Interiores (ITC-BT-25)</div>
      <div class="section-body">
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

    <!-- 6. PROTECCIONES -->
    <div class="section">
      <div class="section-title">6. Protecciones</div>
      <div class="section-body">
        <p>La instalación cuenta con las siguientes protecciones según el REBT:</p>
        <ul style="padding-left:18px; list-style:disc; margin-top:6px;">
          <li><strong>IGA (Interruptor General Automático):</strong> ${mainSwitchRating} A — Protección contra sobrecargas y cortocircuitos en el cuadro general.</li>
          <li><strong>ID (Interruptor Diferencial):</strong> ${mainRcdRating} A / ${idSensitivity != null ? idSensitivity + ' mA' : '-'} — Protección contra contactos indirectos (ITC-BT-24).</li>
          <li><strong>PIAs por circuito:</strong> Interruptores magnetotérmicos individuales para cada circuito según tabla anterior.</li>
          <li><strong>Puesta a tierra:</strong> Sistema ${groundingSystem || 'TT'} según ITC-BT-08 e ITC-BT-18. Resistencia medida: ${earthResistance} Ω.</li>
        </ul>
      </div>
    </div>

    <!-- 7. MEDICIONES Y VERIFICACIONES -->
    <div class="section">
      <div class="section-title">7. Mediciones y Verificaciones (ITC-BT-05)</div>
      <div class="section-body">
        <div class="grid-2">
          <div>
            <div class="field-label">Resistencia de aislamiento (≥ 0,5 MΩ)</div>
            <div class="field-value">${insulationResistance} MΩ — ${insulationResistance >= 0.5 ? 'CONFORME' : 'NO CONFORME'}</div>
          </div>
          <div>
            <div class="field-label">Continuidad conductores de protección (≤ 1 Ω)</div>
            <div class="field-value">${continuityContinuity} Ω — ${continuityContinuity <= 1 ? 'CONFORME' : 'NO CONFORME'}</div>
          </div>
        </div>
        <div class="grid-2">
          <div>
            <div class="field-label">Test diferencial — Corriente de disparo</div>
            <div class="field-value">${rcdTestCurrent} mA</div>
          </div>
          <div>
            <div class="field-label">Test diferencial — Tiempo de disparo (≤ 300 ms)</div>
            <div class="field-value">${rcdTestTime} ms — ${rcdTestTime <= 300 ? 'CONFORME' : 'NO CONFORME'}</div>
          </div>
        </div>
      </div>
    </div>

    ${observations ? `
    <!-- OBSERVACIONES -->
    <div class="section">
      <div class="section-title">Observaciones</div>
      <div class="section-body">
        <div style="background:#fafafa; border:1px solid #ddd; border-radius:3px; padding:7px 10px; white-space:pre-wrap;">${observations.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>
    </div>` : ''}

    <!-- 8. DECLARACIÓN DE CONFORMIDAD -->
    <div class="section">
      <div class="section-title">8. Declaración de Conformidad</div>
      <div class="section-body">
        <div class="declaration">
          El instalador autorizado abajo firmante certifica que la instalación eléctrica descrita en la presente
          Memoria Técnica Abreviada ha sido ejecutada conforme al <strong>Reglamento Electrotécnico para Baja Tensión</strong>
          (Real Decreto 842/2002) y sus Instrucciones Técnicas Complementarias aplicables, habiendo superado todas
          las pruebas y verificaciones reglamentarias establecidas en la <strong>ITC-BT-05</strong>.
        </div>
      </div>
    </div>

    <!-- FIRMAS -->
    <div class="signature-area">
      <div class="signature-box">
        <strong>Instalador Autorizado</strong>
        ${displayInstallerName ? `<div>${displayInstallerName}</div>` : ''}
        ${installerNumber ? `<div>Carnet RITSIC: ${installerNumber}</div>` : ''}
        ${installerCategory ? `<div>Categoría: ${installerCategory}</div>` : ''}
        ${companyName ? `<div>${companyName}</div>` : ''}
        ${companyNif ? `<div>CIF/NIF: ${companyNif}</div>` : ''}
        ${companyAuthNumber ? `<div>Nº Aut: ${companyAuthNumber}</div>` : ''}
      </div>
      <div class="signature-box">
        <strong>Titular de la Instalación</strong>
        <div>${clientName}</div>
        ${clientDni ? `<div>DNI/NIF: ${clientDni}</div>` : ''}
      </div>
    </div>

    <div class="footer">
      <p>Memoria Técnica Abreviada generada por <strong>CertIA</strong> — Plataforma de Certificación para Instaladores Eléctricos</p>
      <p>Documento con validez legal según el REBT (Real Decreto 842/2002)</p>
    </div>
  </div>
</body>
</html>`;
}
