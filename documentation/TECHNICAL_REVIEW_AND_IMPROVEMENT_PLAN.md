# CertIA — Revisión Técnica y Plan de Mejora de Arquitectura

> Objetivo: disponer de una guía clara de **mejoras técnicas, de diseño y arquitectura** a abordar después de completar la implementación del plan de fases funcionales. No está pensada para bloquear el MVP, sino para elevar la calidad técnica y la mantenibilidad del sistema.

---

## 1. Visión general de la arquitectura actual

- **Frontend**:
  - React + TypeScript + Vite.
  - UI con Tailwind CSS v4 + shadcn/ui.
  - Routing con wouter.
  - Estado y datos con TanStack Query + cliente tRPC.
  - Formularios en componentes de página (por ejemplo `CertificateWizard.tsx`), con bastante lógica local.

- **Backend**:
  - Node.js + Express + tRPC (`server/_core`).
  - Router principal en `server/routers.ts` con todos los procedimientos (auth, profile, clients, installations, certificates, circuits, calculations, ai, pdf).
  - Lógica de dominio en servicios dedicados (`electrical-calculations.ts`, `diagram-generation.ts`, `pdf-generation.ts`, `subscription-service.ts`).

- **Datos**:
  - Drizzle ORM con MySQL/TiDB (`drizzle/schema.ts`).
  - Esquema ya bastante alineado al dominio (profiles, clients, installations, certificates, circuits, subscriptions).

En conjunto, la arquitectura es sólida para un MVP, pero hay varios puntos donde conviene **estructurar mejor responsabilidades, endurecer contratos y preparar el sistema para crecer**.

---

## 2. Backend: diseño y organización

### 2.1 Problema: `routers.ts` muy cargado

- **Situación**: `server/routers.ts` centraliza todos los routers tRPC (auth, profile, subscription, clients, installations, certificates, calculations, ai, pdf, circuits).
- **Riesgo**:
  - Aumenta la complejidad cognitiva.
  - Dificulta localizar responsabilidades y pruebas unitarias de cada área.

**Propuesta**:
- Extraer routers por dominio a ficheros independientes, por ejemplo:
  - `server/routers/auth.ts`
  - `server/routers/profile.ts`
  - `server/routers/clients.ts`
  - `server/routers/installations.ts`
  - `server/routers/certificates.ts`
  - `server/routers/circuits.ts`
  - `server/routers/calculations.ts`
  - `server/routers/ai.ts`
  - `server/routers/pdf.ts`
- En `routers.ts` solo **componer**:
  - `export const appRouter = router({ auth, profile, clients, ... });`

Beneficios:
- Mejora la legibilidad.
- Facilita tests a nivel de router y revisión por dominio.

### 2.2 Problema: mezcla de validación ligera y lógica de dominio

- **Situación**:
  - Muchos procedimientos tRPC validan con Zod y **llaman directamente a funciones de `db` o servicios**, con poca separación entre **caso de uso** y **persistencia**.
- **Riesgo**:
  - Dificultad para probar reglas de negocio sin tocar DB.
  - Posible duplicación de lógica si la app crece (por ejemplo, distintos flujos que crean certificados).

**Propuesta**:
- Introducir una capa explícita de **“servicios de dominio / casos de uso”** en `server/usecases` o similar:
  - `createCertificateUseCase.ts`, `updateCertificateUseCase.ts`, `calculateAndPersistCircuitData.ts`, etc.
- Dejar en los routers solo:
  - Validación de entrada (Zod).
  - Autorización (uso de `ctx.user`).
  - Llamada al caso de uso.

Beneficios:
- Tests unitarios del dominio más fáciles (sin tRPC ni HTTP).
- Trazabilidad más clara de **reglas de negocio** (p.ej. límites de caída de tensión, campos obligatorios del CIE, etc.).

### 2.3 Problema: uso mixto de `require`/`import` en servicios

- **Situación**:
  - Dentro de algunos procedimientos (p.ej. `calculations`, `ai`, `pdf`, `subscription`) se usa `require` dinámico en lugar de `import`.
- **Riesgo**:
  - Inconsistencia en el estilo de módulo.
  - Dificulta tree-shaking / análisis estático.

**Propuesta**:
- Homogeneizar a **ESM/TypeScript imports** estáticos donde sea posible:
  - Importar servicios al inicio de archivo y no dentro de la función, salvo que sea imprescindible lazy-load por rendimiento.

---

## 3. Motor de cálculos y servicios de dominio

### 3.1 Situación actual (positivo)

- `server/services/electrical-calculations.ts` está:
  - Alineado con el REBT/ITC-BT (resistividades, tablas Imax, factores de corrección).
  - Claramente documentado con comentarios explicativos.
  - Usado desde `calculations.*` y `ai.suggestCircuits`.

### 3.2 Problema: acoplamiento implícito con UI y DB

- El motor de cálculo devuelve resultados numéricos correctos, pero:
  - No existe un tipo de **“resultado de verificación”** que permita distinguir “cumple/no cumple” por criterio.
  - La **trazabilidad** (entradas exactas, versión del motor) todavía no se persiste de forma formal.

**Propuestas**:

- Introducir un tipo de resultado más rico:
  - `CableCalculationVerification = { byVoltageDrop: { ok, margin }, byCurrent: { ok, margin }, recommendedSection, messages: string[] }`.
  - Esto alimentaría mejor la UI y el futuro sistema de informes técnicos.

- Persistir en BD (o en un JSON asociado al certificado) un **“snapshot de cálculo”**:
  - Inputs usados.
  - Resultados clave.
  - Versión del motor de cálculo.

- Añadir **tests unitarios** sistemáticos:
  - Carpeta `server/services/__tests__/electrical-calculations.test.ts`.
  - Casos REBT típicos + casos límite documentados en `CALCULATION_ENGINE_SPEC.md`.

---

## 4. Esquema de datos y migraciones

### 4.1 Situación actual

- El schema Drizzle en `drizzle/schema.ts` está:
  - Bien alineado al dominio CIE (profiles, clients, installations, certificates, circuits).
  - Usando `camelCase` consistente.
  - Con tipos adecuados para muchos campos (por ejemplo, `decimal` para longitudes y resistencias).

### 4.2 Oportunidades de mejora

- **Normalización de enums**:
  - Algunos campos son `varchar` donde en realidad hay un conjunto finito de valores (`installationType`, `groundingSystem`, `electrificationGrade`, etc.).
  - Propuesta: definir enums de dominio (ya sea en BB.DD. o en capas superiores con Zod/TypeScript) y usarlos de forma consistente.

- **Campos derivados**:
  - Ciertos datos podrían ser calculados a partir de otros (por ejemplo, potencia total a partir de circuitos), pero hoy se guardan solo como números sueltos.
  - Propuesta: marcar claramente qué campos son **de entrada del usuario** y cuáles son **derivados** para evitar desincronizaciones.

---

## 5. Frontend: diseño de componentes y UX técnica

### 5.1 Problema: componentes de página muy grandes

- `CertificateWizard.tsx` concentra:
  - Definición del tipo de formulario.
  - Lógica paso a paso.
  - Gestión de creación/edición de cliente, instalación, certificado y circuitos.
  - Llamadas directas a mutaciones tRPC.

**Riesgos**:
- Dificultad para testear comportamientos complejos.
- Alto coste cognitivo al hacer cambios en el wizard.

**Propuesta de refactor**:

- Dividir en **subcomponentes por paso**:
  - `WizardStep1Client`, `WizardStep2Installation`, `WizardStep3Derivation`, etc.
  - Mantener un `CertificateWizardContainer` que:
    - Gestione el estado global (o use React Hook Form + contexto).
    - Pase a cada paso solo los datos y handlers necesarios.

- Valorar el uso de **React Hook Form + Zod**:
  - Actualmente la validación está repartida; un esquema Zod por paso facilitaría:
    - Validación coherente.
    - Mensajes de error específicos y reutilizables.

### 5.2 UX de cálculos y verificaciones

- Oportunidad:
  - Exponer de forma más clara, en la UI, **“esto cumple / no cumple el REBT por estos motivos”**.
  - Mostrar márgenes (por ejemplo, “caída de tensión real 1,2% — límite 3%”).

**Propuesta**:
- Crear un componente `ComplianceBadge` o similar que reciba:
  - Resultado del cálculo.
  - Límites normativos.
  - Mensaje amigable.

---

## 6. Buenas prácticas transversales pendientes

### 6.1 Testing

- Pendiente según `CLAUDE.md`:
  - Tests unitarios de `electrical-calculations.ts`.
  - Tests E2E (Playwright) del flujo completo de CIE.

**Plan sugerido**:
- Empezar por:
  - Unit tests del motor de cálculo (casos documentados).
  - 1–2 E2E muy claros: creación de CIE de vivienda estándar hasta generación de documento.

### 6.2 Observabilidad y logs

- Añadir:
  - Logging estructurado en errores de cálculo y generación de PDF.
  - Identificadores de certificado/usuario en logs importantes.

### 6.3 Seguridad y robustez

- Una vez cubierto el plan de fases:
  - Implementar rate limiting básico en endpoints sensibles (login, generación de PDF, cálculos).
  - Revisar y endurecer validaciones en `routers.ts` para inputs numéricos (rango razonable).

---

## 7. Hoja de ruta de mejora técnica (post-plan de fases)

Orden sugerido una vez completado el plan funcional:

1. **Refactor de routers en módulos de dominio + capa de casos de uso**.
2. **Refactor del wizard en pasos desacoplados + validación con Zod**.
3. **Trazabilidad de cálculos**:
   - Tipos de resultado de verificación.
   - Persistencia de snapshots de cálculo.
   - Tests unitarios.
4. **Normalización de enums y limpieza de schema**.
5. **Testing E2E mínimo + observabilidad básica**.
6. **Refinamiento de UX orientada a cumplimiento normativo** (badges de conformidad, explicaciones).

Este documento sirve como guía de trabajo estructurada cuando el foco pase de “hacer que funcione” a “hacer que sea robusto, mantenible y excelente para largo plazo”.

