# CertIA — Dominio: REBT y Certificados de Instalación Eléctrica

> Referencia del dominio eléctrico para el equipo de desarrollo. Explica el contexto normativo en el que opera CertIA sin necesidad de conocimientos previos de electricidad.

---

## Qué es el REBT

El **Reglamento Electrotécnico para Baja Tensión** (Real Decreto 842/2002) es la normativa española que regula las instalaciones eléctricas de baja tensión (hasta 1.000 V en alterna). Define los requisitos técnicos de seguridad que debe cumplir cualquier instalación: viviendas, locales comerciales, naves industriales, garajes, hospitales, etc.

El REBT se desarrolla mediante **Instrucciones Técnicas Complementarias (ITC-BT)**, cada una para un tipo de instalación o aspecto específico:

| ITC-BT | Contenido relevante para CertIA |
|--------|--------------------------------|
| ITC-BT-03 | Instaladores autorizados y certificación |
| ITC-BT-07 | Cables. Intensidades admisibles |
| ITC-BT-08 | Sistemas de conexión del neutro y masas |
| ITC-BT-10 | Previsión de cargas en edificios |
| ITC-BT-15 | Derivaciones individuales |
| ITC-BT-17 | Dispositivos generales e individuales de mando y protección |
| ITC-BT-18 | Instalaciones de puesta a tierra |
| ITC-BT-19 | Instalaciones interiores. Prescripciones generales |
| ITC-BT-21 | Tubos protectores |
| ITC-BT-22 | Protección contra sobreintensidades |
| ITC-BT-24 | Protección contra contactos directos e indirectos |
| ITC-BT-25 | Instalaciones interiores en viviendas |
| ITC-BT-28 | Instalaciones en locales de pública concurrencia |
| ITC-BT-47 | Instalaciones de receptores. Motores |

---

## Qué es el CIE

El **Certificado de Instalación Eléctrica (CIE)** es el documento legal que acredita que una instalación eléctrica cumple el REBT. Es obligatorio para:

- Dar de alta el suministro eléctrico (sin CIE no hay luz)
- Cualquier reforma o ampliación de una instalación existente
- Instalaciones nuevas en obra

### Quién lo firma
El CIE debe ser firmado por un **instalador eléctrico autorizado** — persona física con carnet RITSIC (Registro de Instaladores de Telecomunicaciones, Industria y otros Servicios) en la categoría correspondiente. El instalador asume responsabilidad civil durante 10 años.

### Ante quién se presenta
Se presenta ante la **Consejería de Industria** de la Comunidad Autónoma correspondiente. Cada CCAA tiene su propio sistema (Murcia: sede.carm.es, Valencia: CAVALREP, Andalucía: GIISELA...).

---

## El flujo real de un CIE

```
1. Visita a la instalación
   └── El instalador inspecciona físicamente la instalación
       y toma las mediciones obligatorias

2. Documentación (aquí opera CertIA)
   ├── Datos del titular (cliente)
   ├── Datos de la instalación (dirección, tipo, potencia)
   ├── Derivación Individual (cable de la CGP al cuadro)
   ├── Circuitos interiores (tabla con sección, PIA, RCD por circuito)
   ├── Mediciones (resistencia de tierra, aislamiento, diferencial)
   └── Esquema unifilar

3. Firma
   └── El instalador firma con su certificado digital (DNIe/FNMT)

4. Presentación
   └── Se sube al portal de la CCAA → número de expediente → CIE visado
```

---

## Conceptos eléctricos clave en CertIA

### Derivación Individual (DI)
Cable que va desde la Caja General de Protección (CGP, el punto de entrada del suministro) hasta el Cuadro General de Mando y Protección (el "cuadro de luz") del abonado. Es el tramo más crítico: su sección determina la potencia máxima contratada posible.

- Caída de tensión máxima: **1%** (ITC-BT-15)

### IGA — Interruptor General Automático
El interruptor principal del cuadro. Su calibre (amperios) determina la potencia máxima:
- I = P / (V × cos φ)
- Monofásico 230V, cos φ = 1: I = P(W) / 230

### PIA — Pequeño Interruptor Automático
Protección de cada circuito individual. Debe cumplir: **Ib ≤ In ≤ Iz**
- Ib: intensidad de diseño del circuito
- In: calibre del PIA
- Iz: intensidad máxima admisible del cable

### RCD — Residual Current Device (Diferencial)
Protege contra contactos indirectos (corriente de fuga a tierra). Sensibilidad habitual: 30 mA (viviendas) o 300 mA (industrial). La resistencia de tierra máxima admisible es: **Rt ≤ 50V / Idn**

### Sección del cable
Calculada por doble criterio:
1. **Intensidad admisible**: el cable debe soportar la corriente sin calentarse en exceso. Depende del material (Cu/Al), aislamiento (PVC/XLPE), método de instalación y temperatura ambiente.
2. **Caída de tensión**: la pérdida de tensión a lo largo del cable no puede superar el límite normativo.

Se elige la sección que satisface ambos criterios simultáneamente.

### Circuitos mínimos en vivienda (ITC-BT-25)

| Circuito | Uso | Sección mín. | PIA |
|----------|-----|-------------|-----|
| C1 | Alumbrado | 1,5 mm² | 10 A |
| C2 | Tomas uso general | 2,5 mm² | 16 A |
| C3 | Cocina y horno | 6 mm² | 25 A |
| C4 | Lavadora / lavavajillas / termo | 4 mm² | 20 A |
| C5 | Tomas baños y cocina | 2,5 mm² | 16 A |

Grado de electrificación:
- **Básico**: 5.750 W (circuitos C1–C5)
- **Elevado**: 9.200 W (C1–C5 + circuitos adicionales C6–C12 según equipamiento)

---

## Términos del dominio en el código

| Término del dominio | Variable/tabla en código |
|---------------------|--------------------------|
| CIE | `certificates` |
| Instalación | `installations` |
| Titular / Cliente | `clients` |
| Derivación Individual | `derivationSection`, `derivationLength` en `certificates` |
| IGA | `mainSwitchCurrent` |
| Circuito | `circuits` |
| PIA | `breakerCurrent` |
| RCD / Diferencial | `rcdSensitivity` |
| Medición de tierra | `earthResistance` en `measurements` |
| Esquema unifilar | SVG generado por `generateUnifilarSVG()` |
| CCAA | `autonomousCommunity` en `profiles` |
