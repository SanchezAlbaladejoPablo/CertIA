/**
 * Servicio de almacenamiento de objetos usando Cloudflare R2 (compatible S3).
 * Almacena PDFs firmados y documentos generados de forma permanente.
 *
 * Variables de entorno necesarias:
 *   R2_ACCOUNT_ID       - ID de cuenta Cloudflare
 *   R2_ACCESS_KEY_ID    - Access Key ID del token R2
 *   R2_SECRET_ACCESS_KEY - Secret Access Key del token R2
 *   R2_BUCKET_NAME      - Nombre del bucket (ej: certia-signed-docs)
 *   R2_PUBLIC_URL       - URL pública del bucket (ej: https://docs.certia.es)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

/**
 * Sube un documento a R2 y devuelve la URL pública.
 * Si R2 no está configurado, devuelve null (sin romper el flujo).
 *
 * @param key       - Ruta en el bucket, ej: "certificados/2026/CIE-2026-0001.html"
 * @param content   - Contenido del archivo (string o Buffer)
 * @param mimeType  - MIME type del archivo
 */
export async function uploadToR2(
  key: string,
  content: string | Buffer,
  mimeType: string = "text/html; charset=utf-8"
): Promise<string | null> {
  const client = getR2Client();
  if (!client) {
    console.warn("[R2] No configurado. Saltando upload de:", key);
    return null;
  }

  const bucket = process.env.R2_BUCKET_NAME!;
  const body = typeof content === "string" ? Buffer.from(content, "utf-8") : content;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  return publicUrl ? `${publicUrl}/${key}` : null;
}

/**
 * Elimina un objeto de R2. No lanza error si R2 no está configurado.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  if (!client) return;

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  );
}

/**
 * Genera la clave R2 para un certificado dado.
 */
export function certificateR2Key(certNumber: string, type: "cie" | "signed" | "package"): string {
  const year = new Date().getFullYear();
  return `certificados/${year}/${type}/${certNumber}.${type === "package" ? "zip" : "html"}`;
}
