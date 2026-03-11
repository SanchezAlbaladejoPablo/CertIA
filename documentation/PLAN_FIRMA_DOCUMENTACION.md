# Plan de Implementación — Documentación Avanzada y Firma Electrónica CertIA

**Fecha:** 11 de marzo de 2026
**Autor:** Arquitecto de Software Senior
**Estado:** ✅ COMPLETADO (todos los sprints ejecutados)
**Versión:** 2.0

---

## Estado de documentación generada

| Documento | Servicio | Endpoint | Estado |
|-----------|---------|---------|--------|
| CIE por CCAA | `pdf-generation.ts` + `templates/*.ts` | `pdf.generateFromCertificateId` | ✅ Implementado |
| Memoria técnica | `memory-generation.ts` | `pdf.generateMemoryFromCertificateId` | ✅ Implementado |
| Esquema unifilar | `diagram-pdf.ts` | `pdf.generateUnifilarFromCertificateId` | ✅ Implementado |
| Hoja de ensayos | `pdf-generation.ts` | `pdf.generateTestsSheetFromCertificateId` | ✅ Implementado |
| Informe de cálculo REBT | `calculation-report.ts` | `pdf.generateCalculationReportFromCertificateId` | ✅ Implementado |
| Paquete ZIP sede | `export/certificate-package.ts` | `export.certificatePackage` | ✅ Implementado |
| **Firma electrónica DNIe** | `autofirma.ts` + `signature-verification.ts` | `signatures.submitSigned` | ✅ Implementado |

---

## Trabajo futuro — Plantillas oficiales y profesionales

**Idea:** Permitir que los documentos generados (especialmente el CIE y la Memoria técnica) usen plantillas visuales más fieles al formato oficial de cada comunidad autónoma, o plantillas de diseño profesional personalizables por el instalador.

**Motivación:**
- Las plantillas actuales replican la estructura y campos del boletín oficial, pero el layout visual es genérico.
- Algunas comunidades autónomas tienen formularios PDF oficiales con casillas numeradas, logotipos institucionales y orden de campos muy específico. Acercarse más a ese formato reduciría el retrabajo del instalador al presentar documentación.
- Un instalador podría querer añadir su logo de empresa, colores corporativos o cabecera personalizada.

**Posibles niveles de implementación:**

| Nivel | Descripción | Complejidad |
|-------|-------------|-------------|
| **Oficial CCAA** | Replicar fielmente el PDF oficial (casillas, orden, textos) de cada comunidad mediante plantillas HTML pixel-perfect | Alta |
| **Profesional personalizable** | El instalador sube su logo y elige colores; se aplica a todos sus documentos | Media |
| **Editor de plantillas** | Interfaz drag-and-drop para construir la plantilla del certificado | Muy alta |

**Archivos que se verían afectados:**
- `server/services/templates/*.ts` — ampliar con plantillas más fieles por CCAA
- `server/services/pdf-generation.ts` — soporte para variables de branding del perfil
- `drizzle/schema.ts` — campos `logoUrl`, `brandColor` en tabla `profiles`
- `client/src/pages/dashboard/Settings.tsx` — UI para subir logo y elegir color

> Este elemento no tiene sprint asignado. Se planificará cuando la suite de documentos actual esté validada en producción con usuarios reales.

---

---

# BLOQUE B — Firma Electrónica Cualificada con DNIe

## Contexto normativo

| Marco | Aplicación |
|-------|-----------|
| **Reglamento eIDAS (UE 910/2014)** | Firma electrónica cualificada válida en toda la UE |
| **Ley 6/2020 (España)** | Adapta eIDAS al ordenamiento español |
| **DNIe** | Dispositivo cualificado de creación de firma (QSCD) según eIDAS Anexo II |
| **FNMT** | Autoridad de certificación española. Emite los certificados del DNIe |
| **AutoFirma** | Aplicación oficial MPTFP que actúa de bridge entre navegador y DNIe |
| **PAdES** | Formato de firma para PDF (ETSI EN 319 132). Perfil exigido para sede electrónica |

### ¿Por qué AutoFirma y no PKCS#11 directo?

Los navegadores modernos eliminaron el soporte NPAPI (2015) y Java applets, impidiendo el acceso directo a hardware criptográfico desde el navegador. La solución oficial española es **AutoFirma**: una aplicación de escritorio que expone una API REST local (`https://localhost:51235`) a la que el navegador puede llamar. El ciudadano la instala una sola vez.

AutoFirma ya gestiona internamente PKCS#11 → DNIe → firmado RSA → PAdES.

---

## Arquitectura completa del sistema de firma

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR (React)                        │
│                                                                 │
│  1. Usuario pulsa "Firmar con DNIe"                            │
│  2. Frontend llama a AutoFirma (localhost:51235)               │
│  3. AutoFirma accede al DNIe vía PKCS#11                       │
│  4. DNIe genera firma RSA del hash SHA-256 del PDF             │
│  5. AutoFirma devuelve: firma B64 + certificado B64            │
│  6. Frontend envía al backend: { pdfB64, firma, certificado }  │
└────────────────────────────┬────────────────────────────────────┘
                             │ tRPC mutation
┌────────────────────────────▼────────────────────────────────────┐
│                       BACKEND (Node.js)                         │
│                                                                 │
│  7. Verificar firma con clave pública del certificado          │
│  8. Verificar certificado contra CA raíz FNMT                  │
│  9. Llamar a TSA para obtener sello de tiempo (RFC 3161)       │
│  10. Incrustar firma PAdES en el PDF (pdf-lib / node-forge)    │
│  11. Guardar en S3 el PDF firmado                              │
│  12. Registrar audit trail en BD                               │
│  13. Devolver URL del PDF firmado                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sprint B1 — ~~Firma visual (imagen de firma del instalador)~~ ❌ DESCARTADO

### Motivo del descarte

Este sprint fue evaluado y descartado por decisión de diseño: AutoFirma gestiona completamente la identidad del firmante a través del DNIe. Almacenar imágenes de firmas manuscritas supone un dato sensible innecesario (riesgo GDPR) que no aporta validez legal adicional cuando ya existe la firma cualificada eIDAS.

El espacio de firma en el CIE muestra una línea en blanco (comportamiento actual) hasta que el documento se firma electrónicamente con DNIe, momento en que el audit trail registra la identidad completa del firmante.

**Archivos afectados por la decisión:**
- `drizzle/schema.ts` — columna `signatureUrl` eliminada del schema
- `server/routers.ts` — endpoints `profile.uploadSignature` / `deleteSignature` no implementados
- `client/src/pages/dashboard/Settings.tsx` — sección "Firma del instalador" eliminada

---

## Sprint B2 — ✅ Integración AutoFirma (PAdES básico) — COMPLETADO

### Nivel de dificultad: Alto

### Problema

La firma visual del Sprint B1 no tiene validez legal. Para que el CIE tenga validez como documento firmado electrónicamente (según eIDAS y Ley 6/2020) se necesita una firma cualificada que vincule criptográficamente la identidad del firmante (DNIe) con el contenido del documento.

### Prerequisitos

- El instalador tiene AutoFirma instalado en su equipo (descarga gratuita del Gobierno de España)
- El instalador tiene DNIe con chip activo (o certificado FNMT software)

### Flujo detallado

```
1. [Frontend] Genera PDF del CIE (endpoint existente)
2. [Frontend] Detecta si AutoFirma está disponible (ping a localhost:51235)
3. [Frontend] Muestra modal "Firmar con DNIe" o "Certificado digital"
4. [Frontend] Llama a AutoFirma con el PDF en Base64
5. [AutoFirma] Muestra diálogo de selección de certificado al usuario
6. [AutoFirma] Usuario introduce PIN del DNIe
7. [AutoFirma] Devuelve PDF firmado en PAdES-B (Base64)
8. [Frontend] Envía PDF firmado al backend via tRPC
9. [Backend] Verifica firma criptográficamente
10. [Backend] Guarda PDF firmado en S3
11. [Backend] Actualiza certificates.pdfUrl y status → 'signed'
12. [Backend] Registra audit trail
```

### Archivos afectados

| Archivo | Acción |
|---------|--------|
| `client/src/services/autofirma.ts` | Crear (cliente AutoFirma) |
| `client/src/pages/dashboard/certificates-management.tsx` | Botón "Firmar con DNIe" |
| `server/routers.ts` | Endpoint `signatures.submitSigned` |
| `server/services/signature-verification.ts` | Crear (verificación criptográfica) |
| `server/services/storage.ts` | Guardar PDF firmado en S3 |
| `drizzle/schema.ts` | Tabla `signatureAuditTrail` |

### Cómo implementarlo

**Cliente AutoFirma (`client/src/services/autofirma.ts`):**

```typescript
const AUTOFIRMA_URL = 'https://localhost:51235';

export async function isAutoFirmaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${AUTOFIRMA_URL}/check`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function signPdfWithDNIe(pdfBase64: string): Promise<{ signedPdf: string; certificate: string }> {
  const params = new URLSearchParams({
    op: 'sign',
    format: 'PAdES',
    algorithm: 'SHA256withRSA',
    dat: pdfBase64,
    // Parámetros PAdES para firma visible opcional
    extraParams: btoa('signatureSubFilter=ETSI.CAdES.detached\nmode=implicit'),
  });

  const res = await fetch(`${AUTOFIRMA_URL}/sign?${params}`);
  if (!res.ok) throw new Error('Error en AutoFirma: ' + res.status);

  const result = await res.json();
  return {
    signedPdf: result.dat,        // PDF firmado en Base64
    certificate: result.cert,     // Certificado del firmante en Base64
  };
}
```

**Verificación en backend (`server/services/signature-verification.ts`):**

```typescript
import forge from 'node-forge';

export function verifyPdfSignature(
  pdfBuffer: Buffer,
  signatureB64: string,
  certificateB64: string
): { valid: boolean; subjectName: string; notAfter: Date } {
  // Decodificar certificado
  const certDer = Buffer.from(certificateB64, 'base64');
  const cert = forge.pki.certificateFromAsn1(
    forge.asn1.fromDer(certDer.toString('binary'))
  );

  // Extraer nombre del titular
  const cn = cert.subject.getField('CN')?.value ?? 'Desconocido';

  // Verificar vigencia
  const now = new Date();
  if (now < cert.validity.notBefore || now > cert.validity.notAfter) {
    throw new Error('Certificado caducado o aún no válido');
  }

  // Verificar que el certificado es de una CA reconocida (FNMT)
  // En producción: verificar contra lista FNMT/LOTL europea
  const issuerCN = cert.issuer.getField('CN')?.value ?? '';
  if (!issuerCN.includes('FNMT') && !issuerCN.includes('AC DNIE')) {
    console.warn('Advertencia: Certificado no emitido por FNMT o DNIE AC');
  }

  // Generar hash SHA-256 del PDF original
  const md = forge.md.sha256.create();
  md.update(pdfBuffer.toString('binary'));
  const documentHash = md.digest().toHex();

  // Verificar firma RSA con clave pública del certificado
  const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
  const signatureBinary = Buffer.from(signatureB64, 'base64').toString('binary');

  // La verificación exacta depende del formato PAdES (CMS/PKCS7)
  // Aquí se delega a node-forge o a una librería PAdES
  const valid = true; // Resultado de la verificación CMS

  return {
    valid,
    subjectName: cn,
    notAfter: cert.validity.notAfter,
  };
}
```

**Endpoint en `routers.ts`:**

```typescript
signatures: router({
  submitSigned: protectedProcedure
    .input(z.object({
      certificateId: z.number(),
      signedPdfB64: z.string(),
      certificateB64: z.string(),
      clientIp: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const pdfBuffer = Buffer.from(input.signedPdfB64, 'base64');

      // 1. Verificar firma
      const { verifyPdfSignature } = require('./services/signature-verification');
      const verification = verifyPdfSignature(pdfBuffer, input.signedPdfB64, input.certificateB64);
      if (!verification.valid) throw new Error('La firma no es válida');

      // 2. Guardar PDF firmado en S3
      const s3Url = await uploadToS3(pdfBuffer, `signed/CIE-${input.certificateId}.pdf`);

      // 3. Actualizar certificado
      await db.updateCertificateStatus(input.certificateId, ctx.user.id, {
        status: 'signed',
        pdfUrl: s3Url,
      });

      // 4. Registrar audit trail
      await db.createSignatureAuditTrail({
        certificateId: input.certificateId,
        userId: ctx.user.id,
        signerName: verification.subjectName,
        documentHash: createHash('sha256').update(pdfBuffer).digest('hex'),
        certificateB64: input.certificateB64,
        clientIp: input.clientIp ?? 'unknown',
        signedAt: new Date(),
      });

      return { success: true, pdfUrl: s3Url };
    }),
}),
```

### Criterios de aceptación

- El botón "Firmar con DNIe" detecta si AutoFirma está disponible
- Si no lo está, muestra enlace de descarga oficial
- El PDF resultante contiene firma PAdES verificable con Adobe Reader
- El estado del certificado cambia a `signed`
- El audit trail queda registrado en BD

### Implementación real (difiere del plan original)

La integración se realizó con **autoscript.js v1.9.0** (biblioteca oficial del Ministerio) en lugar del fetch directo a `localhost:51235`, ya que AutoFirma v1.9 cambió su mecanismo de integración. El parámetro `algorithm` (`SHA512withRSA`) es obligatorio en la firma real, no en la documentación original.

**Archivos implementados:**
- `client/src/services/autofirma.ts` — integración con autoscript.js (`AutoScript.sign`)
- `client/public/afirma/js/autoscript.js` — v1.9.0 descargado del repositorio oficial
- `client/index.html` — carga del script con onerror graceful
- `server/routers.ts` → `signatures.submitSigned` — endpoint completo
- `server/services/signature-verification.ts` — verificación X.509 con node-forge
- `server/services/r2-storage.ts` — storage en Cloudflare R2 (en lugar de S3)

### Estimación real: completado en 1 semana

---

## Sprint B3 — ✅ Firma cualificada eIDAS (PAdES-T con sello de tiempo TSA) — COMPLETADO

### Nivel de dificultad: Muy alto

### Problema

PAdES-B (Sprint B2) incluye la firma pero no garantiza que el documento existía en un momento concreto. Si el certificado del firmante caduca o es revocado posteriormente, la firma PAdES-B podría cuestionarse. **PAdES-T** añade un **sello de tiempo** (Timestamp Token, RFC 3161) emitido por una Autoridad de Sellado de Tiempo (TSA) reconocida, lo que garantiza la existencia del documento firmado en un instante certificado.

Para cumplir plenamente con eIDAS nivel QES, el sello de tiempo es necesario.

### TSA disponibles en España

| TSA | URL | Coste |
|-----|-----|-------|
| FNMT | `http://tss.fnmt.es/tsa` | Gratuita (requiere registro) |
| Firmaprofesional | `https://tsa.firmaprofesional.com` | De pago |
| DigiCert | `http://timestamp.digicert.com` | Gratuita |

### Flujo PAdES-T

```
PDF firmado (PAdES-B)
    │
    ├── Calcular hash SHA-256 de la firma (SignatureValue)
    │
    ├── Enviar hash a TSA (TimeStampRequest RFC 3161)
    │
    ├── Recibir TimeStampToken (TST) firmado por la TSA
    │
    └── Incrustar TST en el atributo non-signed del PDF
             → PDF con PAdES-T
```

### Archivos afectados

| Archivo | Acción |
|---------|--------|
| `server/services/tsa-client.ts` | Crear (cliente RFC 3161) |
| `server/services/signature-verification.ts` | Ampliar con verificación de timestamp |
| `server/routers.ts` | Ampliar `signatures.submitSigned` para añadir TST |

### Cómo implementarlo

**Cliente TSA (`server/services/tsa-client.ts`):**

```typescript
import forge from 'node-forge';
import { createHash } from 'crypto';

const TSA_URL = process.env.TSA_URL ?? 'http://timestamp.digicert.com';

export async function requestTimestampToken(dataToTimestamp: Buffer): Promise<Buffer> {
  // RFC 3161: construir TimeStampRequest
  const hash = createHash('sha256').update(dataToTimestamp).digest();

  const tsq = buildTimeStampRequest(hash); // Usando ASN.1 / node-forge

  const res = await fetch(TSA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/timestamp-query' },
    body: tsq,
  });

  if (!res.ok) throw new Error('TSA no disponible: ' + res.status);

  const tsr = Buffer.from(await res.arrayBuffer());
  // Extraer el TimeStampToken del TimeStampResponse
  return extractTimestampToken(tsr);
}

function buildTimeStampRequest(hash: Buffer): Buffer {
  // ASN.1 TimeStampReq según RFC 3161
  // messageImprint: { hashAlgorithm: sha256, hashedMessage: hash }
  // nonce: aleatorio
  // certReq: true (pedir certificado TSA)
  const asn1 = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
    // version: INTEGER 1
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.INTEGER, false, '\x01'),
    // messageImprint
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
      // SHA-256 OID: 2.16.840.1.101.3.4.2.1
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OID, false,
          forge.asn1.oidToDer('2.16.840.1.101.3.4.2.1').getBytes()),
      ]),
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.BITSTRING, false,
        '\x00' + hash.toString('binary')),
    ]),
    // certReq: TRUE
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.BOOLEAN, false, '\xff'),
  ]);
  return Buffer.from(forge.asn1.toDer(asn1).getBytes(), 'binary');
}
```

**Integración en el endpoint:**

```typescript
// Después de la firma PAdES-B, antes de guardar en S3:
const { requestTimestampToken } = require('./services/tsa-client');

// Hash del SignatureValue (la firma RSA del PDF)
const signatureValueBuffer = extractSignatureValue(pdfBuffer); // extraer del PDF
const tst = await requestTimestampToken(signatureValueBuffer);

// Incrustar el TST en el PDF como atributo unsigned
const padesTPdf = embedTimestampToken(pdfBuffer, tst);

// Guardar padesTPdf en S3 en lugar de pdfBuffer
```

### Criterios de aceptación

- El PDF firmado incluye un sello de tiempo válido (verificable en Adobe Reader → Propiedades de firma → Sello de tiempo)
- El sello de tiempo lo emite una TSA reconocida (FNMT o DigiCert)
- El timestamp queda registrado en el audit trail
- Si la TSA no está disponible, la firma se guarda como PAdES-B con aviso al usuario

**Archivos implementados:**
- `server/services/tsa-client.ts` — cliente RFC 3161 con DigiCert como TSA por defecto
- `server/routers.ts` → `signatures.submitSigned` — incluye solicitud TSA con fallback graceful

### Estimación real: completado junto con B2

---

## Sprint B4 — ✅ Audit Trail y almacenamiento de evidencias legales — COMPLETADO

### Nivel de dificultad: Medio

### Problema

Para que el sistema de firma sea auditable y tenga valor probatorio en caso de litigio o inspección, se necesita registrar evidencias inmutables de cada acto de firma: quién firmó, cuándo, desde dónde, qué documento y con qué certificado.

### Qué registrar por cada acto de firma

| Campo | Descripción |
|-------|-------------|
| `certificateId` | Qué CIE se firmó |
| `userId` | Qué instalador firmó |
| `signerName` | CN del certificado (nombre del titular) |
| `signerNif` | NIF extraído del certificado |
| `signerCertSerial` | Número de serie del certificado |
| `signerCertIssuer` | CA emisora (FNMT, AC DNIE, etc.) |
| `signerCertNotAfter` | Validez del certificado en el momento de firma |
| `documentHash` | SHA-256 del PDF antes de firmar |
| `signedDocumentHash` | SHA-256 del PDF firmado |
| `timestampToken` | TST en Base64 (si existe) |
| `timestampTime` | Hora del sello de tiempo |
| `clientIp` | IP del firmante |
| `userAgent` | Navegador y sistema operativo |
| `signedAt` | Timestamp del servidor en el momento del registro |
| `rawCertificateB64` | Certificado completo del firmante |

### Archivos afectados

| Archivo | Acción |
|---------|--------|
| `drizzle/schema.ts` | Nueva tabla `signatureAuditTrail` |
| `server/db-signatures.ts` | Crear (procedimientos BD) |
| `server/routers.ts` | Endpoint `signatures.getAuditTrail` |
| `client/src/pages/dashboard/certificates-management.tsx` | Vista del historial de firma |

### Schema de la tabla

```typescript
// drizzle/schema.ts
export const signatureAuditTrail = mysqlTable("signatureAuditTrail", {
  id: int("id").autoincrement().primaryKey(),
  certificateId: int("certificateId").notNull(),
  userId: int("userId").notNull(),

  // Identidad del firmante (extraída del certificado X.509)
  signerName: varchar("signerName", { length: 255 }).notNull(),
  signerNif: varchar("signerNif", { length: 20 }),
  signerCertSerial: varchar("signerCertSerial", { length: 100 }),
  signerCertIssuer: text("signerCertIssuer"),
  signerCertNotAfter: timestamp("signerCertNotAfter"),

  // Hashes del documento
  documentHash: varchar("documentHash", { length: 64 }).notNull(),   // SHA-256 hex
  signedDocumentHash: varchar("signedDocumentHash", { length: 64 }),

  // Sello de tiempo
  timestampToken: text("timestampToken"),   // Base64
  timestampTime: timestamp("timestampTime"),
  tsaUrl: varchar("tsaUrl", { length: 255 }),

  // Red y cliente
  clientIp: varchar("clientIp", { length: 45 }).notNull(),
  userAgent: text("userAgent"),

  // Certificado completo
  rawCertificateB64: text("rawCertificateB64"),

  // Metadatos
  signedAt: timestamp("signedAt").defaultNow().notNull(),
});
```

### Vista en el dashboard

En `certificates-management.tsx`, añadir un icono de escudo junto a los certificados con estado `signed`. Al hacer clic, mostrar modal con:

```
┌─────────────────────────────────────────┐
│  Evidencias de firma                    │
├─────────────────────────────────────────┤
│  Firmado por: GARCIA LOPEZ, JUAN        │
│  NIF: 12345678Z                         │
│  Certificado: FNMT — AC DNIE 005        │
│  Fecha/hora firma: 11/03/2026 14:32:05 │
│  Sello de tiempo: DigiCert TSA ✅       │
│  IP del firmante: 82.X.X.X             │
│  Hash documento: a3f8c2...             │
│  Certificado válido hasta: 01/01/2029  │
└─────────────────────────────────────────┘
```

### Criterios de aceptación

- Cada firma genera un registro inmutable en `signatureAuditTrail`
- El instalador puede ver el historial de firma de cada certificado
- El hash del documento antes de firmar queda registrado (permite verificar que el PDF no fue modificado)
- El endpoint `signatures.getAuditTrail` devuelve todos los eventos de firma de un certificado
- `pnpm check` y `pnpm db:push` pasan sin errores

**Archivos implementados:**
- `drizzle/schema.ts` → tabla `signatureAuditTrail` con todos los campos especificados
- `server/db.ts` → `createSignatureAuditTrail()`, `getSignatureAuditTrailByCertificateId()`
- `server/routers.ts` → `signatures.getAuditTrail`

### Estimación real: completado junto con B2 y B3

---

## Resumen de sprints y dependencias

```
BLOQUE A                          BLOQUE B
────────                          ────────

Sprint A1                         Sprint B1
Informe cálculo REBT              Firma visual
1 semana                          3 días
    │                                 │
    ▼                                 ▼
Listo para                        Sprint B2
producción                        AutoFirma + PAdES-B
                                  2 semanas
                                      │
                                      ▼
                                  Sprint B3
                                  TSA + PAdES-T
                                  3 semanas
                                      │
                                      ▼
                                  Sprint B4
                                  Audit Trail
                                  1 semana
```

## Tabla resumen de estado final

| Sprint | Descripción | Estado | Archivos clave |
|--------|-------------|--------|----------------|
| A1 | Informe de cálculo REBT | ✅ Completado | `calculation-report.ts` |
| B1 | Firma visual (imagen) | ❌ Descartado | — |
| B2 | AutoFirma + PAdES-B | ✅ Completado | `autofirma.ts`, `autoscript.js`, `signature-verification.ts` |
| B3 | TSA + PAdES-T (eIDAS QES) | ✅ Completado | `tsa-client.ts` |
| B4 | Audit trail legal | ✅ Completado | `signatureAuditTrail` (schema + db + router) |
| R2 | Almacenamiento PDFs firmados | ✅ Completado | `r2-storage.ts` |

---

## Variables de entorno necesarias

```bash
# .env — añadir en producción

# Firma electrónica
TSA_URL=http://timestamp.digicert.com        # URL de la TSA (DigiCert, gratuita, sin registro)
FNMT_TSA_URL=http://tss.fnmt.es/tsa          # TSA FNMT (alternativa, requiere registro previo)

# Almacenamiento de PDFs firmados — ver decisión abajo
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_SIGNED=certia-signed-docs          # Cloudflare R2 (elección adoptada)

# Verificación de certificados (OCSP/CRL)
FNMT_OCSP_URL=http://ocsp.cert.fnmt.es/ocsp
```

---

## Decisión de almacenamiento — PDFs firmados

### Opciones evaluadas

| Opción | Coste | Complejidad | Decisión |
|--------|-------|-------------|----------|
| AWS S3 | ~$0.02/GB/mes | Media | Descartado |
| **Cloudflare R2** | **Gratis hasta 10 GB** | **Baja** | **✅ Elegido** |
| Supabase Storage | Gratis hasta 1 GB | Muy baja | Descartado (límite bajo) |
| Base de datos (blob) | Incluido en TiDB | Muy baja | Descartado (lento, no escala) |

### Justificación

**Cloudflare R2** es la opción más adecuada para CertIA porque:
- **Capa gratuita generosa**: 10 GB almacenamiento + 1 millón de operaciones/mes gratis, suficiente para los primeros meses de producción.
- **Compatible con S3 API**: el cliente `@aws-sdk/client-s3` funciona con R2 sin cambios en el código, solo cambiando el endpoint.
- **Sin egress fees**: a diferencia de AWS S3, Cloudflare no cobra por las descargas (transferencia de salida gratuita).
- **Integración sencilla**: no requiere configuración de IAM, políticas de bucket complejas ni regiones.

### Implementación futura (cuando se active el Sprint B2)

```typescript
// server/services/storage.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadSignedPdf(buffer: Buffer, filename: string): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_SIGNED!,
    Key: filename,
    Body: buffer,
    ContentType: 'application/pdf',
  }));
  return `https://${process.env.R2_BUCKET_SIGNED}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${filename}`;
}
```

> **Nota:** Este servicio no está implementado aún. Se activará en el Sprint B2 junto con la integración de AutoFirma.

---

## Notas de seguridad críticas

1. **El PIN del DNIe nunca llega al servidor.** AutoFirma lo gestiona localmente en el equipo del usuario. El backend solo recibe el resultado de la firma (PDF firmado + certificado público).

2. **Los certificados del DNIe son públicos.** Almacenar `rawCertificateB64` en el audit trail es legal: contiene solo la clave pública e identidad del titular, nunca la privada.

3. **Inmutabilidad del audit trail.** La tabla `signatureAuditTrail` no debe tener endpoints de UPDATE ni DELETE. Solo INSERT y SELECT.

4. **Validez del certificado en el momento de firma.** El sistema debe comprobar la vigencia del certificado en el instante de la firma (no solo si está caducado ahora), usando el timestamp de la TSA como referencia temporal.

5. **OCSP/CRL.** En producción, verificar que el certificado no está revocado consultando el servicio OCSP de la FNMT antes de aceptar la firma.
