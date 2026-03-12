# CertIA — Pack de Documentación Profesional (para presentación)
Fecha: Marzo 2026  
Objetivo: definir la **documentación técnica y de producto** necesaria para una puesta en marcha sólida y una presentación profesional ante un **Colegio de Ingenieros**.

---

## 1) Cómo usar este pack

- **Audiencia**:
  - **Evaluadores técnicos (ingeniería / colegio profesional)**: foco en dominio REBT, trazabilidad, rigor de cálculo, seguridad y validez documental.
  - **Equipo técnico**: arquitectura, API, despliegue, testing.
  - **Usuarios (instaladores)**: guía de uso y operación.
- **Criterio de “documentación profesional”**: que un tercero pueda entender **qué hace**, **cómo lo hace**, **con qué límites**, **cómo se valida**, y **cómo se opera** en producción.

---

## 2) Estado actual (documentos existentes — Marzo 2026)

Los siguientes documentos están activos en `documentation/`:

| Archivo | Rol | Estado |
|---------|-----|--------|
| `EXECUTIVE_SUMMARY.md` | Resumen ejecutivo para stakeholders | ✅ Actualizado |
| `DOMAIN_REBT_CIE.md` | Marco normativo REBT/ITC-BT | ✅ Vigente |
| `CALCULATION_ENGINE_SPEC.md` | Especificación motor de cálculos | ✅ Vigente |
| `FUNCIONALIDAD_COMPLETA.md` | Requisitos funcionales con estado de implementación | ✅ Actualizado |
| `PLAN_FIRMA_DOCUMENTACION.md` | Implementación firma electrónica cualificada | ✅ Actualizado (sprints completados) |
| `PENDIENTE_INFRAESTRUCTURA.md` | Infraestructura pendiente de configuración | ✅ Vigente |
| `MVP_LAUNCH_CHECKLIST.md` | Bloqueantes para producción y secuencia de lanzamiento | ✅ Vigente |
| `CIE_APP_STRATEGIC_TECHNICAL_REPORT.md` | Visión estratégica y roadmap de negocio | ✅ Referencia |
| `ENGINEER_VALUE_FEATURE_IDEAS.md` | Backlog post-MVP | ✅ Referencia |
| `TECHNICAL_REVIEW_AND_IMPROVEMENT_PLAN.md` | Deuda técnica post-lanzamiento | ✅ Vigente |
| `DOCUMENTATION_PROFESSIONAL_PACK.md` | Este índice | ✅ Actualizado |

**Documentos eliminados** (obsoletos o completados):
- `README.md` — visión BuildAI plataforma (reemplazado por `EXECUTIVE_SUMMARY.md`)
- `PLAN_FIRMA.md` — prompt mínimo (superado por `PLAN_FIRMA_DOCUMENTACION.md`)
- `CAMBIO_DOCUMENTACION.md` — directiva de trabajo completada
- `REFACTORIZACION_ARCHIVOS_INNECESARIOS.md` — limpieza ya ejecutada

---

## 3) Documentos imprescindibles (prioridad para “salida al mercado” + evaluación técnica)

### 3.1 `Documentation/EXECUTIVE_SUMMARY.md`
- **Propósito**: resumen ejecutivo (2–4 páginas) para entender CertIA en 5 minutos.
- **Incluye**:
  - Problema, solución, propuesta de valor, audiencia.
  - Alcance: qué hace / qué no hace.
  - Estado del producto (MVP), limitaciones conocidas, próximos hitos.
  - Flujo de demo recomendado (3–5 pasos).

### 3.2 `Documentation/DOMAIN_REBT_CIE.md`
- **Propósito**: marco de dominio y normativa (REBT/ITC-BT) aplicable al CIE.
- **Incluye**:
  - Lista de ITC-BT y requisitos que impactan el certificado.
  - Datos obligatorios del CIE y reglas de validez (por qué son obligatorios).
  - Glosario (IGA/PIA/RCD, TT/TN/IT, derivación individual, etc.).
  - Supuestos y límites del sistema (qué casos quedan fuera).

### 3.3 `Documentation/CALCULATION_ENGINE_SPEC.md`
- **Propósito**: especificación audit-able del motor de cálculos (lo más crítico para un colegio).
- **Incluye (por cada cálculo/módulo)**:
  - Entradas (con unidades), salidas, validaciones.
  - Criterios/fórmulas y referencia normativa cuando aplique.
  - Casos de ejemplo (2–3) + caso límite.
  - Trazabilidad: cómo el resultado aparece en el certificado/informe.

### 3.4 `Documentation/TRACEABILITY_REPORTING.md`
- **Propósito**: demostrar trazabilidad “input → cálculo → decisión → documento”.
- **Incluye**:
  - Qué evidencia se guarda (datos introducidos, versiones, resultados).
  - Versionado de plantillas/documento y del motor de cálculo.
  - Reproducibilidad: cómo regenerar un certificado con los mismos datos.

### 3.5 `Documentation/ARCHITECTURE.md`
- **Propósito**: arquitectura técnica clara y defendible (C4 recomendado).
- **Incluye**:
  - Diagramas: Contexto, Contenedores, Componentes (alto nivel).
  - Integraciones externas (OAuth, Stripe, IA, storage).
  - Flujos clave: login, creación/edición de certificado, generación y descarga del documento.
  - ADRs (enlaces a `Documentation/adr/`).

### 3.6 `Documentation/API_REFERENCE.md`
- **Propósito**: referencia de API (tRPC) para frontend/cliente/terceros.
- **Incluye**:
  - Procedimientos por router: auth, profile, clients, installations, certificates, calculations, pdf, ai…
  - Contratos de entrada/salida, errores, permisos/roles.
  - Ejemplos de uso (mínimo “happy path”).

### 3.7 `Documentation/SECURITY_PRIVACY_COMPLIANCE.md`
- **Propósito**: seguridad y cumplimiento (muy valorado en evaluación técnica).
- **Incluye**:
  - Autenticación, autorización, gestión de sesiones/tokens.
  - Gestión de secretos y configuración.
  - Medidas OWASP básicas: XSS/CSRF/inyección, rate limiting, logging seguro.
  - Privacidad/GDPR: datos tratados, finalidad, retención, derechos.

### 3.8 `Documentation/TESTING_QUALITY_PLAN.md`
- **Propósito**: plan de calidad y validación.
- **Incluye**:
  - Estrategia por niveles: unit, integración, E2E.
  - Priorización: tests del motor de cálculo y validaciones del CIE primero.
  - Criterios de aceptación por funcionalidad crítica.
  - Plan de regresión antes de releases.

### 3.9 `Documentation/DEPLOYMENT_OPERATIONS.md`
- **Propósito**: guía de despliegue y operación en producción.
- **Incluye**:
  - Entornos (dev/staging/prod), variables de entorno (sin secretos).
  - Proceso de despliegue y rollback.
  - Observabilidad: logs, métricas, alertas.
  - Backups y recuperación.

---

## 4) Documentos muy recomendables (para completar un dossier redondo)

### 4.1 `Documentation/USER_GUIDE.md`
- **Propósito**: manual de usuario final (instalador).
- **Incluye**:
  - Flujos del wizard (paso a paso).
  - Gestión de clientes/instalaciones/certificados.
  - FAQ + resolución de errores frecuentes.

### 4.2 `Documentation/KNOWN_LIMITATIONS_AND_RISKS.md`
- **Propósito**: transparencia y gestión de riesgos.
- **Incluye**:
  - Limitaciones actuales (por ejemplo, generación de documento, IA, casos no cubiertos).
  - Riesgos técnicos/legales y mitigaciones.
  - Qué se considera “no-go” para producción.

### 4.3 `Documentation/adr/` (carpeta de decisiones)
- **Propósito**: justificar decisiones técnicas relevantes.
- **Formato**: un archivo por decisión, por ejemplo:
  - `Documentation/adr/0001-trpc-api-contracts.md`
  - `Documentation/adr/0002-auth-provider.md`
  - `Documentation/adr/0003-pdf-generation-approach.md`

---

## 5) Mapeo rápido: de lo actual a lo propuesto

- `FUNCIONALIDAD_COMPLETA.md` → base para:
  - `USER_GUIDE.md` (secciones operativas)
  - `DOMAIN_REBT_CIE.md` (reglas + obligatoriedad)
  - `CALCULATION_ENGINE_SPEC.md` (si se separan cálculos en capítulos)

- `PLAN_FASES.md` → base para:
  - `KNOWN_LIMITATIONS_AND_RISKS.md` (bloqueantes + riesgos)
  - `TESTING_QUALITY_PLAN.md` (prioridades de validación)
  - `adr/*` (decisiones al implementar cada fase)

- `README.md` → recomendable:
  - Convertir en **índice** que enlace a todos los documentos anteriores, y mover el detalle a cada archivo específico.

---

## 6) Orden recomendado de producción (para presentar pronto)

1. `EXECUTIVE_SUMMARY.md`
2. `DOMAIN_REBT_CIE.md`
3. `CALCULATION_ENGINE_SPEC.md`
4. `TRACEABILITY_REPORTING.md`
5. `ARCHITECTURE.md`
6. `SECURITY_PRIVACY_COMPLIANCE.md`
7. `TESTING_QUALITY_PLAN.md`
8. `DEPLOYMENT_OPERATIONS.md`
9. `API_REFERENCE.md`
10. `USER_GUIDE.md`
11. `KNOWN_LIMITATIONS_AND_RISKS.md`
12. `adr/*`

