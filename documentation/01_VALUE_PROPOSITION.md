# CertIA — Propuesta de Valor

## El problema

Un instalador eléctrico autorizado dedica entre **2 y 3 horas por certificado** (CIE). El proceso actual es:

1. Rellena una plantilla Word descargada de internet o del colegio profesional
2. Hace los cálculos a mano con Excel o calculadora (secciones, caídas de tensión, protecciones)
3. Comprueba manualmente que cumple el REBT consultando las ITC-BT en PDF
4. Genera el esquema unifilar en CAD o a mano
5. Imprime, firma y entrega físicamente a la Consejería de Industria

Un instalador que emite 3-4 certificados por semana dedica **8-12 horas semanales** a papeleo. Sin cobrar por ello.

---

## La solución

**CertIA** es un SaaS web que guía al instalador a través de un wizard de 6 pasos y genera automáticamente el CIE completo:

| Paso | Qué hace el instalador | Qué hace CertIA |
|------|----------------------|-----------------|
| 1. Cliente | Introduce nombre y dirección | Guarda y reutiliza en futuros certificados |
| 2. Instalación | Introduce potencia y tipo de local | Calcula automáticamente el IGA recomendado |
| 3. Derivación | Introduce longitud y material | Calcula sección mínima (doble criterio REBT) |
| 4. Circuitos | Revisa/ajusta circuitos sugeridos | Propone circuitos obligatorios por ITC-BT, calcula sección y PIA de cada uno |
| 5. Mediciones | Introduce los valores medidos en obra | Valida contra límites normativos en tiempo real |
| 6. Revisión | Revisa y descarga | Genera CIE + esquema unifilar + PDF descargable |

**Resultado: de 2-3 horas a 20-30 minutos por certificado.**

---

## Mercado objetivo

### Usuario primario: instalador eléctrico autorizado
- **Perfil**: autónomo o empresa pequeña (1-5 técnicos), categoría IBIII o superior
- **Volumen**: ~80.000 instaladores autorizados en España (RITSIC)
- **Pain principal**: tiempo de documentación, no el trabajo técnico en sí
- **Disposición a pagar**: alta si el ahorro de tiempo es tangible

### Usuario secundario: empresa instaladora mediana
- 5-20 técnicos, varios certificados diarios
- Necesita gestión centralizada del histórico de clientes e instalaciones
- Plan Enterprise con multi-usuario

---

## Propuesta de valor por tipo de usuario

### Para el instalador autónomo
> "Hago el certificado mientras recojo las herramientas, no cuando llego a casa."

- **Velocidad**: wizard guiado, cálculos automáticos, sin tablas ni fórmulas
- **Seguridad normativa**: la app aplica el REBT vigente, el instalador solo introduce datos reales
- **Historial**: todos los certificados en un sitio, buscables, descargables cuando los pide la Consejería
- **Precio**: menos de lo que cobra por una hora de trabajo

### Para la empresa instaladora
> "Mis técnicos emiten más certificados con menos errores y sin formación extra."

- **Estandarización**: todos los certificados siguen el mismo proceso y formato
- **Supervisión**: el responsable técnico puede revisar cualquier certificado antes de emitirlo
- **Escalabilidad**: misma herramienta para 2 o 20 técnicos

---

## Ventaja competitiva

| | CertIA | Word/PDF manual | Software escritorio (años 2000) | Excel propio |
|---|---|---|---|---|
| Cálculos automáticos REBT | ✅ | ❌ | Parcial | Parcial |
| Esquema unifilar automático | ✅ | ❌ | Parcial | ❌ |
| Acceso web (sin instalación) | ✅ | ✅ | ❌ | ✅ |
| Gestión de clientes integrada | ✅ | ❌ | ❌ | ❌ |
| Actualización normativa | ✅ | ❌ | ❌ | ❌ |
| Multi-usuario | ✅ (Pro/Enterprise) | ❌ | ❌ | ❌ |

No existe hoy ninguna herramienta web española que cubra el proceso completo con cálculos validados contra el REBT vigente.

---

## Modelo de negocio

| Plan | Certificados/mes | Precio | Target |
|------|-----------------|--------|--------|
| Free | 5 | 0 € | Prueba / instaladores esporádicos |
| Pro | 500 | Por definir | Instaladores activos |
| Enterprise | Ilimitado + multi-usuario | Custom | Empresas instaladoras |

Métrica clave: **coste por certificado** para el instalador. Si Pro son 30 €/mes y emite 30 certificados, el coste es 1 €/certificado frente a ~50-100 € de valor del tiempo ahorrado.
