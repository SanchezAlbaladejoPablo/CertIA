# CertIA — Propuestas de Funcionalidades de Alto Valor para el Ingeniero

> Objetivo: recopilar ideas de funcionalidades pensadas para que un **ingeniero o instalador experto** sienta que CertIA le aporta tanto valor que “no puede permitirse no usarla”. Este documento no está limitado por el MVP actual; sirve como catálogo de oportunidades a medio/largo plazo.

---

## 1. Asistentes de diseño y verificación avanzados

### 1.1 “Ingeniero virtual REBT”

- Asistente que:
  - Revisa el CIE completo y señala **incongruencias normativas** (no solo errores matemáticos).
  - Explica en lenguaje técnico **por qué** algo no cumple (“El circuito C5 no aparece para vivienda; ITC-BT-25 exige…”, “La caída de tensión total supera el 4% permitida.”).
  - Sugiere alternativas de diseño (aumentar sección, cambiar distribución de circuitos, etc.).
- Modo:
  - **“Informe de revisión” descargable** que el ingeniero puede adjuntar a su expediente interno.

### 1.2 Comparador de versiones de instalación

- Posibilidad de clonar un certificado y:
  - Modificar parámetros (potencia, secciones, protecciones).
  - Ver un **diff técnico**:
    - cambios en sección de cables, intensidades, caídas de tensión,
    - impacto en coste de materiales (si se integra con precios).
- Esto permite a un ingeniero:
  - Justificar decisiones de diseño ante cliente / promotora (“Opción A vs Opción B”).

### 1.3 “What-if” de protecciones y secciones

- Herramienta interactiva donde:
  - Se puede variar rápidamente calibre de IGA/PIA, sección de conductores, tipo de instalación, temperatura.
  - La app recalcula en tiempo real:
    - Si cumple Imax.
    - Caída de tensión.
    - Tensión de contacto y resistencia de tierra máxima.
- Uso típico:
  - Fase de diseño o reforma rápida, sin necesidad de rehacer un CIE completo.

---

## 2. Gestión integral del ciclo de vida de instalaciones

### 2.1 Historial de intervenciones y certificados por instalación

- Para cada instalación:
  - Línea de tiempo con:
    - Altas/bajas de contratos.
    - Certificados emitidos (CIE inicial, ampliaciones, reformas, revisiones).
    - Observaciones técnicas importantes (p.ej. “Puesta a tierra mejorada en 2026”).
- Valor:
  - El ingeniero tiene una **visión histórica completa** sin revisar carpetas físicas o múltiples PDFs.

### 2.2 Alertas y recordatorios inteligentes

- Recordatorios de:
  - Revisiones periódicas según tipo de instalación (cuando aplique).
  - Vencimientos de validez de ciertos documentos relacionados.
- Opcionalmente:
  - Notificaciones al cliente final (si el instalador lo autoriza) para fidelizar y generar negocio recurrente.

---

## 3. Integraciones y automatización documental

### 3.1 Banco de plantillas oficiales por comunidad autónoma

- Selección de:
  - Formato CIE específico por comunidad (cuando existan variantes).
- CertIA:
  - Rellena automáticamente los campos comunes.
  - Genera un **paquete de documentos** listo para subir al registro autonómico.

### 3.2 Generación automática de memorias técnicas

- A partir de:
  - Datos introducidos en el CIE.
  - Motor de cálculo.
  - Opcionalmente esquemas unifilares.
- La app genera una **memoria técnica redactada**:
  - Descripción de la instalación.
  - Criterios de cálculo.
  - Relación de materiales principales.

### 3.3 Integración con precios y mediciones

- Conexión a bases de datos de precios (p.ej. bases típicas o CSV propio del ingeniero):
  - Asignar a cada circuito / tramo una partida de presupuesto.
  - Obtener un **estimado económico** del diseño (material + mano de obra básica).
- Valor:
  - El ingeniero puede ofrecer al cliente **“CIE + estimación de coste”** sin salir de la herramienta.

---

## 4. Funcionalidades de análisis y reporting para ingenieros senior

### 4.1 Panel de calidad técnica

- Métricas por usuario / empresa:
  - Porcentaje de certificados con revisiones manuales.
  - Motivos más habituales de no conformidad detectados por el asistente.
  - Distribución de tipos de instalación, esquemas de tierra, etc.
- Útil para:
  - Ingenieros responsables de calidad dentro de una empresa instaladora.

### 4.2 Biblioteca de soluciones tipo

- El ingeniero puede:
  - Guardar “soluciones de diseño tipo” (por ejemplo, esquema típico de vivienda de electrificación elevada, local comercial estándar, etc.).
  - Aplicarlas como **plantillas** sobre nuevas instalaciones.
- Con el tiempo:
  - CertIA se convierte en la “biblioteca de know-how” de la propia ingeniería.

---

## 5. Experiencia de uso obsesionada con el ingeniero

### 5.1 Modo “inspector”

- Vista especial que:
  - Oculta campos de edición.
  - Muestra solo:
    - Datos clave.
    - Resultados de cálculo.
    - Indicadores de cumplimiento (OK/KO) con explicación breve + referencia ITC-BT.
- Uso:
  - Para que un ingeniero sénior revise rápidamente el trabajo de un junior o un instalador colaborador.

### 5.2 Explicaciones normativas en contexto

- Para cada campo crítico:
  - Icono de ayuda que explica:
    - Por qué se pide.
    - Dónde aparece en el CIE.
    - A qué artículo/ITC-BT responde.
- Valor:
  - Forma de **formación continua** integrada, especialmente útil para ingenieros jóvenes.

---

## 6. Ideas “sin límite” (a más largo plazo)

### 6.1 Gemelo digital de la instalación en baja tensión

- Representar:
  - La instalación como grafo (alimentación → derivación → cuadros → circuitos → receptores).
  - Permitir simulaciones:
    - Apertura de protecciones.
    - Fallos a tierra o cortocircuito simplificados.

### 6.2 “Marketplace” de soluciones

- Espacio donde:
  - Ingenieros expertos pueden publicar **plantillas y soluciones de diseño** (p.ej. kits de instalaciones tipo).
  - Otros usuarios las adoptan y adaptan.

### 6.3 Integración profunda con BIM

- Importación simplificada desde modelos BIM (IFC) para:
  - Obtener recorridos de canalizaciones.
  - Cubicar longitudes reales de cables.
  - Vincular circuitos de CertIA con elementos del modelo.

---

## 7. Priorización sugerida (una vez consolidado el MVP)

1. **Ingeniero virtual REBT + informe de revisión** (impacto directo en confianza y calidad).
2. **Comparador de versiones de instalación** (herramienta de decisión de diseño).
3. **Historial por instalación + recordatorios** (engancha en el día a día).
4. **Plantillas de soluciones tipo + biblioteca interna** (retiene know-how en la herramienta).
5. **Paquetes de documentos por comunidad autónoma** (reduce fricción administrativa).

Este documento es deliberadamente ambicioso: sirve como **fuente de ideas** para las siguientes fases del producto, priorizando siempre aquello que maximiza el valor percibido por el ingeniero que firma y asume la responsabilidad técnica.

