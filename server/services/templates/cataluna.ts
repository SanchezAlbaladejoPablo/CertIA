import { generateCertificateHTML } from '../pdf-generation';
import type { CertificatePDFInput } from '../pdf-generation';

export function generateCatalunaCertificateHTML(input: CertificatePDFInput): string {
  let html = generateCertificateHTML(input, false);
  html = html.replace(
    '<p>Según Reglamento Electrotécnico para Baja Tensión (REBT) — Real Decreto 842/2002</p>',
    '<p>Segons el REBT (Reial Decret 842/2002) — Generalitat de Catalunya — Departament d\'Empresa i Treball</p>'
  );
  return html;
}
