import forge from 'node-forge';
import { createHash } from 'crypto';

export interface SignatureVerificationResult {
  valid: boolean;
  signerName: string;
  signerNif: string | null;
  signerCertSerial: string;
  signerCertIssuer: string;
  signerCertNotAfter: Date;
  documentHash: string;
}

/**
 * Verifica un certificado X.509 en Base64 y extrae sus datos.
 * La verificación criptográfica completa del PAdES se delega a AutoFirma;
 * aquí validamos vigencia, emisor y extraemos identidad del firmante.
 */
export function verifyCertificate(certificateBase64: string): SignatureVerificationResult {
  const certDer = Buffer.from(certificateBase64, 'base64');
  const cert = forge.pki.certificateFromAsn1(
    forge.asn1.fromDer(certDer.toString('binary'))
  );

  // Vigencia
  const now = new Date();
  if (now < cert.validity.notBefore || now > cert.validity.notAfter) {
    throw new Error(
      `Certificado ${now < cert.validity.notBefore ? 'aún no válido' : 'caducado'} ` +
      `(válido: ${cert.validity.notBefore.toLocaleDateString('es-ES')} – ${cert.validity.notAfter.toLocaleDateString('es-ES')})`
    );
  }

  // Extraer datos del subject
  const cn = cert.subject.getField('CN')?.value ?? 'Desconocido';
  const serialNumber = cert.serialNumber;
  const issuerCN = cert.issuer.getField('CN')?.value ?? '';
  const issuerO = cert.issuer.getField('O')?.value ?? '';
  const issuerStr = [issuerCN, issuerO].filter(Boolean).join(' — ');

  // Extraer NIF del subject (campo SERIALNUMBER o en el CN para DNIe)
  // En DNIe: CN tiene formato "APELLIDOS NOMBRE - NIF"
  // En FNMT software: campo SERIALNUMBER contiene el NIF
  const serialField = cert.subject.getField('SERIALNUMBER')?.value as string | undefined;
  const nifFromCN = cn.includes(' - ') ? cn.split(' - ').pop()?.trim() ?? null : null;
  const nif = serialField ?? nifFromCN;

  return {
    valid: true,
    signerName: cn.includes(' - ') ? cn.split(' - ')[0].trim() : cn,
    signerNif: nif ?? null,
    signerCertSerial: serialNumber,
    signerCertIssuer: issuerStr,
    signerCertNotAfter: cert.validity.notAfter,
    documentHash: '', // Se rellena en el endpoint con el hash real del PDF
  };
}

/**
 * Calcula el hash SHA-256 de un buffer y lo devuelve en hexadecimal.
 */
export function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}
