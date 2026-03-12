# CertIA — Especificación del Motor de Cálculos Eléctricos

> Este documento describe, a nivel funcional y técnico, cómo calcula CertIA las principales magnitudes de diseño usadas en el CIE: secciones de conductores, intensidades admisibles, caídas de tensión y selección básica de protecciones.

---

## 1. Alcance del motor de cálculo (versión actual)

El motor de cálculos de CertIA (implementado en `server/services/electrical-calculations.ts`) cubre principalmente:

1. **Cálculo de sección de conductores** para:
   - Derivación individual.
   - Circuitos interiores típicos de vivienda/local.
2. **Cálculo de caída de tensión** a lo largo de un tramo.
3. **Verificación de intensidad admisible** con aplicación de factores de corrección (temperatura, agrupamiento, método de instalación).
4. **Selección básica de protecciones**:
   - Comprobación de coherencia entre calibre del interruptor y sección del conductor.

No cubre aún:
- Estudios detallados de cortocircuito y coordinación selectiva avanzada.
- Casos especiales (zonas con riesgo de incendio/explosión, quirófanos, etc.).

---

## 2. Modelo general de entrada/salida

### 2.1 Entradas globales por tramo/circuito

Cada cálculo de sección/caída de tensión trabaja con un conjunto de parámetros de entrada:

- **Datos eléctricos**:
  - Tensión nominal \( U_n \) (V).
  - Potencia prevista \( P \) (kW) o intensidad de diseño \( I_b \) (A).
  - Factor de potencia \( \cos\varphi \) cuando aplica.
  - Tipo de red (monofásica / trifásica).

- **Datos del conductor**:
  - Material: cobre / aluminio.
  - Tipo de aislamiento: PVC / XLPE / EPR.
  - Sección propuesta \( S \) (mm²) — puede ser calculada o forzada.
  - Longitud del tramo \( L \) (m).

- **Condiciones de instalación**:
  - Método de instalación (empotrado, en tubo superficial, bandeja, etc.).
  - Temperatura ambiente de referencia.
  - Número de circuitos agrupados.

### 2.2 Resultados principales

El motor devuelve, para cada tramo:

- Sección recomendada del conductor \( S_{recom} \) (mm²).
- Caída de tensión estimada \( \Delta U \) (V y %).
- Intensidad máxima admisible corregida \( I_z \) (A).
- Indicadores de cumplimiento:
  - Si se cumple la caída de tensión máxima permitida.
  - Si la sección soporta la intensidad requerida con factores de corrección.
  - Si la combinación sección + protección propuesta es coherente.

---

## 3. Cálculo de sección de conductores

### 3.1 Criterios aplicados

La sección de un conductor se determina atendiendo a:

1. **Intensidad admisible** según tablas de la ITC-BT-07 y factores de corrección:
   - Base: intensidad admisible \( I_{z,tabla} \) para el método de instalación y sección nominal.
   - Correcciones: temperatura, agrupamiento, tipo de instalación.
   - Resultado: \( I_z = I_{z,tabla} \cdot k_t \cdot k_g \cdot k_i \).
   - Condición: \( I_b \le I_z \) y \( I_n \le I_z \) (donde \( I_n \) es el calibre del interruptor).

2. **Caída de tensión máxima admitida**:
   - 1% para derivación individual (ITC-BT-15).
   - 3% para circuitos interiores de vivienda (ITC-BT-19).
   - 5% para ciertos usos industriales (ITC-BT-47) — referencia para futuros casos.

El motor propone la **mínima sección normalizada** que cumple simultáneamente ambos criterios.

### 3.2 Resistividad del conductor a temperatura de servicio

Se consideran valores de resistividad \( \rho \) ajustados a la **temperatura máxima de servicio** del aislamiento:

- PVC, 70 °C:
  - Cobre: \( \rho_{Cu,70} \approx 0{,}02365\ \Omega \cdot \mathrm{mm}^2/\mathrm{m} \).
  - Aluminio: \( \rho_{Al,70} \approx 0{,}03817\ \Omega \cdot \mathrm{mm}^2/\mathrm{m} \).

- XLPE/EPR, 90 °C:
  - Cobre: \( \rho_{Cu,90} \approx 0{,}02634\ \Omega \cdot \mathrm{mm}^2/\mathrm{m} \).
  - Aluminio: \( \rho_{Al,90} \approx 0{,}04150\ \Omega \cdot \mathrm{mm}^2/\mathrm{m} \).

Estos valores se utilizan en el cálculo de caída de tensión en lugar de los valores a 20 °C.

---

## 4. Cálculo de caída de tensión

### 4.1 Fórmulas utilizadas

Para una aproximación lineal, se emplean fórmulas estándar:

- **Monofásico**:
\[
\Delta U = 2 \cdot I_b \cdot \rho \cdot \frac{L}{S}
\]

- **Trifásico**:
\[
\Delta U = \sqrt{3} \cdot I_b \cdot \rho \cdot \frac{L}{S}
\]

Donde:
- \( \Delta U \): caída de tensión en voltios.
- \( I_b \): intensidad de diseño (A).
- \( \rho \): resistividad del conductor a la temperatura de servicio \((\Omega \cdot \mathrm{mm}^2/\mathrm{m})\).
- \( L \): longitud del tramo (m).
- \( S \): sección del conductor (mm²).

La caída de tensión en porcentaje se calcula como:
\[
\Delta U\% = \frac{\Delta U}{U_n} \cdot 100
\]

### 4.2 Límites aplicados

El motor compara \( \Delta U\% \) con el límite normativo según el tipo de tramo:

- Derivación individual: \( \Delta U\% \le 1\% \) (ITC-BT-15).
- Circuitos interiores de vivienda: \( \Delta U\% \le 3\% \) (ITC-BT-19).
- Otros casos (referencia futura): hasta 5% según ITC-BT-47.

Si no se cumple el límite:
- Se propone incrementar la sección al siguiente valor normalizado.

---

## 5. Intensidad admisible y factores de corrección

### 5.1 Datos base

Para cada combinación de:
- Método de instalación.
- Tipo de aislamiento.
- Número de conductores cargados.

se dispone de una **tabla base de intensidades admisibles \( I_{z,tabla} \)** (equivalente a las tablas de ITC-BT-07 / ITC-BT-19).

### 5.2 Factores de corrección aplicados

El motor aplica, como mínimo, los siguientes factores:

- **Temperatura ambiente \( k_t \)**:
  - Ejemplo: 25 °C → 1,00; 40 °C → 0,87; 50 °C → 0,71 (valores típicos).

- **Agrupamiento \( k_g \)**:
  - 2 circuitos → 0,80; 3 circuitos → ~0,70; 4 circuitos → ~0,65 (según tablas).

- **Tipo de instalación \( k_i \)**:
  - Empotrado → ~0,77.
  - Sobre bandeja / aire libre → 1,00.

La intensidad admisible corregida se calcula como:
\[
I_z = I_{z,tabla} \cdot k_t \cdot k_g \cdot k_i
\]

Condición de cumplimiento:
\[
I_b \le I_z \quad \text{y} \quad I_n \le I_z
\]

En caso contrario, se propone incrementar la sección del conductor o reducir el calibre de la protección.

---

## 6. Selección de protecciones (coherencia básica)

El motor realiza, al menos, las siguientes comprobaciones:

- Para un tramo con sección \( S \) y condición \( I_z \):
  - El calibre del interruptor propuesto \( I_n \) debe satisfacer:
    - \( I_b \le I_n \le I_z \).
  - Si \( I_n > I_z \), se marca como **no conforme** y se sugiere:
    - O bien aumentar sección.
    - O bien reducir calibre del interruptor (si la carga lo permite).

- Para derivaciones individuales y cuadros:
  - Se comprueba que el **IGA** protege al conjunto de derivación + cuadro.

> En versiones posteriores se documentará la lógica de coordinación y selectividad entre protecciones en cascada; actualmente el alcance es principalmente de coherencia local tramo–protección.

---

## 7. Ejemplos de cálculo (caso de vivienda tipo)

> Nota: estos ejemplos son ilustrativos de la lógica que implementa el motor; los valores concretos pueden ajustarse en función de la tabla de intensidades adoptada.

### 7.1 Circuito de iluminación (C1) en vivienda

- Tensión: \( U_n = 230\ \mathrm{V} \).
- Intensidad de diseño: \( I_b = 10\ \mathrm{A} \).
- Longitud: \( L = 20\ \mathrm{m} \).
- Tipo de red: monofásica.
- Conductor: cobre, PVC, instalación empotrada.
- Temperatura de referencia: 30 °C.
- Agrupamiento: 2 circuitos en el mismo conducto.

**Paso 1 – Selección de sección inicial** (por ejemplo, 1,5 mm² según mínimo para iluminación).

**Paso 2 – Intensidad admisible**:
- \( I_{z,tabla}(1{,}5\ \mathrm{mm}^2) \) se toma de tabla.
- Se aplican factores \( k_t \), \( k_g \), \( k_i \) → se obtiene \( I_z \).
- Se verifica \( I_b \le I_z \).

**Paso 3 – Caída de tensión**:
- Se calcula \( \Delta U \) para 1,5 mm².
- Se obtiene \( \Delta U\% \) y se comprueba \( \Delta U\% \le 3\% \).

Si ambas condiciones se cumplen, el motor confirma 1,5 mm² como sección adecuada y valida un PIA de 10 A.

### 7.2 Derivación individual de vivienda

- Tensión: \( U_n = 230/400\ \mathrm{V} \) (según red).
- Potencia prevista: 9,2 kW.
- Tipo de red: monofásica.
- Longitud: \( L = 30\ \mathrm{m} \).
- Conductor: cobre, XLPE, instalación bajo tubo empotrado.
- Temperatura: 30–40 °C (se aplica \( k_t \)).

El motor:
1. Calcula la intensidad de diseño \( I_b \).
2. Recorre secciones normalizadas (10, 16, 25 mm², etc.).
3. Para cada sección, calcula \( I_z \) corregido y caída de tensión.
4. Elige la menor sección que cumple:
   - \( I_b \le I_z \).
   - \( \Delta U\% \le 1\% \) (límite para derivación individual).

---

## 8. Validaciones y manejo de errores

El motor incluye validaciones de entrada:

- Comprobación de que los parámetros obligatorios están presentes (longitud, sección, tensión, etc.).
- Rango de valores razonables (por ejemplo, longitudes > 0 m, secciones en una lista normalizada).
- Detección de combinaciones incoherentes (p.ej. potencia muy alta para una sección muy pequeña).

En caso de error:
- Devuelve mensajes estructurados que el frontend puede mostrar al usuario (por ejemplo: “La sección actual no cumple la caída de tensión máxima. Se recomienda aumentar a 6 mm².”).

---

## 9. Trazabilidad y futuras extensiones

Cada resultado de cálculo puede asociarse a:
- El conjunto de entradas utilizadas.
- La versión del motor de cálculo.

Esto permitirá:
- Regenerar el resultado en el futuro con las mismas entradas.
- Documentar cambios en el criterio de cálculo (p.ej. cambio de tablas o factores).

Futuras extensiones previstas:
- Documentar y añadir cálculos de **corriente de cortocircuito**.
- Criterios de **coordinación de protecciones** avanzados.
- Soporte específico para **instalaciones especiales** (ITC-BT adicionales).

