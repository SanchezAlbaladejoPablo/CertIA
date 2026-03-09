/**
 * Servicio de generación de esquemas unifilares en formato Mermaid
 */

export interface DiagramGenerationInput {
  installationType: string;
  supplyVoltage: number;
  supplyPhases: number;
  groundingSystem: string;
  mainSwitchRating: number;
  mainRcdRating: number;
  circuits: Array<{
    circuitNumber: string;
    circuitName: string;
    installedPower: number;
    cableSection: number;
    mcbRating: number;
    rcdRequired: boolean;
  }>;
}

/**
 * Genera código Mermaid para un esquema unifilar eléctrico
 */
export function generateUnifilarMermaidCode(input: DiagramGenerationInput): string {
  const {
    supplyVoltage,
    supplyPhases,
    mainSwitchRating,
    mainRcdRating,
    circuits,
  } = input;

  const phaseText = supplyPhases === 1 ? 'Monofásico' : 'Trifásico';
  const voltageText = `${supplyVoltage}V ${phaseText}`;

  // Construir nodos de circuitos
  const circuitNodes = circuits
    .map((c) => {
      const rcdText = c.rcdRequired ? '<br/>RCD' : '';
      return `${c.circuitNumber}["${c.circuitNumber} ${c.circuitName}<br/>PIA ${c.mcbRating}A<br/>${c.cableSection}mm²${rcdText}"]`;
    })
    .join('\n    ');

  // Construir conexiones de circuitos
  const circuitConnections = circuits
    .map((c) => `ID --> ${c.circuitNumber}`)
    .join('\n    ');

  const mermaidCode = `flowchart TD
    A["Red BT<br/>${voltageText}"]
    B["Contador<br/>Energía"]
    C["IGA<br/>${mainSwitchRating}A"]
    D["ID<br/>${mainRcdRating}mA"]
    
    A --> B
    B --> C
    C --> D
    
    ${circuitNodes}
    
    ${circuitConnections}
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#f3e5f5
    style ${circuits[0]?.circuitNumber || 'C1'} fill:#e8f5e9
  `;

  return mermaidCode;
}

/**
 * Genera una representación textual del esquema unifilar
 */
export function generateUnifilarTextRepresentation(input: DiagramGenerationInput): string {
  const {
    supplyVoltage,
    supplyPhases,
    mainSwitchRating,
    mainRcdRating,
    circuits,
  } = input;

  const phaseText = supplyPhases === 1 ? 'Monofásico' : 'Trifásico';

  let text = `ESQUEMA UNIFILAR
================

Suministro: ${supplyVoltage}V ${phaseText}
Interruptor General: ${mainSwitchRating}A
Diferencial General: ${mainRcdRating}mA

Circuitos:
----------\n`;

  circuits.forEach((c) => {
    const rcdText = c.rcdRequired ? ' (con RCD)' : '';
    text += `${c.circuitNumber}. ${c.circuitName}
   - PIA: ${c.mcbRating}A
   - Sección: ${c.cableSection}mm²
   - Potencia: ${c.installedPower}W${rcdText}\n\n`;
  });

  return text;
}

/**
 * Genera HTML para visualizar el esquema (alternativa a Mermaid)
 */
export function generateUnifilarHTML(input: DiagramGenerationInput): string {
  const {
    supplyVoltage,
    supplyPhases,
    mainSwitchRating,
    mainRcdRating,
    circuits,
  } = input;

  const phaseText = supplyPhases === 1 ? 'Monofásico' : 'Trifásico';

  const circuitRows = circuits
    .map(
      (c) => `
    <tr>
      <td class="circuit-number">${c.circuitNumber}</td>
      <td class="circuit-name">${c.circuitName}</td>
      <td class="circuit-pia">${c.mcbRating}A</td>
      <td class="circuit-section">${c.cableSection}mm²</td>
      <td class="circuit-power">${c.installedPower}W</td>
      <td class="circuit-rcd">${c.rcdRequired ? 'Sí' : 'No'}</td>
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
  <title>Esquema Unifilar</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #2196F3;
      padding-bottom: 10px;
    }
    .supply-info {
      background-color: #e3f2fd;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .supply-info p {
      margin: 5px 0;
      color: #1976d2;
    }
    .protections {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .protection-box {
      background-color: #f3e5f5;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #9c27b0;
    }
    .protection-box h3 {
      margin: 0 0 5px 0;
      color: #6a1b9a;
    }
    .protection-box p {
      margin: 5px 0;
      color: #4a148c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    table th {
      background-color: #2196F3;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    table td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    table tr:hover {
      background-color: #f5f5f5;
    }
    .circuit-number {
      font-weight: bold;
      color: #2196F3;
    }
    .circuit-pia {
      text-align: center;
    }
    .circuit-section {
      text-align: center;
    }
    .circuit-power {
      text-align: right;
    }
    .circuit-rcd {
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Esquema Unifilar Eléctrico</h1>
    
    <div class="supply-info">
      <p><strong>Suministro:</strong> ${supplyVoltage}V ${phaseText}</p>
    </div>
    
    <div class="protections">
      <div class="protection-box">
        <h3>Interruptor General (IGA)</h3>
        <p>${mainSwitchRating}A</p>
      </div>
      <div class="protection-box">
        <h3>Diferencial General (ID)</h3>
        <p>${mainRcdRating}mA</p>
      </div>
    </div>
    
    <h2>Circuitos</h2>
    <table>
      <thead>
        <tr>
          <th>Nº</th>
          <th>Nombre</th>
          <th>PIA (A)</th>
          <th>Sección (mm²)</th>
          <th>Potencia (W)</th>
          <th>RCD</th>
        </tr>
      </thead>
      <tbody>
        ${circuitRows}
      </tbody>
    </table>
  </div>
</body>
</html>
  `;

  return html;
}
