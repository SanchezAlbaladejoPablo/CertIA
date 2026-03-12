# CertIA — Resumen Ejecutivo

**Versión:** 2.0 · **Fecha:** Marzo 2026 · **Estado:** MVP listo para producción (pendiente configuración)

---

## 1. Visión general

**CertIA** es un SaaS especializado que actúa como **intermediario administrativo autorizado** para la tramitación de **Certificados de Instalación Eléctrica (CIE)** conforme al **REBT** (Reglamento Electrotécnico para Baja Tensión, RD 842/2002) en España.

La plataforma coordina el proceso completo: la **empresa instaladora** aporta los datos del proyecto, CertIA genera automáticamente el formulario CERTINS específico de cada Comunidad Autónoma, el **instalador autorizado** firma electrónicamente con su DNIe en 2 minutos, y CertIA tramita el expediente ante la Consejería de Industria correspondiente.

- **Tipo de producto:** Aplicación web SaaS (MVP completado, listo para configuración de producción).
- **Usuarios objetivo:** Empresas instaladoras, instaladores autorizados (categorías Básico y Especialista), ingenierías de supervisión de instalaciones BT.
- **Rol legal:** Intermediario administrativo autorizado. No firma técnicamente por el instalador (ITC-BT-03).
- **Entorno normativo:** REBT + ITC-BT aplicables (especialmente ITC-BT-03, 04, 07, 08, 15, 19, 25, 26, 47) + eIDAS (UE 910/2014) + Ley 6/2020.

---

## 2. Problema que resuelve

En la práctica, la tramitación de un CIE consume **3–4 horas** por certificado:

- Localizar el formulario CERTINS correcto para cada CCAA (cada una tiene el suyo).
- Rellenar manualmente campos técnicos con riesgo de error (secciones de cable, caída de tensión, protecciones).
- Coordinar al instalador autorizado para la firma presencial o envío de documentos.
- Navegar el portal oficial de la Consejería y gestionar el seguimiento del expediente.

CertIA elimina el 95% de ese tiempo integrando en un único flujo:
1. Captura estructurada de datos del proyecto.
2. Motor de cálculo alineado con REBT (secciones, caída de tensión, protecciones, factores de corrección).
3. Generación del CERTINS oficial adaptado a la CCAA.
4. Firma electrónica cualificada del instalador con DNIe vía AutoFirma (PAdES + sello TSA).
5. Tramitación y seguimiento ante el portal oficial autonómico.

---

## 3. Alcance funcional del MVP (estado actual)

### ✅ Implementado y funcional

**Gestión de datos:**
- Clientes, instalaciones y certificados con CRUD completo y búsqueda avanzada.
- Perfil del instalador/empresa con auto-inyección en todos los documentos generados.
- Portal del cliente con acceso por enlace único (sin cuenta).
- Módulo de revisiones periódicas (ITC-BT-05).

**Wizard guiado del CIE (6 pasos):**
1. Cliente — datos del titular y contacto.
2. Instalación — localización, referencia catastral, tipo de uso.
3. Derivación individual — protecciones, puesta a tierra, sección DI.
4. Circuitos interiores — definición, secciones, PIAs, RCDs, sugerencias IA.
5. Mediciones — resultados de mediciones reglamentarias.
6. Revisión y generación — resumen, firma y descarga.

**Motor de cálculo eléctrico (backend):**
- Sección de conductores: doble criterio (intensidad admisible + caída de tensión).
- Selección de protecciones (IGA/PIA/RCD) con verificación de coordinación.
- Factores de corrección por temperatura, agrupamiento e instalación (ITC-BT-07/19).
- Caída de tensión diferenciada: DI ≤1% (ITC-BT-15), circuitos ≤3% (ITC-BT-19).
- Verificación de tensión de contacto y resistencia de tierra.

**Generación de documentos (paquete completo por certificado):**
- CIE oficial adaptado a CCAA (Murcia, Madrid, Cataluña, Andalucía, Valencia, País Vasco + genérico).
- Memoria técnica de diseño.
- Hoja de ensayos y mediciones.
- Informe de cálculo REBT justificativo.
- Esquema unifilar Mermaid auto-generado.
- Paquete ZIP con todos los documentos para tramitación electrónica.

**Firma electrónica cualificada:**
- Integración con AutoFirma v1.9 (oficial MPTFP) mediante `autoscript.js`.
- Firma PAdES-B con DNIe o certificado FNMT (SHA-512withRSA).
- Sello de tiempo TSA (DigiCert, RFC 3161) → PAdES-T.
- Audit trail inmutable: firmante, NIF, certificado X.509, hashes, IP, timestamp.
- Almacenamiento de PDFs firmados en Cloudflare R2 (S3-compatible).

**Suscripciones:**
- 3 planes: Free (5 CIE/mes), Pro (500 CIE/mes), Enterprise (ilimitado).
- Integración con Stripe (checkout, portal de facturación, control de límites).

**Infraestructura:**
- Email SMTP configurable con degradación graceful (Resend/SendGrid/Postmark).
- Almacenamiento en Cloudflare R2 con fallback Base64 si no está configurado.
- Mock store en memoria para desarrollo sin BD.

### ⏳ Pendiente de configuración (no de desarrollo)

- Activar OAuth real con Manus (actualmente: usuario demo hardcodeado).
- Conectar base de datos MySQL/TiDB (actualmente: mock en memoria).
- Configurar Price IDs de Stripe y webhook handler.
- Variables de entorno de producción (ver `.env.example`).

### 🔜 Fase 2 (post-lanzamiento)

- PDF real generado con Puppeteer (actualmente: HTML imprimible).
- Integración real OpenAI (actualmente: sugerencias determinísticas REBT).
- Tramitación automática ante portales CCAA (actualmente: manual, APIs no públicas).
- Firma trifásica PAdEStri (requiere servidor Java externo).

---

## 4. Arquitectura en alto nivel

CertIA es una aplicación **web full-stack TypeScript** con tipado end-to-end:

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite · Tailwind CSS v4 + shadcn/ui · wouter · React Hook Form + Zod |
| API | tRPC v11 (tipado end-to-end sin REST manual) |
| Backend | Node.js + Express |
| Base de datos | Drizzle ORM + MySQL/TiDB |
| Autenticación | Manus OAuth (openId como identificador único) |
| Pagos | Stripe |
| IA | @ai-sdk/openai (preparado, pendiente de activar) |
| Almacenamiento | Cloudflare R2 (PDFs firmados y ZIPs) |
| Firma | AutoFirma + autoscript.js + TSA DigiCert |
| Email | Nodemailer (SMTP configurable) |

**Tres actores legales** en el sistema (según ITC-BT-03):
- **Instalador autorizado:** firma con DNIe, responsabilidad técnica y civil 10 años.
- **Empresa instaladora:** firma Anexo II de representación, gestiona proyectos.
- **CertIA:** genera CERTINS, recibe firma, tramita ante CCAA (no firma técnicamente).

---

## 5. Diferenciales clave

- **Único en España** que genera CERTINS adaptado a 6 CCAA con datos pre-rellenados.
- **Firma electrónica cualificada** integrada (PAdES-T + TSA) — cumple eIDAS nivel QES.
- **Audit trail legal** inmutable por cada acto de firma (valor probatorio en litigio).
- **Trazabilidad técnica** completa: datos de entrada → cálculo → resultado → documento.
- **Motor REBT** con resistividad a temperatura de servicio, factores de corrección y coordinación de protecciones.
- **Paquete completo** de documentación (CIE + Memoria + Hoja ensayos + Informe cálculo + Unifilar + ZIP).

---

## 6. Estado actual y próximos pasos

**Estado (Marzo 2026):** MVP ~90% completado. Core completamente funcional. Corriendo en modo demo.

**Bloqueantes para producción** (ver `MVP_LAUNCH_CHECKLIST.md`):
1. Activar autenticación OAuth (Manus) — eliminar usuario demo.
2. Conectar base de datos real (MySQL/TiDB) y ejecutar `pnpm db:push`.
3. Configurar Stripe: Price IDs + webhook handler.
4. Configurar variables de entorno de producción.

**Esfuerzo estimado hasta producción:** 8–14 días de trabajo efectivo.

**Secuencia recomendada:**
1. Infraestructura: BD + env vars (1 día).
2. Auth OAuth (2 días).
3. Stripe completo (2 días).
4. PDF real con Puppeteer (2 días).
5. Despliegue con dominio + SSL (1 día).
