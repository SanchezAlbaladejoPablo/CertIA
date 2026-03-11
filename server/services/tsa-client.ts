import forge from 'node-forge';
import { createHash, randomBytes } from 'crypto';

const TSA_URL = process.env.TSA_URL ?? 'http://timestamp.digicert.com';
const TSA_TIMEOUT_MS = 10000;

export interface TimestampResult {
  token: string;       // TimeStampToken en Base64
  time: Date;          // Hora certificada por la TSA
  tsaUrl: string;      // URL de la TSA usada
}

/**
 * Solicita un sello de tiempo RFC 3161 a la TSA configurada.
 * Por defecto usa DigiCert (gratuita, sin registro).
 *
 * @param dataToTimestamp - Buffer del dato a sellar (generalmente el SignatureValue del PDF)
 */
export async function requestTimestampToken(dataToTimestamp: Buffer): Promise<TimestampResult> {
  const hash = createHash('sha256').update(dataToTimestamp).digest();
  const nonce = randomBytes(8);

  // Construir TimeStampRequest (RFC 3161, sección 2.4.1)
  const tsq = buildTimestampRequest(hash, nonce);

  const res = await fetch(TSA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/timestamp-query' },
    body: tsq as unknown as BodyInit,
    signal: AbortSignal.timeout(TSA_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`TSA respondió con ${res.status}: ${await res.text()}`);
  }

  const tsrBuffer = Buffer.from(await res.arrayBuffer());
  return parseTimestampResponse(tsrBuffer);
}

/**
 * Construye un TimeStampRequest ASN.1 según RFC 3161.
 */
function buildTimestampRequest(hash: Buffer, nonce: Buffer): Buffer {
  // SHA-256 OID: 2.16.840.1.101.3.4.2.1
  const sha256Oid = forge.asn1.oidToDer('2.16.840.1.101.3.4.2.1').getBytes();

  const tsq = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
    // version: INTEGER 1
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.INTEGER, false,
      forge.util.hexToBytes('01')),
    // messageImprint: SEQUENCE { hashAlgorithm, hashedMessage }
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OID, false, sha256Oid),
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.NULL, false, ''),
      ]),
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OCTETSTRING, false,
        hash.toString('binary')),
    ]),
    // nonce: INTEGER (aleatorio, previene replay)
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.INTEGER, false,
      nonce.toString('binary')),
    // certReq: BOOLEAN TRUE (pedir certificado de la TSA en la respuesta)
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.BOOLEAN, false,
      forge.util.hexToBytes('ff')),
  ]);

  const der = forge.asn1.toDer(tsq);
  return Buffer.from(der.getBytes(), 'binary');
}

/**
 * Parsea un TimeStampResponse y extrae el token y la hora certificada.
 */
function parseTimestampResponse(tsrBuffer: Buffer): TimestampResult {
  try {
    const asn1 = forge.asn1.fromDer(tsrBuffer.toString('binary'));
    const tsr = asn1.value as forge.asn1.Asn1[];

    // tsr[0] = PKIStatusInfo, tsr[1] = TimeStampToken (opcional)
    const statusInfo = tsr[0]?.value as forge.asn1.Asn1[];
    const statusValue = (statusInfo?.[0]?.value as string) ?? '';
    const statusByte = statusValue.charCodeAt(0);

    // Status 0 = granted, 1 = grantedWithMods
    if (statusByte !== 0 && statusByte !== 1) {
      throw new Error(`TSA rechazó la solicitud (status: ${statusByte})`);
    }

    // tsr[1] es el TimeStampToken (CMS ContentInfo)
    const tstAsn1 = tsr[1];
    if (!tstAsn1) throw new Error('TSA no devolvió TimeStampToken');

    const tstDer = forge.asn1.toDer(tstAsn1).getBytes();
    const tokenBase64 = Buffer.from(tstDer, 'binary').toString('base64');

    // Extraer hora del TSTInfo dentro del token
    // TSTInfo.genTime es un GeneralizedTime dentro del eContent del CMS
    const timestampTime = extractTimestampTime(tstAsn1) ?? new Date();

    return {
      token: tokenBase64,
      time: timestampTime,
      tsaUrl: TSA_URL,
    };
  } catch (err) {
    throw new Error(`Error al parsear respuesta TSA: ${(err as Error).message}`);
  }
}

/**
 * Extrae el campo genTime del TSTInfo dentro del TimeStampToken.
 * Estructura: ContentInfo → SignedData → encapContentInfo → eContent → TSTInfo → genTime
 */
function extractTimestampTime(tstAsn1: forge.asn1.Asn1): Date | null {
  try {
    // Navegar la estructura CMS hasta TSTInfo
    const contentInfo = tstAsn1.value as forge.asn1.Asn1[];
    const signedData = (contentInfo[1]?.value as forge.asn1.Asn1[])?.[0]?.value as forge.asn1.Asn1[];
    // signedData[2] = encapContentInfo
    const encapContent = signedData?.[2]?.value as forge.asn1.Asn1[];
    // encapContent[1] = [0] EXPLICIT OCTET STRING
    const eContentWrapper = encapContent?.[1]?.value as forge.asn1.Asn1[];
    const eContent = eContentWrapper?.[0];
    if (!eContent) return null;

    // El contenido del OCTET STRING es el DER del TSTInfo
    const tstInfoDer = typeof eContent.value === 'string' ? eContent.value : forge.asn1.toDer(eContent).getBytes();
    const tstInfo = forge.asn1.fromDer(tstInfoDer);
    const tstInfoFields = tstInfo.value as forge.asn1.Asn1[];

    // TSTInfo: version, policy, messageImprint, serialNumber, genTime, ...
    // genTime está en el índice 4
    const genTime = tstInfoFields[4];
    if (!genTime) return null;

    // GeneralizedTime format: YYYYMMDDHHmmssZ
    const timeStr = genTime.value as string;
    return parseGeneralizedTime(timeStr);
  } catch {
    return null;
  }
}

function parseGeneralizedTime(timeStr: string): Date {
  // Formato: 20260311143205Z
  const year = parseInt(timeStr.slice(0, 4));
  const month = parseInt(timeStr.slice(4, 6)) - 1;
  const day = parseInt(timeStr.slice(6, 8));
  const hour = parseInt(timeStr.slice(8, 10));
  const min = parseInt(timeStr.slice(10, 12));
  const sec = parseInt(timeStr.slice(12, 14));
  return new Date(Date.UTC(year, month, day, hour, min, sec));
}
