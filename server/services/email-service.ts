/**
 * Servicio de envío de emails
 * Usa nodemailer con SMTP configurable por variables de entorno.
 *
 * Variables de entorno necesarias:
 *   SMTP_HOST  - Servidor SMTP (ej: smtp.resend.com)
 *   SMTP_PORT  - Puerto (ej: 587)
 *   SMTP_USER  - Usuario SMTP
 *   SMTP_PASS  - Contraseña SMTP
 *   SMTP_FROM  - Dirección remitente (ej: noreply@certia.es)
 */

import nodemailer from "nodemailer";

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface SendCertificateEmailOptions {
  toEmail: string;
  toName: string;
  installerName: string;
  certificateNumber: string;
  certificateHtml: string;
}

export async function sendCertificateEmail(opts: SendCertificateEmailOptions): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn('[Email] SMTP no configurado. Saltando envío a:', opts.toEmail);
    throw new Error('El servidor de email no está configurado. Contacta con el administrador.');
  }

  const transporter = createTransporter();

  const subject = `Certificado de Instalación Eléctrica – ${opts.certificateNumber}`;
  const text = `Estimado/a ${opts.toName},\n\nAdjunto encontrará el Certificado de Instalación Eléctrica (${opts.certificateNumber}) emitido por ${opts.installerName}.\n\nAtentamente,\n${opts.installerName}`;
  const html = `
    <p>Estimado/a <strong>${opts.toName}</strong>,</p>
    <p>Adjunto encontrará el Certificado de Instalación Eléctrica <strong>${opts.certificateNumber}</strong> emitido por <strong>${opts.installerName}</strong>.</p>
    <p>Atentamente,<br/>${opts.installerName}</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: opts.toEmail,
    subject,
    text,
    html,
    attachments: [
      {
        filename: `${opts.certificateNumber}.html`,
        content: opts.certificateHtml,
        contentType: "text/html",
      },
    ],
  });
}
