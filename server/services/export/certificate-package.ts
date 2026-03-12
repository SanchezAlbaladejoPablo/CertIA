import JSZip from 'jszip';
import { generateCertificateHTMLByCCAA, generateTestsSheetHTML } from '../pdf-generation';
import { generateMemoryHTML } from '../memory-generation';
import { generateCalculationReportHTML } from '../calculation-report';
import type { CertificatePDFInput } from '../pdf-generation';
import * as db from '../../db';
import { uploadToR2, certificateR2Key } from '../r2-storage';


/**
 * Construye el pdfInput a partir del certificateId, reutilizando la misma lógica
 * que el endpoint pdf.generateFromCertificateId.
 */
export async function buildCertificatePdfInputFromId(
  certificateId: number,
  userId: number
): Promise<CertificatePDFInput> {
  const cert = await db.getCertificateById(certificateId, userId);
  if (!cert) throw new Error('Certificado no encontrado');

  const [client, installation, profile, circuits] = await Promise.all([
    db.getClientById(cert.clientId, userId),
    db.getInstallationById(cert.installationId, userId),
    db.getProfileByUserId(userId),
    db.getCircuitsByCertificateId(cert.id),
  ]);

  return {
    certificateId: cert.id,
    certificateNumber: cert.certificateNumber ?? undefined,
    clientName: client?.name ?? '-',
    clientDni: client?.dniNif ?? undefined,
    clientAddress: client?.address ?? undefined,
    clientPhone: client?.phone ?? undefined,
    installationType: cert.installationType ?? '-',
    locationCategory: cert.locationCategory ?? undefined,
    electrificationGrade: cert.electrificationGrade ?? undefined,
    groundingSystem: cert.groundingSystem ?? undefined,
    installationAddress: installation?.address ?? '-',
    installationCity: installation?.city ?? undefined,
    installationProvince: installation?.province ?? undefined,
    postalCode: installation?.postalCode ?? undefined,
    cadastralReference: installation?.cadastralReference ?? undefined,
    cups: installation?.cups ?? undefined,
    supplyVoltage: cert.supplyVoltage ?? 230,
    supplyPhases: cert.phases ?? 1,
    installedPower: cert.installedPower ?? 0,
    mainSwitchRating: cert.igaRating ?? 0,
    mainRcdRating: cert.idSensitivity ?? 30,
    idSensitivity: cert.idSensitivity ?? undefined,
    overvoltageProtection: cert.overvoltageProtection ?? undefined,
    earthResistance: parseFloat(cert.earthResistance ?? '0'),
    diLength: parseFloat(cert.diLength ?? '0'),
    diCableSection: parseFloat(cert.diCableSection ?? '0'),
    diCableMaterial: cert.diCableMaterial ?? 'Cu',
    diCableInsulation: cert.diCableInsulation ?? undefined,
    ambientTemp: cert.ambientTemp ?? undefined,
    installMethod: cert.installMethod ?? undefined,
    insulationResistance: parseFloat(cert.insulationResistance ?? '0'),
    continuityContinuity: parseFloat(cert.continuityContinuity ?? '0'),
    rcdTestCurrent: cert.rcdTestCurrent ?? 30,
    rcdTestTime: cert.rcdTestTime ?? 300,
    observations: cert.observations ?? undefined,
    circuits: circuits.map(c => ({
      circuitNumber: c.circuitNumber,
      circuitName: c.circuitName,
      circuitType: c.circuitType ?? undefined,
      installedPower: c.installedPower ?? 0,
      length: c.length != null ? parseFloat(c.length) : undefined,
      cableSection: parseFloat(c.cableSection ?? '0'),
      cableMaterial: c.cableMaterial ?? undefined,
      cableInsulation: c.cableInsulation ?? undefined,
      mcbRating: c.mcbRating ?? 0,
      mcbCurve: c.mcbCurve ?? undefined,
      rcdRequired: c.rcdRequired ?? false,
      rcdRating: c.rcdRating ?? undefined,
      loadDescription: c.loadDescription ?? undefined,
    })),
    installerFullName: profile?.fullName ?? undefined,
    installerNumber: profile?.installerNumber ?? undefined,
    installerCategory: profile?.installerCategory ?? undefined,
    companyName: profile?.companyName ?? undefined,
    companyNif: profile?.cifNif ?? undefined,
    companyAuthNumber: profile?.companyAuthNumber ?? undefined,
    autonomousCommunity: profile?.autonomousCommunity ?? undefined,
    issueDate: cert.updatedAt,
  };
}

/**
 * Construye el paquete ZIP con todos los documentos del certificado.
 */
export async function buildCertificatePackage(
  certificateId: number,
  userId: number
): Promise<Buffer> {
  const pdfInput = await buildCertificatePdfInputFromId(certificateId, userId);
  const profile = await db.getProfileByUserId(userId);

  const zip = new JSZip();
  const certNum = pdfInput.certificateNumber ?? String(certificateId);

  const [cieHtml, memHtml, testsHtml, calcHtml] = await Promise.all([
    generateCertificateHTMLByCCAA(pdfInput, profile?.autonomousCommunity ?? undefined),
    Promise.resolve(generateMemoryHTML(pdfInput)),
    Promise.resolve(generateTestsSheetHTML(pdfInput)),
    Promise.resolve(generateCalculationReportHTML(pdfInput)),
  ]);

  zip.file(`CIE-${certNum}.html`,             cieHtml);
  zip.file(`Memoria-${certNum}.html`,         memHtml);
  zip.file(`Ensayos-${certNum}.html`,         testsHtml);
  zip.file(`Informe-calculo-${certNum}.html`, calcHtml);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  // Subir ZIP a R2 si está configurado (acceso permanente al paquete)
  const r2Key = certificateR2Key(certNum, 'package');
  await uploadToR2(r2Key, zipBuffer, 'application/zip');

  return zipBuffer;
}
