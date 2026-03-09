/**
 * Servicio de generación de PDF para certificados de instalación eléctrica
 */

export interface CertificatePDFInput {
  certificateId: number;
  certificateNumber?: string;
  clientName: string;
  clientDni?: string;
  clientAddress?: string;
  clientPhone?: string;
  installationType: string;
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
  earthResistance: number;
  diLength: number;
  diCableSection: number;
  diCableMaterial: string;
  insulationResistance: number;
  continuityContinuity: number;
  rcdTestCurrent: number;
  rcdTestTime: number;
  observations?: string;
  circuits: Array<{
    circuitNumber: string;
    circuitName: string;
    installedPower: number;
    cableSection: number;
    mcbRating: number;
    rcdRequired: boolean;
  }>;
  mermaidDiagram?: string;
  installerName?: string;
  installerNumber?: string;
  issueDate?: Date;
}

/**
 * Genera HTML para el certificado (que puede convertirse a PDF)
 */
export function generateCertificateHTML(input: CertificatePDFInput): string {
  const {
    certificateNumber,
    clientName,
    clientDni,
    clientAddress,
    clientPhone,
    installationType,
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
    earthResistance,
    diLength,
    diCableSection,
    diCableMaterial,
    insulationResistance,
    continuityContinuity,
    rcdTestCurrent,
    rcdTestTime,
    observations,
    circuits,
    installerName,
    installerNumber,
    issueDate,
  } = input;

  const phaseText = supplyPhases === 1 ? 'Monofásico' : 'Trifásico';
  const issueDateStr = issueDate ? new Date(issueDate).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');

  const circuitRows = circuits
    .map(
      (c) => `
    <tr>
      <td>${c.circuitNumber}</td>
      <td>${c.circuitName}</td>
      <td>${c.installedPower}W</td>
      <td>${c.cableSection}mm²</td>
      <td>${c.mcbRating}A</td>
      <td>${c.rcdRequired ? 'Sí' : 'No'}</td>
    </tr>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado de Instalación Eléctrica</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    
    .page {
      width: 210mm;
      height: 297mm;
      margin: 10mm auto;
      padding: 20mm;
      background-color: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
    }
    
    @media print {
      .page {
        margin: 0;
        box-shadow: none;
      }
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #2196F3;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 24px;
      color: #2196F3;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 11px;
      color: #666;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: white;
      background-color: #2196F3;
      padding: 8px 12px;
      margin-bottom: 10px;
      border-radius: 3px;
    }
    
    .section-content {
      padding: 0 10px;
    }
    
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 10px;
    }
    
    .field-row.full {
      grid-template-columns: 1fr;
    }
    
    .field {
      font-size: 11px;
    }
    
    .field-label {
      font-weight: bold;
      color: #2196F3;
      margin-bottom: 3px;
    }
    
    .field-value {
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 3px;
      min-height: 20px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-top: 10px;
    }
    
    table th {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 8px;
      text-align: left;
      border: 1px solid #90caf9;
      font-weight: bold;
    }
    
    table td {
      padding: 8px;
      border: 1px solid #e0e0e0;
    }
    
    table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    .observations {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 3px;
      font-size: 10px;
      line-height: 1.5;
      min-height: 40px;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 9px;
      color: #666;
      text-align: center;
    }
    
    .signature-area {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 30px;
      font-size: 10px;
    }
    
    .signature-box {
      text-align: center;
      border-top: 1px solid #333;
      padding-top: 30px;
      min-height: 60px;
    }
    
    .signature-label {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>CERTIFICADO DE INSTALACIÓN ELÉCTRICA</h1>
      <p>Según Reglamento Electrotécnico para Baja Tensión (REBT)</p>
      <p>Real Decreto 842/2002</p>
      ${certificateNumber ? `<p style="margin-top: 10px;"><strong>Nº Certificado: ${certificateNumber}</strong></p>` : ''}
    </div>
    
    <!-- DATOS DEL TITULAR -->
    <div class="section">
      <div class="section-title">DATOS DEL TITULAR</div>
      <div class="section-content">
        <div class="field-row">
          <div class="field">
            <div class="field-label">Nombre / Razón Social</div>
            <div class="field-value">${clientName || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">DNI / NIF</div>
            <div class="field-value">${clientDni || '-'}</div>
          </div>
        </div>
        <div class="field-row full">
          <div class="field">
            <div class="field-label">Dirección</div>
            <div class="field-value">${clientAddress || '-'}</div>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <div class="field-label">Teléfono</div>
            <div class="field-value">${clientPhone || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Fecha de emisión</div>
            <div class="field-value">${issueDateStr}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- DATOS DE LA INSTALACIÓN -->
    <div class="section">
      <div class="section-title">DATOS DE LA INSTALACIÓN</div>
      <div class="section-content">
        <div class="field-row">
          <div class="field">
            <div class="field-label">Tipo de instalación</div>
            <div class="field-value">${installationType || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Tensión de suministro</div>
            <div class="field-value">${supplyVoltage}V ${phaseText}</div>
          </div>
        </div>
        <div class="field-row full">
          <div class="field">
            <div class="field-label">Dirección de la instalación</div>
            <div class="field-value">${installationAddress || '-'}</div>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <div class="field-label">Código Postal</div>
            <div class="field-value">${postalCode || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Municipio</div>
            <div class="field-value">${installationCity || '-'}</div>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <div class="field-label">Provincia</div>
            <div class="field-value">${installationProvince || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Referencia Catastral</div>
            <div class="field-value">${cadastralReference || '-'}</div>
          </div>
        </div>
        ${cups ? `
        <div class="field-row full">
          <div class="field">
            <div class="field-label">CUPS</div>
            <div class="field-value">${cups}</div>
          </div>
        </div>
        ` : ''}
      </div>
    </div>
    
    <!-- CARACTERÍSTICAS ELÉCTRICAS -->
    <div class="section">
      <div class="section-title">CARACTERÍSTICAS ELÉCTRICAS</div>
      <div class="section-content">
        <div class="field-row">
          <div class="field">
            <div class="field-label">Potencia instalada</div>
            <div class="field-value">${installedPower}W</div>
          </div>
          <div class="field">
            <div class="field-label">Interruptor General (IGA)</div>
            <div class="field-value">${mainSwitchRating}A</div>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <div class="field-label">Diferencial General (ID)</div>
            <div class="field-value">${mainRcdRating}mA</div>
          </div>
          <div class="field">
            <div class="field-label">Resistencia de tierra</div>
            <div class="field-value">${earthResistance}Ω</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- DERIVACIÓN INDIVIDUAL -->
    <div class="section">
      <div class="section-title">DERIVACIÓN INDIVIDUAL</div>
      <div class="section-content">
        <div class="field-row">
          <div class="field">
            <div class="field-label">Longitud</div>
            <div class="field-value">${diLength}m</div>
          </div>
          <div class="field">
            <div class="field-label">Sección de cable</div>
            <div class="field-value">${diCableSection}mm²</div>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <div class="field-label">Material</div>
            <div class="field-value">${diCableMaterial}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CIRCUITOS -->
    <div class="section">
      <div class="section-title">CIRCUITOS</div>
      <div class="section-content">
        <table>
          <thead>
            <tr>
              <th>Nº</th>
              <th>Nombre</th>
              <th>Potencia (W)</th>
              <th>Sección (mm²)</th>
              <th>PIA (A)</th>
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
      <div class="section-title">MEDICIONES ELÉCTRICAS</div>
      <div class="section-content">
        <div class="field-row">
          <div class="field">
            <div class="field-label">Resistencia de aislamiento</div>
            <div class="field-value">${insulationResistance}MΩ</div>
          </div>
          <div class="field">
            <div class="field-label">Resistencia de continuidad</div>
            <div class="field-value">${continuityContinuity}Ω</div>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <div class="field-label">Test RCD - Corriente</div>
            <div class="field-value">${rcdTestCurrent}mA</div>
          </div>
          <div class="field">
            <div class="field-label">Test RCD - Tiempo</div>
            <div class="field-value">${rcdTestTime}ms</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- OBSERVACIONES -->
    ${observations ? `
    <div class="section">
      <div class="section-title">OBSERVACIONES</div>
      <div class="section-content">
        <div class="observations">${observations.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    ` : ''}
    
    <!-- FIRMA DEL INSTALADOR -->
    <div class="signature-area">
      <div class="signature-box">
        <div style="min-height: 40px;"></div>
        <div class="signature-label">Firma del Instalador</div>
        ${installerName ? `<div style="font-size: 9px; margin-top: 5px;">${installerName}</div>` : ''}
        ${installerNumber ? `<div style="font-size: 9px;">${installerNumber}</div>` : ''}
      </div>
      <div class="signature-box">
        <div style="min-height: 40px;"></div>
        <div class="signature-label">Firma del Titular</div>
      </div>
    </div>
    
    <div class="footer">
      <p>Certificado generado por CertIA - Plataforma de Certificación Eléctrica</p>
      <p>Este documento tiene validez según el REBT (Real Decreto 842/2002)</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Convierte HTML a PDF (requiere librería externa como html2pdf o puppeteer)
 * Esta es una función stub que retorna el HTML
 * En producción, se usaría una librería como html2pdf o puppeteer
 */
export async function convertHTMLToPDF(html: string): Promise<Buffer> {
  // En una implementación real, aquí se usaría:
  // - html2pdf (librería de Node.js)
  // - puppeteer (headless browser)
  // - wkhtmltopdf (herramienta CLI)
  
  // Por ahora, retornamos un buffer vacío como placeholder
  // El HTML puede ser descargado directamente desde el navegador
  return Buffer.from('PDF generation requires additional setup');
}
