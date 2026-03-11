# CertIA — Plan de Lanzamiento MVP

**Fecha:** Marzo 2026
**Estado actual:** ~85% completado · Funcional en modo demo
**Objetivo:** Producción con usuarios reales

---

## Resumen ejecutivo

El core de la aplicación está completo: wizard de 6 pasos, cálculos REBT, generación de CERTINS por CCAA, gestión de clientes, suscripciones con Stripe y firma electrónica con AutoFirma. El sistema corre actualmente en **modo demo** (usuario hardcodeado, base de datos en memoria), lo que impide el lanzamiento real.

Los bloqueantes críticos son de **configuración e integración**, no de desarrollo de funcionalidades nuevas.

---

## BLOQUEANTE CRÍTICO 1 — Autenticación real

**Problema:** Toda la aplicación usa un único usuario hardcodeado (`id: 1, demo@certia.io`). No existe multi-usuario real.

**Ubicación:**
- `client/src/_core/hooks/useAuth.ts` — devuelve `DEMO_USER` siempre
- `server/_core/context.ts` — inyecta `DEMO_USER` en el contexto tRPC

**Lo que hay que hacer:**
1. Activar el flujo OAuth con Manus (la estructura ya existe en el código, solo falta el proveedor configurado)
2. Configurar las variables de entorno:
   ```env
   MANUS_CLIENT_ID=
   MANUS_CLIENT_SECRET=
   MANUS_REDIRECT_URI=https://tudominio.com/auth/callback
   ```
3. Quitar el bypass de `DEMO_USER` en ambos archivos una vez que OAuth esté activo

**Impacto si no se hace:** La aplicación funciona para una sola persona. No es un SaaS.

---

## BLOQUEANTE CRÍTICO 2 — Base de datos real

**Problema:** Sin `DATABASE_URL`, el servidor usa un mock store en memoria. Los datos no persisten entre reinicios.

**Ubicación:** `server/_core/mockStore.ts` — activado automáticamente cuando no hay `DATABASE_URL`

**Lo que hay que hacer:**
1. Crear una base de datos MySQL o TiDB Cloud
2. Configurar:
   ```env
   DATABASE_URL=mysql://user:password@host:4000/certia
   ```
3. Ejecutar migraciones: `pnpm db:push`

**Impacto si no se hace:** Todo dato creado se pierde al reiniciar el servidor.

---

## BLOQUEANTE CRÍTICO 3 — Stripe: webhooks y Price IDs

**Problema:** El flujo de pago está implementado pero incompleto en dos puntos:

**3a. Price IDs vacíos** en `client/src/pages/pricing.tsx` (líneas 30 y 48):
```typescript
priceId: "",  // ← Plan Pro
priceId: "",  // ← Plan Enterprise
```
Sin esto, el botón de suscripción no puede iniciar el checkout.

**3b. Sin webhook handler:** Stripe necesita confirmar los pagos vía webhook. Sin él, la suscripción nunca se activa en la BD aunque el usuario pague.

**Lo que hay que hacer:**
1. Crear los productos y precios en el dashboard de Stripe
2. Pegar los `price_xxx` IDs en `pricing.tsx`
3. Añadir un endpoint `POST /stripe/webhook` en `server/_core/index.ts` que procese los eventos:
   - `checkout.session.completed` → activar suscripción
   - `customer.subscription.deleted` → downgrade a free
   - `invoice.payment_failed` → notificar
4. Configurar:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

**Impacto si no se hace:** Los usuarios no pueden suscribirse. El modelo de negocio no funciona.

---

## BLOQUEANTE MEDIO 1 — TypeScript desactivado en módulos de suscripción

**Problema:** Dos archivos críticos tienen `// @ts-nocheck` al inicio, lo que oculta errores de tipos silenciosamente:
- `server/services/subscription-service.ts`
- `server/db-subscriptions.ts`

**Lo que hay que hacer:** Eliminar `@ts-nocheck`, corregir los errores de tipos que aparezcan (probablemente relacionados con la API de Stripe) y verificar con `pnpm check`.

**Impacto si no se hace:** Bugs en el flujo de pagos que no detecta el compilador.

---

## BLOQUEANTE MEDIO 2 — PDF real vs HTML

**Problema:** La generación de certificados produce HTML, no PDF. El usuario puede imprimir desde el navegador (`window.print()`), pero no descarga un archivo `.pdf` con firma digital incrustada.

**Puppeteer** está instalado en `package.json` pero no se usa en ningún archivo del servidor.

**Lo que hay que hacer:**
1. Implementar un endpoint `pdf.generatePdf` que use Puppeteer:
   ```typescript
   const browser = await puppeteer.launch();
   const page = await browser.newPage();
   await page.setContent(html);
   const pdf = await page.pdf({ format: 'A4', printBackground: true });
   ```
2. Reemplazar la descarga HTML por este PDF en `pdf.generateFromCertificateId`

**Nota:** Para validez legal en tramitación ante CCAA, el PDF debe ser firmado con AutoFirma (ya implementado). El formato HTML no es aceptable para presentación oficial.

**Impacto si no se hace:** Los CIE generados no son presentables ante las Consejerías sin imprimirlos manualmente.

---

## MEJORA RELEVANTE 1 — IA real con OpenAI

**Estado actual:** Las sugerencias de circuitos (`ai.suggestCircuits`) y la revisión del certificado (`ai.reviewCertificate`) son **completamente determinísticas** — no llaman a ninguna API de IA. El resultado se calcula con lógica fija según el tipo de instalación.

**¿Es necesario para el MVP?** Depende del posicionamiento. Si el valor diferencial que vendes es la IA, sí. Si vendes la automatización burocrática, no es crítico para el primer lanzamiento.

`@ai-sdk/openai` ya está instalado. `OPENAI_API_KEY` está documentado en `.env.example`. Solo falta implementar la llamada real en `server/routers.ts`.

---

## MEJORA RELEVANTE 2 — Rate limiting

**Estado actual:** No hay ningún límite de peticiones por usuario ni por IP en los endpoints tRPC.

**Riesgo:** Un usuario malintencionado o un bug de frontend puede generar miles de peticiones y consumir el crédito de OpenAI o sobrecargar la BD.

**Solución mínima:** Añadir `express-rate-limit` al servidor Express en `server/_core/index.ts`:
```typescript
import rateLimit from 'express-rate-limit';
app.use('/trpc', rateLimit({ windowMs: 60_000, max: 100 }));
```

---

## MEJORA RELEVANTE 3 — Tests

**Estado actual:** Vitest está instalado pero no hay ni un solo test en el proyecto.

**Prioritario:** Tests unitarios para `server/services/electrical-calculations.ts`, ya que es el núcleo de negocio (cálculos REBT erróneos tienen implicaciones legales).

**Mínimo aceptable para MVP:**
- Tests de secciones de cable (ITC-BT-19)
- Tests de caída de tensión
- Tests de calibre de IGA

---

## NO NECESARIO PARA MVP

Los siguientes puntos de `CLAUDE.md` pueden esperar a fases posteriores:

| Punto | Motivo |
|-------|--------|
| Tests E2E con Playwright | Los manuales son suficientes para el MVP |
| Caché servidor (Redis) | El volumen inicial no lo requiere |
| CDN | La app es ligera, sin assets pesados |
| Monitoreo / alertas | Puede empezar con logs básicos |
| Integración directa CCAA | La tramitación manual es aceptable en el MVP |
| Firma trifásica (PAdEStri) | La monofásica funciona para CIE |

---

## Tabla resumen de prioridades

| # | Tarea | Tipo | Esfuerzo estimado | Impacto |
|---|-------|------|-------------------|---------|
| 1 | Autenticación OAuth real | Configuración + código | 1–2 días | 🔴 Crítico |
| 2 | Base de datos MySQL/TiDB | Infraestructura | 0.5 días | 🔴 Crítico |
| 3a | Stripe Price IDs | Configuración | 1 hora | 🔴 Crítico |
| 3b | Stripe webhook handler | Código | 1 día | 🔴 Crítico |
| 4 | Eliminar `@ts-nocheck` | Código | 2–4 horas | 🟠 Alto |
| 5 | PDF real con Puppeteer | Código | 1–2 días | 🟠 Alto |
| 6 | Variables de entorno en producción | Configuración | 2 horas | 🔴 Crítico |
| 7 | Rate limiting | Código | 2 horas | 🟡 Medio |
| 8 | Tests cálculos REBT | Código | 1 día | 🟡 Medio |
| 9 | IA real con OpenAI | Código | 1–2 días | 🟡 Medio |
| 10 | Despliegue (SSL, dominio, CI/CD) | Infraestructura | 1–2 días | 🔴 Crítico |

**Total estimado hasta producción:** 8–14 días de trabajo efectivo.

---

## Secuencia de lanzamiento recomendada

```
Semana 1
├── Día 1: Base de datos TiDB + variables de entorno
├── Día 2-3: OAuth Manus — eliminar demo user
├── Día 4: Stripe Price IDs + webhook handler
└── Día 5: Eliminar @ts-nocheck + fix tipos

Semana 2
├── Día 6-7: PDF real con Puppeteer
├── Día 8: Rate limiting + hardening básico
├── Día 9: Tests unitarios cálculos REBT
└── Día 10: Despliegue a producción (dominio, SSL, PM2/Docker)

Post-lanzamiento (Fase 2)
├── Integración OpenAI real
├── Tramitación automática CCAA (cuando haya APIs)
└── Firma trifásica (cuando haya servidor Java)
```

---

*Documento generado: marzo 2026. Actualizar según avance.*
