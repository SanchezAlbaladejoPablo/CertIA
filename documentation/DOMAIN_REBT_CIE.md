# CertIA — Dominio REBT y Certificados de Instalación Eléctrica (CIE)

## 1. Marco normativo

CertIA se orienta a la generación de **Certificados de Instalación Eléctrica (CIE)** conforme al:

- **REBT**: Reglamento Electrotécnico para Baja Tensión.
- **ITC-BT** relevantes para el alcance actual del producto:
  - **ITC-BT-04**: Documentación y puesta en servicio de las instalaciones.
  - **ITC-BT-07**: Prescripciones generales para las canalizaciones.
  - **ITC-BT-08**: Sistemas de puesta a tierra.
  - **ITC-BT-15**: Derivaciones individuales.
  - **ITC-BT-19**: Instalaciones interiores en viviendas.
  - **ITC-BT-25**: Instalaciones interiores en viviendas (circuitos mínimos).
  - **ITC-BT-26**: Locales de pública concurrencia (referencia para ciertos casos).
  - **ITC-BT-47**: Instalaciones en locales con características especiales (industriales, etc.), como referencia para límites de caída de tensión más amplios.

> Nota: CertIA no pretende sustituir la responsabilidad técnica del instalador o del ingeniero; proporciona **asistencia técnica** y un marco consistente de cálculo y documentación.

---

## 2. El Certificado de Instalación Eléctrica (CIE)

### 2.1 Finalidad del CIE

El **CIE** es el documento que acredita que una instalación de baja tensión:
- Ha sido ejecutada conforme al proyecto o memoria técnica.
- Cumple las prescripciones del REBT y sus ITC.
- Ha sido verificada mediante las pruebas reglamentarias.
- Está firmada por un **instalador autorizado** (y, cuando procede, visada o supervisada por técnico competente).

### 2.2 Información mínima que debe contener el CIE

De forma resumida, el CIE debe incluir:

- **Datos del titular y de la instalación**:
  - Titular de la instalación.
  - Dirección completa y uso previsto del local/vivienda/instalación.
  - Tensión de suministro, potencia contratada y prevista.

- **Datos de la empresa instaladora e instalador autorizado**:
  - Nombre o razón social de la empresa instaladora.
  - NIF/CIF.
  - Número de autorización administrativa de la empresa instaladora.
  - Nombre completo del instalador autorizado.
  - Número de carnet de instalador y categoría.

- **Características técnicas de la instalación**:
  - Esquema de conexión a red (mono/trifásica, TT/TN/IT).
  - Derivación individual: sección de conductores, longitud, sistema de instalación, protección general.
  - Cuadros de distribución: protecciones generales y diferenciales.
  - Circuitos interiores: sección de conductores, calibre de protecciones, tipo de uso.

- **Sistema de puesta a tierra**:
  - Tipo de esquema (TT, TN-S, TN-C, TN-C-S, IT).
  - Resistencias de puesta a tierra medidas.
  - Descripción básica de la toma de tierra (electrodos, conductor de protección, etc.) cuando aplique.

- **Resultados de verificaciones y ensayos**:
  - Continuidad de conductores de protección.
  - Resistencia de aislamiento.
  - Ensayo de disparo de interruptores diferenciales.
  - Medida de resistencia de puesta a tierra.
  - Cualquier otra medida relevante según el tipo de instalación.

- **Firmas y fechas**:
  - Firma del instalador autorizado.
  - Fecha de finalización de la instalación.
  - Referencia de expediente o número de certificado.

CertIA estructura el wizard y el modelo de datos para capturar toda esta información de forma guiada.

---

## 3. Conceptos de dominio clave

### 3.1 Derivación individual

La **derivación individual** es la parte de la instalación que une la caja general de protección o el punto de entrega de la compañía con el cuadro general de mando y protección de la vivienda o local.

En CertIA se recogen, entre otros:
- Tipo de red (monofásica / trifásica).
- Tensión nominal.
- Potencia prevista.
- Tipo de instalación (entubado, empotrado, sobre bandeja, etc.).
- Sección de conductores y longitud de la derivación.
- Protección general (IGA) y dispositivos diferenciales asociados.

La derivación es crítica para:
- Dimensionar la sección de conductores.
- Verificar la caída de tensión permitida (**1% máximo** según ITC-BT-15).
- Seleccionar la protección general adecuada.

### 3.2 Circuitos interiores (ITC-BT-19 e ITC-BT-25)

En viviendas, la ITC-BT-25 define una serie de **circuitos mínimos** obligatorios (C1–C5) con secciones y protecciones mínimas.  
CertIA modela los circuitos interiores permitiendo:
- Definir tipo de circuito (iluminación, tomas de corriente, cocina, baño, fuerza, etc.).
- Asignar sección de conductores, calibre de magnetotérmico y longitud aproximada.
- Relacionar cada circuito con su entorno (vivienda, local, zona específica).

Esto permite:
- Verificar el cumplimiento de **secciones mínimas** y **protecciones mínimas**.
- Calcular la caída de tensión circuito a circuito (3% típico en interiores de vivienda según ITC-BT-19, y 5% para ciertos usos industriales según ITC-BT-47).

### 3.3 Sistema de puesta a tierra (ITC-BT-08)

El sistema de puesta a tierra condiciona:
- Los valores de resistencia de tierra admisibles.
- Los dispositivos de protección (particularmente los diferenciales).
- El esquema general de la instalación (TT, TN, IT).

CertIA contempla:
- Selección del esquema de puesta a tierra.
- Registro del valor de resistencia medido.
- Posibilidad de documentar el tipo de toma de tierra.

### 3.4 Protecciones: IGA, PIA, RCD

- **IGA (Interruptor General Automático)**:
  - Dimensionado en función de la derivación individual y la potencia total prevista.
- **PIA (Pequeños Interruptores Automáticos)**:
  - Asociados a circuitos individuales.
  - Se comprueba la coherencia entre calibre y sección de conductores.
- **RCD (Interruptores Diferenciales)**:
  - Protegen contra contactos indirectos y fugas a tierra.
  - Se comprueba sensibilidad y selectividad mínima por zonas cuando aplica.

El modelo de datos de CertIA asocia cada circuito y cuadro a sus dispositivos de protección correspondientes.

---

## 4. Datos de entrada en CertIA y relación con la normativa

Esta sección conecta **campos del sistema** con su **relevancia normativa** (vista de alto nivel).

### 4.1 Datos generales de la instalación

- Tipo de suministro, tensión, potencia prevista → relacionados con:
  - Criterios de dimensionamiento de derivación y protecciones generales (ITC-BT-15).

- Uso de la instalación (vivienda, local comercial, industrial, pública concurrencia) → relacionados con:
  - Exigencias particulares de cada ITC-BT (19, 25, 26, 47, etc.).

### 4.2 Derivación individual

- Longitud, sección propuesta, tipo de instalación, intensidad prevista:
  - Entradas para el cálculo de caída de tensión (ITC-BT-15).
  - Selección de conductores y verificación de intensidad admisible (ITC-BT-07).

- Dispositivos de protección en origen:
  - Verificación de que el calibre protege a la derivación y no se exceden los límites admisibles.

### 4.3 Circuitos interiores

- Sección de conductores, tipo de aislamiento, método de instalación, longitud:
  - Entradas al cálculo de intensidad admisible y caída de tensión (ITC-BT-19, ITC-BT-07).

- Tipo de circuito (C1–C5 en vivienda, otros en locales específicos):
  - Verificación de secciones mínimas y número mínimo de circuitos (ITC-BT-25).

### 4.4 Puesta a tierra y protecciones diferenciales

- Esquema TT/TN/IT, resistencia de tierra, sensibilidad de diferenciales:
  - Comprobación cualitativa de que la combinación **tierra + diferenciales** es coherente con el esquema adoptado (ITC-BT-08).

---

## 5. Supuestos y límites de CertIA (versión actual)

Para contextualizar los resultados:

- **Ámbito principal**:
  - Viviendas y pequeños locales con esquemas TT/TN habituales.
  - Derivaciones individuales y circuitos interiores típicos.

- **No pretende cubrir todavía**:
  - Instalaciones complejas industriales con estudios detallados de cortocircuito.
  - Coordinación selectiva avanzada de protecciones (se dejará documentada pero fuera de alcance del MVP).
  - Casos especiales (atmosferas explosivas, quirófanos, etc.) regulados por ITC-BT específicas.

Estos límites se reflejarán también en el documento de **limitaciones y riesgos** y en los textos informativos que acompañen al CIE generado.

---

## 6. Glosario básico de términos

- **CIE**: Certificado de Instalación Eléctrica.
- **Derivación individual**: tramo que conecta el punto de entrega con el cuadro general de mando y protección.
- **Circuitos interiores**: circuitos aguas abajo del cuadro general que alimentan iluminación, tomas y receptores.
- **IGA**: Interruptor General Automático.
- **PIA**: Pequeño Interruptor Automático.
- **RCD / ID**: Interruptor diferencial.
- **TT / TN / IT**: esquemas de conexión a tierra de la instalación según la relación entre neutro, partes activas y masas.
- **Resistencia de puesta a tierra**: resistencia eléctrica entre la toma de tierra y la masa general de tierra.

