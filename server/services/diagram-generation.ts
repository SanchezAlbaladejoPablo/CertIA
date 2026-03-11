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
 * Genera un SVG vectorial del esquema unifilar con atributos data-circuit
 * para interactividad (tooltip hover en el frontend React).
 */
export function generateUnifilarSVG(input: DiagramGenerationInput): string {
  const { supplyVoltage, supplyPhases, groundingSystem, mainSwitchRating, mainRcdRating, circuits } = input;

  const BOX_W = 110;
  const BOX_H = 42;
  const V_GAP = 22;
  const COL_W = 130;
  const H_PAD = 50;

  const n = Math.max(circuits.length, 1);
  const svgWidth = Math.max(BOX_W + H_PAD * 2, n * COL_W + H_PAD * 2);
  const mainX = svgWidth / 2;

  const yRed    = 20;
  const yMeter  = yRed   + BOX_H + V_GAP;
  const yIga    = yMeter + BOX_H + V_GAP;
  const yIdd    = yIga   + BOX_H + V_GAP;
  const busY    = yIdd   + BOX_H + V_GAP;
  const circY   = busY   + V_GAP;
  const svgHeight = circY + BOX_H + 75;

  const phaseLabel = supplyPhases === 3 ? '3~/400V' : '1~/230V';

  const circXs = circuits.map((_, i) => {
    const startX = mainX - ((n - 1) * COL_W) / 2;
    return startX + i * COL_W;
  });

  const busX1 = n > 1 ? (circXs[0] ?? mainX) - BOX_W / 2 - 4 : mainX - 4;
  const busX2 = n > 1 ? (circXs[n - 1] ?? mainX) + BOX_W / 2 + 4 : mainX + 4;

  const vl = (x: number, y1: number, y2: number, w = 2) =>
    `<line x1="${x.toFixed(1)}" y1="${y1}" x2="${x.toFixed(1)}" y2="${y2}" stroke="#475569" stroke-width="${w}"/>`;
  const hl = (x1: number, x2: number, y: number, w = 2) =>
    `<line x1="${x1.toFixed(1)}" y1="${y}" x2="${x2.toFixed(1)}" y2="${y}" stroke="#475569" stroke-width="${w}"/>`;

  const mainBox = (cx: number, y: number, label: string, sub: string, fill: string, stroke: string) => {
    const rx = (cx - BOX_W / 2).toFixed(1);
    const ty1 = (y + BOX_H * 0.40).toFixed(1);
    const ty2 = (y + BOX_H * 0.76).toFixed(1);
    return `<g>
      <rect x="${rx}" y="${y}" width="${BOX_W}" height="${BOX_H}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <text x="${cx.toFixed(1)}" y="${ty1}" text-anchor="middle" font-family="monospace,sans-serif" font-size="12" font-weight="bold" fill="#1e293b">${label}</text>
      <text x="${cx.toFixed(1)}" y="${ty2}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#475569">${sub}</text>
    </g>`;
  };

  const parts: string[] = [];

  // Main vertical spine
  parts.push(vl(mainX, yRed + BOX_H, yMeter));
  parts.push(vl(mainX, yMeter + BOX_H, yIga));
  parts.push(vl(mainX, yIga + BOX_H, yIdd));
  parts.push(vl(mainX, yIdd + BOX_H, busY));

  // Horizontal bus
  parts.push(hl(busX1, busX2, busY));

  // Main nodes
  parts.push(mainBox(mainX, yRed,   `RED ${supplyVoltage}V`, phaseLabel,                    '#dbeafe', '#3b82f6'));
  parts.push(mainBox(mainX, yMeter, 'CONTADOR',               'Energía activa',              '#fef9c3', '#eab308'));
  parts.push(mainBox(mainX, yIga,   `IGA ${mainSwitchRating}A`, 'Curva C · ITC-BT-17',      '#f3e8ff', '#a855f7'));
  parts.push(mainBox(mainX, yIdd,   `IDD ${mainRcdRating}mA`,   `${groundingSystem} · 2P`,  '#ede9fe', '#8b5cf6'));

  // Circuits
  circuits.forEach((c, i) => {
    const cx = circXs[i] ?? mainX;
    const circFill   = c.rcdRequired ? '#dcfce7' : '#f8fafc';
    const circStroke = c.rcdRequired ? '#16a34a' : '#64748b';
    const rx = (cx - BOX_W / 2).toFixed(1);
    const ty1 = (circY + BOX_H * 0.40).toFixed(1);
    const ty2 = (circY + BOX_H * 0.76).toFixed(1);

    parts.push(vl(cx, busY, circY));

    const dataJson = JSON.stringify({
      num: c.circuitNumber,
      name: c.circuitName,
      pia: c.mcbRating,
      section: c.cableSection,
      power: c.installedPower,
      rcd: c.rcdRequired,
    }).replace(/"/g, '&quot;');

    parts.push(`<g class="circuit-node" data-circuit="${dataJson}" style="cursor:pointer">
      <rect x="${rx}" y="${circY}" width="${BOX_W}" height="${BOX_H}" rx="5" fill="${circFill}" stroke="${circStroke}" stroke-width="${c.rcdRequired ? 2 : 1.5}"/>
      <text x="${cx.toFixed(1)}" y="${ty1}" text-anchor="middle" font-family="monospace,sans-serif" font-size="11" font-weight="bold" fill="#1e293b">PIA ${c.mcbRating}A</text>
      <text x="${cx.toFixed(1)}" y="${ty2}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#475569">${c.cableSection}mm²</text>
    </g>`);

    // RCD badge
    const badgeY = circY + BOX_H + 5;
    if (c.rcdRequired) {
      parts.push(`<rect x="${(cx - 24).toFixed(1)}" y="${badgeY}" width="48" height="16" rx="3" fill="#bbf7d0" stroke="#16a34a" stroke-width="1"/>
      <text x="${cx.toFixed(1)}" y="${(badgeY + 11).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="#15803d">RCD 30mA</text>`);
    }

    // Circuit label
    const labelY = circY + BOX_H + (c.rcdRequired ? 30 : 12);
    const words = c.circuitName.split(' ');
    const line1 = words.slice(0, 3).join(' ');
    const line2 = words.slice(3).join(' ');
    parts.push(`<text x="${cx.toFixed(1)}" y="${labelY}" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#374151">${line1}</text>`);
    if (line2) {
      parts.push(`<text x="${cx.toFixed(1)}" y="${(labelY + 11).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#374151">${line2}</text>`);
    }
    const pwrY = labelY + (line2 ? 22 : 11);
    parts.push(`<text x="${cx.toFixed(1)}" y="${pwrY}" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#9ca3af">${c.installedPower}W</text>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <style>
    .circuit-node rect { transition: filter 0.15s; }
    .circuit-node:hover rect { filter: brightness(0.87); }
  </style>
  ${parts.join('\n  ')}
</svg>`;
}

/**
 * Genera HTML completo embebiendo el SVG unifilar (para exportación standalone).
 */
export function generateUnifilarHTML(input: DiagramGenerationInput): string {
  const { supplyVoltage, supplyPhases, installationType } = input;
  const phaseText = supplyPhases === 1 ? 'Monofásico' : 'Trifásico';
  const svgContent = generateUnifilarSVG(input);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Esquema Unifilar — CertIA</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #f8fafc; }
    .wrapper { max-width: 1100px; margin: 0 auto; background: #fff; border-radius: 8px;
               box-shadow: 0 2px 8px rgba(0,0,0,.1); padding: 24px; }
    h1 { color: #1e293b; font-size: 18px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
    .diagram { overflow-x: auto; padding: 16px 0; }
    .circuit-node rect { transition: filter .15s; }
    .circuit-node:hover rect { filter: brightness(.87); }
  </style>
</head>
<body>
  <div class="wrapper">
    <h1>Esquema Unifilar Eléctrico</h1>
    <p class="meta">${installationType} · ${supplyVoltage}V ${phaseText} · ${input.circuits.length} circuitos</p>
    <div class="diagram">${svgContent}</div>
  </div>
</body>
</html>`;
}
