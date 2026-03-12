# CertIA — Funcionalidad Completa para el Instalador Eléctrico
**Documento de requisitos funcionales completos**
Fecha: Marzo 2026 | Estado: Actualizado post-MVP · ✅ = implementado · ⏳ = pendiente · ❌ = descartado

---

## Objetivo del documento

Recoger **toda** la funcionalidad que debe tener CertIA para que un instalador eléctrico autorizado no tenga ningún motivo para no usarla. El criterio es simple: si hoy lo hace en papel, en Excel o de memoria, CertIA debe hacerlo mejor, más rápido y sin errores.

Este documento se divide en:
1. Correcciones técnicas obligatorias (errores actuales que invalidan el certificado)
2. Datos que faltan para que el CIE sea legalmente válido
3. Automatizaciones de cálculo que ahorran tiempo
4. Funcionalidades de productividad y gestión
5. Funcionalidades avanzadas que diferencian el producto

---

## 1. CORRECCIONES TÉCNICAS OBLIGATORIAS

> Sin estas correcciones, los certificados generados pueden no pasar la inspección de la Consejería de Industria.

### ✅ 1.1 Resistividad del cable a temperatura de trabajo
**Implementado.** La app calcula la sección de cable usando resistividad a temperatura de servicio.
**Problema real:** El REBT obliga a calcular a la temperatura máxima de servicio del aislamiento.

| Aislamiento | Temp. máx. | ρ Cu correcto | ρ Al correcto |
|---|---|---|---|
| PVC | 70°C | 0.02365 Ω·mm²/m | 0.03817 Ω·mm²/m |
| XLPE / EPR | 90°C | 0.02634 Ω·mm²/m | 0.04150 Ω·mm²/m |
| Actual (20°C) | — | 0.01724 Ω·mm²/m | 0.02826 Ω·mm²/m |

**Impacto:** Las secciones calculadas pueden quedar infradimensionadas hasta un 37%.
**Corrección:** Seleccionar ρ según el aislamiento elegido en el formulario.

### ✅ 1.2 Límite de caída de tensión diferenciado
**Implementado.** La app aplica 1% para DI (ITC-BT-15) y 3% para circuitos interiores (ITC-BT-19).
**Corrección según REBT:**
- Derivación Individual → **máximo 1%** (ITC-BT-15)
- Circuitos interiores → **máximo 3%** (ITC-BT-19)
- Instalaciones industriales → **máximo 5%** (ITC-BT-47)

### ✅ 1.3 Factores de corrección de intensidad admisible
**Implementado.** Factores de temperatura, agrupamiento y método de instalación disponibles vía `calculations.correctionFactor`.
**Corrección — aplicar factores de ITC-BT-07 y ITC-BT-19:**

| Factor | Variable | Ejemplo |
|---|---|---|
| Temperatura ambiente (kt) | 25°C→1.0, 40°C→0.87, 50°C→0.71 | Cable en zona caliente |
| Agrupamiento (kg) | 2 cables→0.80, 3→0.70, 4→0.65 | Varios circuitos en tubo |
| Tipo de instalación (ki) | Empotrado→0.77, Bandeja→1.0, Aéreo→1.0 | Instalación bajo tubo |

**Impacto:** Sin estos factores un cable puede quedar sobrecargado en uso real.

### ✅ 1.4 Circuito C5 obligatorio en viviendas (ITC-BT-25)
**Implementado.** Las sugerencias determinísticas de `ai.suggestCircuits` incluyen C5 para instalaciones de tipo vivienda.
**ITC-BT-25 establece 5 circuitos mínimos obligatorios en toda vivienda:**

| Circuito | Uso | Sección mín. | PIA mín. |
|---|---|---|---|
| C1 | Alumbrado | 1.5 mm² | 10A |
| C2 | Tomas uso general | 2.5 mm² | 16A |
| C3 | Cocina y horno | 6 mm² | 25A |
| C4 | Lavadora / lavavajillas / termo | 4 mm² | 20A |
| **C5** | **Baños y cuartos de aseo** | **2.5 mm²** | **16A** |

### ✅ 1.5 Generación automática de número de certificado
**Implementado.** `generateCertificateNumber()` se invoca al crear el certificado y asigna el número `CIE-AAAA-XXXX`.

---

## 2. DATOS QUE FALTAN PARA UN CIE LEGALMENTE VÁLIDO

### ✅ 2.1 Datos del instalador autorizado
**Implementado.** Los datos del perfil (nombre, número de carnet RITSIC, categoría, empresa, CIF, número de autorización, CCAA) se auto-inyectan en todos los documentos generados mediante `buildCertificatePdfInputFromId()`. El perfil se rellena una sola vez en Configuración.

### 2.2 Datos adicionales de la instalación
| Campo | Norma | Obligatorio |
|---|---|---|
| Sistema de puesta a tierra | TT / TN-S / TN-C / TT-S | ITC-BT-08 | Sí |
| Tipo de local | Seco / Húmedo / Mojado / Riesgo especial | ITC-BT-30 | Sí |
| Potencia máxima admisible | Dato de la compañía distribuidora | — | Recomendado |
| Número de expediente administrativo | Referencia de la Consejería | — | Según CC.AA. |
| Fecha de primera puesta en servicio | Puede diferir del certificado | — | Sí |
| Grado de electrificación | Básico (5.75 kW) / Elevado (9.2 kW) | ITC-BT-25 | Viviendas |
| Número de puntos de luz / tomas | Recuento por estancia | ITC-BT-25 | Viviendas |

### 2.3 Datos de la Derivación Individual que faltan en el PDF
Campos recogidos en el wizard pero que no aparecen en el PDF:
- Tipo de aislamiento (`PVC` / `XLPE`) — importante para determinar Imax
- Tipo de instalación (empotrado / bajo tubo / bandeja)
- Protección contra sobretensiones (Sí/No)

### 2.4 Datos de circuitos que faltan en el PDF
La tabla de circuitos del PDF actual solo muestra: Nº, Nombre, Potencia, Sección, PIA, RCD.
**Falta:**
- Curva del PIA (B/C/D) — importante para selectividad y coordinación
- Material del cable (Cu/Al)
- Longitud del circuito (m)
- Número de conductores (2/3/4)
- Caída de tensión calculada (%)
- Intensidad de diseño (A)

### ✅ 2.5 Declaración de conformidad con ITCs aplicables
El CIE formal incluye una sección donde el instalador declara qué instrucciones técnicas son de aplicación. Para cada tipo de instalación hay un conjunto estándar:

**Viviendas:** ITC-BT-01, 02, 04, 05, 08, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 43, 44, 47, 51
**Local comercial:** + ITC-BT-28 (iluminación), ITC-BT-29 (zona riesgo explosion si aplica)
**Industrial:** + ITC-BT-47 (motores), ITC-BT-48, ITC-BT-29

---

## 3. AUTOMATIZACIONES DE CÁLCULO

> Cada uno de estos cálculos lo hace hoy el instalador a mano con tablas, calculadora o Excel. CertIA debe hacerlos automáticamente en tiempo real.

### ✅ 3.1 Autocálculo del IGA desde la potencia instalada
**Trigger:** Al introducir potencia en Step 2
**Cálculo:** I = P / (V × cos φ) → siguiente calibre normalizado
**Resultado:** IGA prerrelleno en Step 3, editable
**Ahorro estimado:** 2-3 minutos por certificado

### ✅ 3.2 Autocálculo de la sección de la Derivación Individual
**Trigger:** Al introducir potencia + longitud DI + material
**Cálculo:** Doble criterio (caída de tensión ≤1% + Imax admisible con factores de corrección)
**Resultado:** Sección mínima recomendada mostrada con validación
**Ahorro estimado:** 5-10 minutos (actualmente requiere tablas y calculadora)

### ✅ 3.3 Autocálculo de sección por circuito
**Trigger:** Al introducir potencia + longitud + material de cada circuito
**Cálculo:** Igual que 3.2 pero con límite del 3%
**Resultado:**
- Sección mínima calculada vs sección introducida
- Alerta visual si la sección introducida es inferior a la mínima
- Caída de tensión real calculada (%)
- Intensidad de diseño (A)
**Ahorro estimado:** 3-5 min por circuito × nº circuitos (vivienda típica: 8-12 circuitos)

### ✅ 3.4 Autocálculo del PIA por circuito
**Trigger:** Al introducir potencia del circuito
**Cálculo:** I = P / V → siguiente calibre normalizado → verificar coordinación con sección
**Resultado:** PIA recomendado mostrado, editable
**Validación adicional:** El PIA no puede ser mayor que la sección soporta (coordinación)

### ✅ 3.5 Autocálculo de la resistencia de tierra máxima admisible
**Trigger:** Al seleccionar la sensibilidad del diferencial (30/300 mA)
**Cálculo:** R ≤ 50V / Idn (ya implementado, pero no se muestra en el formulario como referencia)
**Resultado:** Mostrar "Rt máxima: 1.666 Ω" junto al campo de medición
**Validación:** Alertar si la medición introducida supera el máximo

### ✅ 3.6 Verificación de la tensión de contacto
**Trigger:** Al introducir Rt medida + corriente de disparo del diferencial
**Cálculo:** Uc = Rt × Idn
**Validación:** Uc ≤ 50V (ITC-BT-18) — mostrar como "Conforme" / "No conforme"

### ✅ 3.7 Validación de coherencia de potencias
**Trigger:** Al añadir/modificar circuitos
**Validación:** ∑ Potencia de circuitos vs Potencia instalada declarada
**Resultado:** Alerta si la suma supera la potencia declarada o si está muy por debajo (incoherencia)

### ✅ 3.8 Verificación del tiempo de disparo del diferencial
**Cálculo:** IEC 60364-4-41 define los tiempos máximos de disparo según tensión y tipo de sistema
**Validación:** Tiempo medido ≤ tiempo máximo admisible según Idn

### ✅ 3.9 Selector de factores de corrección asistido
El instalador debería poder indicar las condiciones reales y que la app aplique los factores automáticamente:
- Temperatura ambiente del local
- Número de cables agrupados en el mismo tubo/bandeja
- Método de instalación (empotrado en pared, bajo tubo en falso techo, bandeja perforada, aéreo)
- La app calcula el factor resultante y lo aplica a Imax

---

## 4. FUNCIONALIDADES DE PRODUCTIVIDAD Y GESTIÓN

### ✅ 4.1 Perfil del instalador → auto-inyección en certificados
El instalador rellena su perfil una sola vez (nombre, carnet, empresa, autorización) y todos los certificados se generan con esos datos sin volver a pedirlos.

### ⏳ 4.2 Plantillas de certificado reutilizables
> Decisión de diseño: el apartado "Plantillas" se reconvirtió en una página de referencia informativa de los formatos CERTINS por CCAA. El flujo actual permite guardar borradores y duplicar certificados como alternativa.
Para instalaciones repetitivas (vivienda bloque de pisos, locales tipo), el instalador guarda una plantilla con los circuitos y configuración habitual y la aplica como punto de partida.

### ✅ 4.3 Duplicado de certificado con datos del cliente nuevos
Caso de uso: misma instalación para el bloque, el instalador solo cambia el nombre del titular y el número de piso. Actualmente se puede duplicar pero arranca desde cero en el wizard.

### ❌ 4.4 Importación de datos desde fichero
- Importar lista de circuitos desde CSV/Excel (para cuando ya tienen el cuadro definido)
- Importar datos del cliente desde contactos

### ✅ 4.5 Exportación real a PDF
El botón "Descargar CIE" genera un PDF real con Puppeteer vía `pdf.downloadPdf` (tRPC). El endpoint usa `generateCertificateHTMLByCCAA` para la plantilla CCAA correcta y devuelve el buffer en Base64. La firma digital del PDF está implementada vía AutoFirma.

### ❌ 4.6 Historial de versiones del certificado
Si un certificado se modifica (revisión, ampliación), debe quedar constancia de la versión original. Los organismos de control pueden requerir versiones anteriores.

### ✅ 4.7 Estados del certificado con workflow real
El ciclo de vida completo de un CIE:
- **Borrador** → En preparación
- **Emitido** → Firmado por el instalador, pendiente de entrega
- **Presentado** → Entregado a la Consejería de Industria
- **Registrado** → Número de expediente asignado por la Consejería
- **Archivado** → Guardado tras legalización completa

Hoy la app tiene: draft → issued → signed → archived, que no se corresponde exactamente con el flujo real.

### ✅ 4.8 Búsqueda y filtrado avanzado
- Por estado, tipo de instalación, cliente, fecha, potencia
- Búsqueda full-text en observaciones
- Filtro por Comunidad Autónoma

### ✅ 4.9 Estadísticas del instalador
- Certificados emitidos por mes/año
- Potencia total certificada
- Tipos de instalación más comunes
- Tiempo medio de elaboración

### ✅ 4.10 Gestión de instalaciones del mismo cliente
Un cliente puede tener múltiples instalaciones (vivienda + local comercial, varios inmuebles). La app debe mostrarlas todas y permitir crear nuevos certificados desde la ficha del cliente.

---

## 5. FUNCIONALIDADES AVANZADAS (DIFERENCIACIÓN DE PRODUCTO)

### ✅ 5.1 Asistente IA de revisión del certificado (determinístico)
Antes de emitir, una IA revisa el certificado completo y detecta:
- Incoherencias técnicas (sección insuficiente, IGA desproporcionado)
- Campos obligatorios vacíos según la CC.AA.
- Incumplimientos de normativa detectables automáticamente
- Sugerencias de mejora

### ✅ 5.2 Esquema unifilar interactivo
SVG generado programáticamente en `generateUnifilarSVG()`, escalado automático por número de circuitos. Hover sobre cada circuito muestra tooltip con PIA, sección, potencia y RCD. Accesible desde:
- Step 6 del wizard (tab "Unifilar", datos en memoria)
- Lista de certificados (botón Network, carga por ID vía `diagrams.unifilarSvgFromId`)
Excluido del MVP: exportación DXF/DWG y edición directa en diagrama.

### ✅ 5.3 Memoria técnica de diseño
Además del CIE (certificado de fin de obra), los proyectos de instalaciones medianas requieren una **Memoria Técnica de Diseño (MTD)** previo. CertIA podría generar este documento a partir de los mismos datos:
- Datos del promotor
- Descripción de la instalación
- Justificación del cumplimiento del REBT
- Presupuesto estimado (por potencia instalada)
- Planos (al menos el unifilar)

### ❌ 5.4 Base de datos de materiales con precios
Vincular la sección de cada circuito con precios de material de mercado:
- Precio del cable por metro según sección y material
- Precio de las protecciones (PIAs, diferenciales) según calibre
- Coste estimado de material del proyecto

### ✅ 5.5 Adaptación por Comunidad Autónoma
Cada CC.AA. tiene sus propios modelos de CIE y requisitos adicionales:
- **Cataluña:** Formulario RBTCAT específico
- **Madrid:** Modelo propio de la Consejería de Economía
- **Andalucía:** Sistema GIISELA
- **Comunidad Valenciana:** CAVALREP
- La app debería generar el formato específico según la CC.AA. del instalador

### ✅ 5.6 Verificación automática de compatibilidad de protecciones (selectividad)
Comprobar que las protecciones están correctamente coordinadas:
- El PIA del circuito debe disparar antes que el diferencial general
- El diferencial de circuito debe disparar antes que el diferencial general
- El IGA debe soportar la suma de PIAs de circuitos

### ✅ 5.7 Módulo de mantenimiento y revisiones periódicas
Las instalaciones eléctricas requieren inspecciones periódicas (ITC-BT-05):
- Viviendas: cada 20 años (o en cambio de titular)
- Locales públicos: cada 5 años
- Industriales: cada 5 años

La app puede recordar al instalador las revisiones de sus clientes y generar el acta de inspección correspondiente.

### ❌ 5.8 Integración con distribuidoras eléctricas
Para la legalización, las distribuidoras (Endesa, Iberdrola, etc.) requieren documentación específica. Automatizar:
- Generación del boletín de enganche
- Solicitud de nuevo suministro
- Verificación del CUPS

### ✅ 5.9 Firma digital cualificada
Para que el CIE sea completamente electrónico (sin papel), necesita firma digital con certificado reconocido:
- Integración con certificado digital del FNMT
- o-Firma o plataforma equivalente de la AGE
- Timestamp de firma certificado

### ✅ 5.10 Portal del cliente
El cliente del instalador puede acceder a:
- Ver y descargar sus certificados
- Historial de instalaciones
- Recordatorio de revisiones próximas
- Sin necesidad de cuenta propia (acceso por enlace único)

---

## 6. RESUMEN POR IMPACTO Y DIFICULTAD

### Prioridad 1 — Obligatorio para validez legal (implementar antes de producción)
| Nº | Funcionalidad | Impacto |
|---|---|---|
| 1.1 | Resistividad a temperatura de trabajo | CRÍTICO — errores en sección |
| 1.2 | Caída de tensión DI ≤ 1% | CRÍTICO — incumplimiento REBT |
| 1.3 | Factores de corrección de Imax | ALTO — secciones infradimensionadas |
| 1.4 | Circuito C5 en viviendas | ALTO — ITC-BT-25 obligatoria |
| 1.5 | Numeración automática de certificados | MEDIO — campo vacío actual |
| 2.1 | Datos del instalador en el PDF | CRÍTICO — sin esto el CIE es inválido |
| 2.2 | Sistema de puesta a tierra | ALTO |
| 2.4 | Curva PIA y longitud en tabla de circuitos PDF | MEDIO |

### Prioridad 2 — Ahorro de tiempo significativo (máximo valor percibido)
| Nº | Funcionalidad | Ahorro estimado/certificado |
|---|---|---|
| 3.1 | Autocálculo IGA | 2-3 min |
| 3.2 | Autocálculo sección DI | 5-10 min |
| 3.3 | Autocálculo sección por circuito | 3-5 min × circuitos |
| 3.4 | Autocálculo PIA por circuito | 2-3 min × circuitos |
| 3.5 | Rt máxima como referencia en tiempo real | 1-2 min |
| 3.7 | Validación coherencia de potencias | Evita errores |
| 4.1 | Auto-inyección datos instalador | 3-5 min |
| 4.5 | PDF real descargable | Elimina paso manual |

> Un instalador que hace 3-4 certificados/semana actualmente dedica **2-3 horas por certificado**. Con Prioridad 1 + Prioridad 2 implementadas, el objetivo es **20-30 minutos**.

### Prioridad 3 — Diferenciación y retención de usuario
| Nº | Funcionalidad |
|---|---|
| 4.2 | Plantillas reutilizables |
| 4.7 | Workflow de estados completo |
| 5.1 | Asistente IA de revisión |
| 5.5 | Adaptación por CC.AA. |
| 5.6 | Verificación de selectividad |
| 5.7 | Módulo de mantenimiento y revisiones |
| 5.9 | Firma digital |
| 5.10 | Portal del cliente |

---

## 7. LO QUE HACE LA APP MEJOR QUE CUALQUIER ALTERNATIVA HOY

Para contexto: hoy los instaladores usan principalmente:
- **Word/PDF manual:** plantilla descargada de internet, relleno a mano — 3-4h/certificado
- **Excel de cálculo casero:** fórmulas propias, sin validación normativa
- **Software de escritorio obsoleto** (algunos colegios ofrecen herramientas de los 2000s)

CertIA ya supera a todo esto en:
- Cálculos automáticos validados contra REBT
- Generación de esquema unifilar automático
- Gestión de clientes e instalaciones integrada
- Acceso desde cualquier dispositivo (web)
- Historial de certificados organizado

Con las mejoras de Prioridad 1 y 2, CertIA sería la **única herramienta online** que cubre el proceso completo con cálculos correctos según normativa vigente.

---

*Documento preparado para trazar el plan de implementación de tareas — CertIA 2026*
