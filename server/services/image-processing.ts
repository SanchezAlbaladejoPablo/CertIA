import sharp from 'sharp';

/**
 * Procesa una imagen de firma manuscrita:
 * 1. Convierte a escala de grises
 * 2. Binariza (fondo blanco, trazo negro)
 * 3. Intenta recortar bordes en blanco (opcional — se omite si falla)
 * Devuelve un buffer PNG.
 */
export async function processSignatureImage(inputBuffer: Buffer): Promise<Buffer> {
  // Validar que el buffer es una imagen válida antes de procesar
  const meta = await sharp(inputBuffer).metadata().catch(() => null);
  if (!meta) throw new Error('El archivo no es una imagen válida (usa JPG o PNG)');
  if (!meta.width || !meta.height) throw new Error('No se pudo determinar el tamaño de la imagen');
  if (meta.width < 50 || meta.height < 20) throw new Error('La imagen es demasiado pequeña para ser una firma');

  // Paso 1: escala de grises + binarizar
  const binarized = await sharp(inputBuffer)
    .grayscale()
    .threshold(180)
    .png()
    .toBuffer();

  // Paso 2: intentar recortar bordes en blanco (puede fallar si la imagen es todo blanco)
  try {
    const trimmed = await sharp(binarized)
      .trim({ threshold: 10 })
      .png()
      .toBuffer();
    return trimmed;
  } catch {
    // Si trim falla (imagen sin trazo detectable), devolver la binarizada sin recortar
    return binarized;
  }
}

/**
 * Devuelve las dimensiones de una imagen.
 */
export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const meta = await sharp(buffer).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}
