import { generateCertificateHTML } from '../pdf-generation';
import type { CertificatePDFInput } from '../pdf-generation';

export function generateMurciaCertificateHTML(input: CertificatePDFInput): string {
  let html = generateCertificateHTML(input, false);
  html = html.replace(
    '<p>Según Reglamento Electrotécnico para Baja Tensión (REBT) — Real Decreto 842/2002</p>',
    '<p>Según REBT (Real Decreto 842/2002) — Región de Murcia — Consejería de Empresa, Industria y Portavocía</p>'
  );
  return html;
}
