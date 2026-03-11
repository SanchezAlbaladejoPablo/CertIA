/**
 * Genera PDF del esquema unifilar usando Puppeteer (cuando esté disponible).
 * Por ahora devuelve stub. La función generateUnifilarHTML ya existe en diagram-generation.ts.
 */
export async function generateUnifilarPDF(html: string): Promise<Buffer> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return Buffer.from(pdf);
  } catch {
    return Buffer.from('PDF no disponible: instala puppeteer');
  }
}
