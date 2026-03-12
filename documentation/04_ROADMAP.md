# CertIA — Roadmap post-MVP

**Estado actual**: MVP desplegado en Railway. Core funcional: wizard 6 pasos, cálculos REBT, esquema unifilar, gestión de clientes/instalaciones, suscripciones Stripe, autenticación JWT propia.

---

## Estado del MVP (baseline)

### Funciona en producción
- Registro y login con email/password
- Wizard completo de 6 pasos para crear CIE
- Motor de cálculos REBT (sección, caída de tensión, IGA, PIA, factores de corrección)
- Sugerencias de circuitos por tipo de instalación (determinístico)
- Esquema unifilar SVG interactivo
- Generación de CIE en HTML por CCAA (Murcia, Valencia)
- Portal del cliente (acceso sin login por enlace único)
- Gestión de clientes e instalaciones
- Suscripciones con Stripe (Free / Pro / Enterprise)
- Rate limiting en auth y endpoints AI
- Deploy en Railway + TiDB Cloud

### Limitaciones conocidas del MVP
- PDF generado como HTML (no PDF real con Puppeteer)
- IA de circuitos es determinística (no llama a OpenAI aún)
- Sin tests automatizados
- Firma digital no integrada (Autofirma pendiente de servidor Java)
- Sin tramitación automática ante CCAA

---

## Fase 1 — Consolidación (post-lanzamiento inmediato)

Objetivo: convertir el MVP en un producto estable con usuarios reales.

| Tarea | Prioridad | Motivo |
|-------|-----------|--------|
| Tests unitarios del motor de cálculos | Alta | Errores en sección tienen implicación legal |
| PDF real con Puppeteer | Alta | El HTML no es válido para presentación oficial |
| Webhook de Stripe | Alta | Sin él las suscripciones no se activan |
| Monitorización básica (logs + alertas) | Media | Saber cuándo cae la app en producción |
| Plantillas CIE para más CCAA | Media | Aumenta el mercado addressable |

---

## Fase 2 — Crecimiento (3-6 meses)

Objetivo: aumentar el valor percibido y reducir el churn.

| Funcionalidad | Descripción |
|---------------|-------------|
| IA real con OpenAI | Sugerencias de circuitos y revisión del CIE con GPT-4o |
| Revisor REBT automático | Antes de emitir, detecta incoherencias normativas con explicación |
| Historial de intervenciones | Línea de tiempo por instalación: CIE inicial, reformas, revisiones |
| Alertas de revisiones periódicas | Recordatorio automático según tipo de instalación (ITC-BT-05) |
| Plantillas de instalaciones tipo | El instalador guarda sus configuraciones habituales |
| Multi-usuario (Enterprise) | Varias cuentas bajo una misma empresa instaladora |

---

## Fase 3 — Diferenciación (6-12 meses)

Objetivo: hacer el producto difícil de sustituir.

| Funcionalidad | Descripción |
|---------------|-------------|
| Firma digital integrada | Autofirma con DNIe/FNMT directamente desde la app |
| Tramitación automática CCAA | Subida automática al portal de la Consejería (cuando dispongan de API) |
| Modo inspector | Vista de revisión rápida para ingeniero senior |
| Panel de calidad técnica | Métricas de no conformidades, tipos de instalación, distribución geográfica |
| Memoria técnica de diseño | Generación de MTD para proyectos que lo requieren |

---

## Producto adyacente: DiseñIA

Una vez CertIA esté estable, explorar la segunda aplicación del portafolio BuildAI: herramienta de **diseño de instalaciones nuevas** (flujo inverso: requisitos → propuesta → proyecto técnico).

Comparte con CertIA: motor de cálculos, auth, BD, stack tecnológico, infraestructura Railway.

El puente de valor: un proyecto diseñado en DiseñIA se importa en CertIA para certificar una vez ejecutada la obra.

Ver propuesta completa en `DISENIA_PRODUCT_PROPOSAL.md`.

---

## Métricas de éxito

| Métrica | Objetivo 3 meses | Objetivo 12 meses |
|---------|-----------------|-------------------|
| Usuarios registrados | 50 | 500 |
| Certificados emitidos/mes | 100 | 2.000 |
| Conversión Free→Pro | 10% | 15% |
| Churn mensual | < 10% | < 5% |
| Tiempo medio por certificado | < 30 min | < 20 min |
