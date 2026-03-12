# CertIA — Informe Estratégico y Técnico para la Optimización de la App de CIE (Reglamento Electrotécnico para Baja Tensión, España)

## Objetivo del documento

Analizar la aplicación existente de generación de **Certificados de Instalación Eléctrica (CIE)** y producir un informe estratégico y técnico que permita:

1. Reducir el trabajo del instalador al mínimo imprescindible.  
2. Mejorar la experiencia de usuario y la eficiencia del flujo.  
3. Detectar errores y limitaciones actuales.  
4. Proponer mejoras innovadoras y diferenciadoras.  
5. Generar un roadmap de desarrollo con estimación de costes y rentabilidad.

El enfoque es **accionable y pragmático**: este documento debe servir como guía directa para el desarrollo y evolución del producto en los próximos 12–24 meses.

---

## Sección 1 — Auditoría completa de la app existente

### 1.1 Descripción de la app actual

- **Nombre**: CertIA  
- **Dominio**: Generación de Certificados de Instalación Eléctrica (CIE) según REBT en España.  
- **Plataforma**: Aplicación web (SPA) construida con:
  - Frontend: React + TypeScript + Vite, Tailwind CSS v4, shadcn/ui, wouter.
  - Backend: Node.js + Express + tRPC (tipado end-to-end).
  - Datos: Drizzle ORM sobre MySQL/TiDB.
  - Servicios adicionales: Manus OAuth (auth), Stripe (suscripciones), AWS S3 (archivos), OpenAI (IA prevista).

- **Público objetivo**:
  - Instaladores eléctricos autorizados (autónomos y pymes).
  - Ingenierías que supervisan y firman instalaciones de BT.
  - A medio plazo, colegios profesionales y empresas distribuidoras como prescriptores.

- **Estado actual**:
  - MVP avanzado (~85% completado).
  - Flujo principal de creación de CIE funcional:
    - Gestión de clientes e instalaciones.
    - Wizard de 6 pasos para certificados.
    - Motor de cálculos alineado con REBT (ITC-BT-07, 08, 15, 19, 25, 47).
    - Generación de documento HTML/PDF con datos del instalador.
  - Pendiente:
    - Tests unitarios y E2E.
    - Rate limiting, caché, observabilidad.
    - Integraciones avanzadas (firma digital, sedes electrónicas).

---

### 1.2 Flujo actual para generar un CIE

El flujo principal se articula alrededor de un **wizard de 6 pasos** (`CertificateWizard.tsx`), apoyado en routers tRPC (`server/routers.ts`) y en el esquema de BD (`drizzle/schema.ts`).

#### 1.2.1 Inputs requeridos (visión de alto nivel)

1. **Datos de cliente**:
   - Tipo (persona/empresa).
   - Nombre.
   - DNI/NIF.
   - Contacto: email, teléfono.
   - Dirección (calle, CP, ciudad, provincia).

2. **Datos de instalación**:
   - Nombre descriptivo de la instalación.
   - Tipo (vivienda, local comercial, nave industrial, etc.).
   - Dirección.
   - Referencia catastral (opcional, manual).
   - CUPS (opcional, manual).

3. **Datos eléctricos generales**:
   - Tipo de instalación / uso.
   - Categoría de localización (seco, húmedo, etc., en forma simplificada).
   - Grado de electrificación (básico/elevado).
   - Tensión de suministro.
   - Potencia instalada / prevista.
   - Número de fases.

4. **Derivación individual y cuadro**:
   - Sistema de puesta a tierra (TT/TN/IT).
   - Temperatura ambiente.
   - Método de instalación (empotrado, en tubo, bandeja, etc.).
   - Longitud de derivación.
   - Sección de derivación.
   - Material (Cu/Al) e aislamiento (PVC/XLPE).
   - Ubicación del cuadro.
   - IGA (calibre).
   - Sensibilidad de diferencial general (Idn).
   - Protecciones contra sobretensiones (sí/no).
   - Resistencia de tierra medida.

5. **Circuitos interiores**:
   - Para cada circuito:
     - Número y nombre (C1, C2, etc.).
     - Tipo (iluminación, tomas, cocina, baños, etc.).
     - Potencia asociada.
     - Longitud.
     - Sección de conductores.
     - Material, aislamiento, nº de conductores activos.
     - Magnetotérmico: calibre y curva.
     - Diferencial asociado (si aplica) y sensibilidad.
     - Descripción de carga.

6. **Mediciones y comprobaciones**:
   - Resistencia de aislamiento.
   - Continuidad de conductores de protección.
   - Corriente y tiempo de disparo de diferenciales.
   - Observaciones adicionales.

7. **Datos del instalador/empresa** (perfil):
   - Nombre completo.
   - Compañía instaladora.
   - CIF/NIF.
   - Nº de instalador autorizado.
   - Categoría de instalador.
   - Nº de autorización de empresa instaladora.
   - Comunidad autónoma.
   - Datos de contacto (teléfono, dirección).

#### 1.2.2 Procesos automáticos

- **Motor de cálculos eléctricos** (`electrical-calculations.ts`):
  - Cálculo de sección mínima de conductores según:
    - Intensidad admisible (tablas Imax, factores de corrección).
    - Caída de tensión máxima (1%, 3%, 5%).
  - Verificación de coordinación PIA ↔ cable.
  - Cálculo de tensión de contacto y resistencia de tierra máxima admisible.
  - Cálculo de IGA recomendado en función de la potencia y nº de fases.
  - Sugerencias de protecciones generales (IGA, diferencial, resistencia de tierra máxima).

- **Sugerencia de circuitos tipo** (`suggestCircuitsForInstallationType`):
  - Para vivienda, local comercial, nave industrial, etc., propone conjuntos de circuitos C1–C5 y otros.
  - Incluye sección de cable, calibre, curva, y si requieren diferencial.

- **Generación de diagramas**:
  - Generación de código Mermaid y HTML para esquemas unifilares (`diagram-generation.ts`).

- **Generación de documento**:
  - Montaje de un HTML de CIE (`pdf-generation.ts`) en base a:
    - Certificado, cliente, instalación, perfil del instalador y circuitos.
  - Renderizado HTML listo para convertir a PDF (actualmente HTML; PDF completo pendiente de perfeccionar).

#### 1.2.3 Generación de PDFs y esquemas

- **CIE**:
  - HTML generado con datos:
    - Identificación de cliente.
    - Instalación (dirección, uso, tensión, potencia, etc.).
    - Derivación individual (longitud, sección, método de instalación).
    - Cuadro general (IGA, diferenciales, protecciones contra sobretensiones).
    - Circuitos interiores.
    - Mediciones.
    - Datos del instalador y empresa.
  - El flujo actual utiliza ese HTML como base para:
    - Previsualizar y exportar.
    - En evoluciones futuras: convertir a PDF profesional (Playwright/Puppeteer).

- **Esquemas unifilares**:
  - El usuario puede solicitar la generación de un esquema unifilar:
    - Entrada: tipo de instalación, tensión, fases, sistema de tierra, IGA, diferencial, circuitos.
    - Salida: diagrama Mermaid y representación HTML.

#### 1.2.4 Integraciones externas (estado actual)

- **Firma digital**:
  - No está integrada aún.
  - La firma se considera, en esta fase, manual (firmar el documento una vez descargado/imprimido).

- **Catastro / sedes electrónicas**:
  - No existe integración automática.
  - La referencia catastral y el CUPS se introducen manualmente.

- **Registros autonómicos / sedes de industria**:
  - No hay conexión directa.
  - El documento generado facilita la presentación, pero el envío/registro se realiza fuera de la app.

#### 1.2.5 Validación normativa (REBT)

- **Embedida en lógica de cálculo y sugerencias**:
  - Uso de tablas de Imax y resistividades alineadas con ITC-BT-07 y 19.
  - Límite de caída de tensión diferenciado según tipo de tramo (1%, 3%, 5%).
  - Sugerencias de circuitos mínimos obligatorios para viviendas (incluyendo C5).
  - Cálculo de tensión de contacto y resistencia de tierra máxima (criterios de ITC-BT-18/24).

- **Validación de “cumplimiento/no cumplimiento” a nivel de UI**:
  - Aún limitada: el motor devuelve datos numéricos y mensajes, pero la UI no explota todavía un sistema visual de conformidad tipo “OK/KO con explicación”.

#### 1.2.6 Descarga y entrega al cliente

- Flujo actual:
  - Generación del documento (HTML) desde el certificado.
  - Descarga/exportación (HTML; PDF a completar).
  - Envío al cliente por correo o impresión: fuera de la aplicación (acción manual del instalador).

---

### 1.3 Nivel de automatización actual

| Área                             | Nivel de automatización | Comentario                                                                 |
|---------------------------------|--------------------------|----------------------------------------------------------------------------|
| Alta/gestión de clientes        | Medio                    | Alta/edición/listado automatizados, pero sin importación masiva.          |
| Alta de instalaciones           | Medio                    | Formulario completo, sin autocompletado desde catastro/CUPS.              |
| Parámetros eléctricos generales | Bajo-Medio               | Usuario introduce la mayoría de datos manualmente.                         |
| Derivación individual           | Medio                    | Datos manuales; cálculo de secciones/protecciones asistido.               |
| Circuitos interiores            | Medio                    | Sugerencia automática de circuitos por tipo de instalación.               |
| Verificaciones REBT             | Medio                    | Cálculos correctos, presentación mejorable (no hay “semáforo” global).    |
| Generación de documento CIE     | Medio                    | HTML generado automáticamente; plantilla mejorable; PDF profesional WIP.   |
| Firma y registro                | Bajo                     | Firma y presentación en sede: manuales.                                   |
| Integraciones externas          | Bajo                     | Catastro, sedes, firma digital: no integrados aún.                        |

---

### 1.4 Puntos críticos de fricción para el usuario

Principales fricciones detectadas (desde la perspectiva de un instalador):

- **Cantidad de inputs manuales**:
  - El wizard requiere rellenar muchos campos para un primer uso.
  - Faltan:
    - Autocompletado a partir de soluciones tipo.
    - Plantillas por tipo de instalación/cliente.

- **Ausencia de automatismos con catastro/CUPS**:
  - El instalador debe copiar datos de otros sistemas, con riesgo de errores y pérdida de tiempo.

- **Generación y firma del documento**:
  - La generación HTML está bien, pero:
    - No hay integración de firma digital (certificado FNMT, DNIe, etc.).
    - No hay integración “one-click” con sedes autonómicas.

- **Validación normativa poco “visual”**:
  - Aunque el motor es robusto, el instalador no ve de un vistazo:
    - Qué está perfecto.
    - Qué requiere revisión.
    - Qué es crítico vs. recomendable.

- **Onboarding y curva de aprendizaje**:
  - La app exige entender muchos conceptos técnicos desde el primer momento.
  - Sería deseable un modo guiado “asistente” que pregunte menos y haga más.

---

### 1.5 Modelo de negocio actual (diseñado)

Tal como se define en `CLAUDE.md`:

- **Planes**:
  - Free: 5 certificados/mes.
  - Pro: 500 certificados/mes.
  - Enterprise: ilimitados, condiciones custom.

- **Cobro**:
  - Integración con Stripe prevista:
    - Suscripciones mensuales.
    - Control de límite de certificados por plan (campo `certificatesLimit` y `certificatesUsed`).

- **Estado**:
  - Infraestructura de suscripción lista en backend.
  - Modelo todavía no lanzado al mercado; “precio real” y packaging final por cerrar.

---

### 1.6 Flujo actual vs flujo ideal (tabla resumen)

| Paso                          | Flujo actual                                                                 | Flujo ideal deseado                                                                                   |
|-------------------------------|------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Alta de cliente               | Formulario completo manual.                                                 | Búsqueda rápida por NIF/email + autocompletar, importación desde CSV o agenda previa.                 |
| Alta de instalación           | Datos completos introducidos a mano.                                       | Búsqueda en catastro / CUPS, autocompletado de dirección y tipo de inmueble.                          |
| Definición de parámetros BT   | Usuario rellena tensión, potencia, fases, etc.                             | Wizard reducido: seleccionar “tipo de instalación” → parámetros por defecto ajustables.               |
| Derivación individual         | Usuario indica longitud, sección, método; motor ayuda con secciones.       | Usuario solo indica potencia y recorrido aproximado → motor propone automáticamente sección y método. |
| Circuitos interiores          | Circuitos sugeridos + edición manual extensa.                              | Circuitos preconfigurados por plantilla; solo se ajustan potencias especiales.                        |
| Verificación normativa        | Cálculos correctos pero visualización simple.                              | Panel tipo “semáforo REBT” + informe de revisión con explicación y referencias ITC-BT.                |
| Generación del CIE            | HTML/PDF preliminar, descarga manual.                                      | PDF oficial listo + memoria técnica + esquemas, todo en un clic.                                     |
| Firma y presentación          | Manual fuera de la plataforma.                                             | Firma digital integrada y envío directo a la sede autonómica (cuando la normativa lo permita).        |
| Modelo de negocio             | Definido en código, no explotado aún.                                      | Suscripción clara + pago por certificado extra + add-ons (memoria técnica, integraciones).           |

---

## Sección 2 — Identificación de errores, limitaciones y oportunidades

### 2.1 Clasificación de problemas por categorías

#### UX / experiencia de usuario

- Formularios largos con muchos campos visibles desde el inicio.
- Poca jerarquía visual de “crítico vs opcional”.
- Falta de mensajes normativos en contexto (p.ej. por qué un campo es obligatorio).

#### Inputs y carga manual

- Alto volumen de datos introducidos manualmente.
- No hay reutilización suficiente de plantillas y soluciones tipo.
- Falta de importación desde fuentes externas (catastro, CSV, otros sistemas).

#### Automatización normativa

- Motor de cálculo robusto pero poco explotado a nivel de UX.
- No existe un “informe de cumplimiento REBT” estructurado.
- Pocas reglas de negocio “no numéricas” (por ejemplo, obligatoriedad de ciertos circuitos según uso).

#### Integraciones técnicas

- Sin integración con catastro, CUPS, sedes electrónicas o firma digital.
- Integración IA (OpenAI) para sugerencias avanzada aún en modo prototipo.

#### Movilidad y compatibilidad

- Web app; usable en tablet/móvil vía navegador, pero sin PWA ni app móvil nativa.
- No hay experiencia optimizada para uso “en obra” (modo offline, subida de fotos, etc.).

#### Modelo de negocio / precio

- Planes definidos pero sin validación real de mercado.
- Falta de estrategia clara freemium + pago por CIE.

#### Escalabilidad

- Arquitectura buena base, pero:
  - Faltan tests, rate limiting, caching, observabilidad.
  - Routers monolíticos que pueden crecer en complejidad.

---

### 2.2 Detalle de problemas y oportunidades

Ejemplo resumido (no exhaustivo):

| Categoría              | Problema / limitación                                            | Gravedad | Impacto usuario                           | Oportunidad de mejora                                              |
|------------------------|------------------------------------------------------------------|----------|-------------------------------------------|---------------------------------------------------------------------|
| UX                     | Formularios largos y densos                                     | Alta     | Abandono, sensación de “papeleo digital” | Rediseñar wizard → menos campos, progresivos, ayudas contextuales. |
| Inputs manuales        | Sin autocompletado desde catastro/CUPS                          | Alta     | Tiempo perdido, errores en direcciones   | Integración API catastro o servicios terceros.                      |
| Automatización normativa | Resultados técnicos poco “humanos”                              | Media    | Falta de confianza en cálculos           | Panel de conformidad + informe de revisión legible.                |
| Integraciones          | Sin firma digital ni envío a sedes                              | Media    | Paso final manual, susceptible a errores | Integrar firma digital + generación de paquetes para sedes.        |
| Movilidad              | Experiencia móvil genérica                                      | Media    | Difícil de usar en obra                  | PWA o app móvil con flujos simplificados y offline.                |
| Modelo de negocio      | Planes no probados en mercado                                   | Media    | Riesgo de desajuste precio/valor         | Experimentos de pricing (pay-per-CIE, bundles, etc.).              |
| Escalabilidad técnica  | Falta de tests y observabilidad                                | Alta     | Riesgo de errores en producción          | Priorizar testing, logging, alertas, antes de escalar usuarios.    |

---

### 2.3 Mapa visual de problemas vs impacto (conceptual)

Se puede representar como matriz bidimensional:

- Eje X: **Esfuerzo técnico** (bajo → alto).  
- Eje Y: **Impacto en valor para el instalador/ingeniero** (bajo → alto).

Ejemplos en cada cuadrante:

- **Alto impacto / bajo esfuerzo**:
  - Panel de conformidad REBT simple (semáforo).
  - Plantillas de circuitos tipo por instalación.
  - Mensajes normativos en contexto.

- **Alto impacto / alto esfuerzo**:
  - Integración con sedes electrónicas y firma digital.
  - Integración BIM y mediciones avanzadas.

- **Bajo impacto / bajo esfuerzo**:
  - Micro-mejoras de copy y tooltips.

- **Bajo impacto / alto esfuerzo**:
  - Características muy específicas para nichos pequeños (priorizarlas al final).

Este mapa sirve como base para seleccionar el orden de implementación en el roadmap.

---

## Sección 3 — Propuesta de valor para la app optimizada

### 3.1 Flujo mínimo y optimizado para el usuario

Objetivo: que el instalador pueda **generar un CIE completo** introduciendo **menos de 10 campos esenciales**, y que el resto se derive de:
- Plantillas por tipo de instalación.
- Datos históricos de cliente/instalación.
- Integraciones externas.

#### 3.1.1 Inputs esenciales (ideal)

1. Tipo de instalación (vivienda unifamiliar, local, nave, etc.).  
2. Dirección o referencia catastral.  
3. Potencia prevista / contratada.  
4. Esquema de conexión y sistema de tierra (TT/TN).  
5. Grado de electrificación (básico/elevado).  
6. Si se trata de instalación nueva, reforma o ampliación.  
7. Datos básicos del titular (nombre/NIF).  
8. Selección de una **plantilla de solución tipo** (si aplica).  
9. Medidas clave (resistencia de tierra, aislamiento, test diferenciales).  

Con eso, la app debería poder:

- Proponer:
  - Derivación individual (sección, método de instalación, protección).
  - Circuitos mínimos obligatorios + adicionales según potencia/uso.
  - Protecciones, secciones y esquemas unifilares.

#### 3.1.2 Automatizaciones deseadas

- **Cálculo automático de circuitos y protecciones**:
  - A partir de tipo de instalación + potencia total + grado de electrificación.

- **Generación automática de circuitos C1–C5 y adicionales**:
  - Compatible con ITC-BT-25, ajustando potencias y número de puntos.

- **Generación automática de documentos**:
  - CIE completo (PDF).
  - Memoria técnica abreviada.
  - Esquemas unifilares.

- **Integración con catastro y sedes electrónicas**:
  - Autocompletar dirección, tipo de edificio.
  - Generar “paquete” (PDF + XML/CSV) para subida a sede.

- **Firma digital**:
  - El instalador firma el CIE desde el navegador (FNMT/DNIe/Cl@ve) sin salir de la app.

---

### 3.2 Funcionalidades innovadoras y diferenciadoras

Algunas propuestas clave (profundizadas en `ENGINEER_VALUE_FEATURE_IDEAS.md`):

1. **“Ingeniero virtual REBT”**:
   - Asistente que revisa el CIE y emite un informe técnico:
     - Lista de no conformidades.
     - Avisos (riesgos, márgenes ajustados).
     - Recomendaciones de mejora.

2. **Generación automática de esquemas unifilares**:
   - A partir de los datos de circuitos y cuadros.
   - Exportables como imagen, PDF y código Mermaid.

3. **Alertas de normativa actualizada**:
   - Notificaciones cuando cambie una ITC-BT relevante.
   - Sugerencias de actualización de plantillas y criterios.

4. **Funcionalidad móvil nativa / PWA**:
   - Uso en obra:
     - Captura de fotos y notas.
     - Rellenar solo los mínimos campos in situ.
   - Sin necesidad de portátil.

---

### 3.3 Optimización del modelo de negocio

Modelo híbrido:

- **Freemium**:
  - Alta gratis, hasta X certificados/mes.
  - Acceso limitado a plantillas y sin firma digital integrada.

- **Pago por certificado**:
  - Instaladores ocasionales:
    - Tarifa por CIE emitido (p.ej. 5–10 €).

- **Suscripción mensual/anual**:
  - Instaladores y empresas con volumen:
    - Plan Pro: número elevado de CIE/mes + plantillas + informes avanzados.
    - Plan Enterprise: ilimitado + integraciones a medida (ERP, sedes, BIM).

- **Add-ons**:
  - Módulo de memorias técnicas.
  - Integración BIM.
  - Formación y soporte prioritario.

---

### 3.4 Por qué la versión optimizada sería única y más eficiente

- **Enfoque normativo profundo**:
  - Muy pocas herramientas SaaS de CIE en España ofrecen:
    - Motor de cálculo alineado a REBT.
    - Documentación detallada y trazable de decisiones de diseño.

- **Experiencia centrada en el instalador y el ingeniero**:
  - Menos campos, más automatismos.
  - Informes que facilitan la firma responsable.

- **Ecosistema de valor añadido**:
  - plantillas, biblioteca de soluciones tipo, alertas normativas, integraciones avanzadas.

---

## Sección 4 — Roadmap de desarrollo, costes y rentabilidad

> Nota: cifras orientativas para guiar decisiones (pueden ajustarse según equipo, tarifas y calendario real).

### 4.1 Fases: MVP, beta, versión comercial

#### Fase 1 — MVP consolidado (0–3 meses)

- Objetivo:
  - Consolidar el flujo actual.
  - Corregir limitaciones críticas.
  - Asegurar validez técnica del CIE.

- Funcionalidades:
  - Motor de cálculo estabilizado + tests unitarios.
  - PDF CIE profesional listo para uso real.
  - Wizard optimizado (menos fricción).
  - Suscripción básica funcional (Stripe).

#### Fase 2 — Beta “value-focused” (3–6 meses)

- Objetivo:
  - Reducir el trabajo manual.
  - Aportar valor diferencial al ingeniero.

- Funcionalidades:
  - Plantillas por tipo de instalación.
  - Panel de conformidad REBT.
  - Informe de revisión básico.
  - Primeras integraciones ligeras (importación simple, exportaciones).

#### Fase 3 — Versión comercial 1.0 (6–12 meses)

- Objetivo:
  - Lanzamiento masivo.
  - Modelo de negocio validado.

- Funcionalidades:
  - Firma digital integrada.
  - Paquetes para sedes autonómicas (donde sea viable).
  - App móvil/PWA básica.
  - Módulo de memorias técnicas.
  - Paneles de métricas y reporting.

---

### 4.2 Complejidad técnica, prioridad y tiempos estimados

Ejemplo de tabla simplificada:

| Funcionalidad                         | Fase   | Complejidad | Prioridad | Tiempo estimado (dev efectivo) |
|--------------------------------------|--------|------------|-----------|--------------------------------|
| Tests motor de cálculo               | Fase 1 | Media      | Alta      | 2–3 semanas                    |
| PDF CIE profesional                  | Fase 1 | Media      | Alta      | 2–3 semanas                    |
| Refactor wizard + UX básica          | Fase 1 | Media      | Alta      | 3–4 semanas                    |
| Panel conformidad REBT               | Fase 2 | Media      | Alta      | 2–3 semanas                    |
| Plantillas por tipo de instalación   | Fase 2 | Baja       | Alta      | 1–2 semanas                    |
| Informe de revisión básico           | Fase 2 | Media      | Media     | 2–3 semanas                    |
| Firma digital integrada              | Fase 3 | Alta       | Alta      | 4–6 semanas                    |
| Paquetes para sedes autonómicas      | Fase 3 | Alta       | Media     | 4–8 semanas                    |
| App móvil / PWA                      | Fase 3 | Alta       | Media     | 6–10 semanas                   |
| Módulo memorias técnicas             | Fase 3 | Media      | Media     | 3–5 semanas                    |

---

### 4.3 Costes de desarrollo y operación (orden de magnitud)

Suponiendo equipo reducido (1–2 devs senior + 1 dev frontend, tarifas mixtas):

- **Desarrollo**:
  - Fase 1 (3 meses): 25–40 k€.
  - Fase 2 (3 meses): 30–45 k€.
  - Fase 3 (6 meses): 60–90 k€.

- **Operación (anual)**:
  - Infraestructura (cloud, DB, almacenamiento, APIs IA): 5–15 k€/año.
  - Soporte y mantenimiento evolutivo: 20–40 k€/año.
  - Marketing y adquisición: 20–60 k€/año (variable).

---

### 4.4 Estimación de ingresos y escenarios

Hipótesis simplificada:

- Precio medio:
  - Instalador individual: 20–40 €/mes o 5–10 €/CIE.
  - PYMEs/ingenierías: 100–300 €/mes.

- Escenario **pesimista** (año 2):
  - 100 instaladores de pago.
  - Ticket medio 30 €/mes.
  - Ingresos ≈ 36 k€/año.

- Escenario **medio**:
  - 300 instaladores de pago.
  - Ticket medio 40 €/mes.
  - Ingresos ≈ 144 k€/año.

- Escenario **optimista**:
  - 700 instaladores de pago.
  - Ticket medio 50 €/mes.
  - Ingresos ≈ 420 k€/año.

---

### 4.5 ROI estimado y tiempo de recuperación

Suponiendo:

- Inversión total inicial (18 meses): ~150–200 k€ en desarrollo + 50–70 k€ en operación/marketing.  
- Total ≈ 200–270 k€.

Tabla simplificada:

| Escenario   | Ingresos anuales (año 2–3) | Inversión inicial | ROI aprox. a 3 años | Tiempo de payback estimado |
|-------------|----------------------------|-------------------|----------------------|----------------------------|
| Pesimista   | 36 k€/año                  | 200 k€            | Negativo             | >5 años                    |
| Medio       | 144 k€/año                 | 200 k€            | ~+100%               | ~2–3 años                  |
| Optimista   | 420 k€/año                 | 200 k€            | >+400%               | ~1–2 años                  |

---

## Sección 5 — Conclusiones estratégicas

### 5.1 Resumen de mejoras críticas

1. **Reducir inputs manuales**:
   - Plantillas de soluciones tipo.
   - Integraciones simples (catastro/CUPS).
2. **Mejorar UX y confianza**:
   - Panel de conformidad REBT.
   - Informe de revisión claro.
3. **Automatizar al máximo el ciclo del CIE**:
   - Cálculo de circuitos y protecciones.
   - Generación de CIE + memoria + esquemas en un clic.
4. **Preparar el salto a producción**:
   - Tests, observabilidad, seguridad, rate limiting.

### 5.2 Oportunidades de innovación

- Ingeniero virtual REBT.  
- Biblioteca de soluciones tipo y versiones comparadas de instalaciones.  
- Conexión con sedes y firma digital.  
- Extensión natural hacia otros documentos reglamentarios (no solo CIE).

### 5.3 Riesgos regulatorios y técnicos

- Cambios normativos futuros (actualización REBT/ITC-BT).  
- Complejidad legal de integraciones con sedes electrónicas.  
- Riesgo de depender demasiado de IA sin supervisión humana (hay que dejar clara la responsabilidad del ingeniero).

### 5.4 Ventajas competitivas de la versión optimizada

- Profundo alineamiento con el REBT desde el diseño.  
- Experiencia pensada **para el ingeniero que firma**, no solo para “rellenar formularios”.  
- Ecosistema de funcionalidades que convierten a CertIA en:
  - Herramienta de diseño.
  - Herramienta de comprobación.
  - Herramienta de documentación y gestión.

### 5.5 Recomendaciones finales

1. Completar y robustecer el MVP actual (plan de fases) como base sólida.  
2. Priorizar mejoras de **alto impacto / bajo esfuerzo** (UX, panel de conformidad, plantillas).  
3. Planificar integraciones complejas (firma, sedes) como proyectos separados con validación de mercado.  
4. Acompañar el desarrollo técnico con:
   - Documentación profesional (ya iniciada en `Documentation/`).  
   - Feedback temprano de instaladores e ingenieros (beta cerrada).  

Con este enfoque, CertIA puede posicionarse como la herramienta de referencia para la generación y gestión de CIE en España, combinando **rigor técnico**, **experiencia de uso sobresaliente** y **modelo de negocio sostenible**.

