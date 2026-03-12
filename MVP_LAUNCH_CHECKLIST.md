# CertIA — MVP Launch Checklist

> Fecha de referencia: Marzo 2026
> Estado general: ~85% completado

---

## ESTADO ACTUAL

### ✅ Completado
- [x] Wizard 6 pasos funcional (Cliente → Instalación → Derivación → Circuitos → Mediciones → Revisión+PDF)
- [x] Motor de cálculos REBT (`electrical-calculations.ts`)
- [x] Generación de esquema unifilar Mermaid
- [x] Generación PDF/HTML de certificados
- [x] Gestión de clientes e instalaciones
- [x] Revisiones periódicas (ITC-BT-05)
- [x] Templates CCAA (murcia, madrid, cataluna, andalucia, valencia, paisvasco)
- [x] Portal cliente (`/portal/:token`)
- [x] Integración Stripe (suscripciones)
- [x] Tooltips unifilar click-toggle (Sprint 2)
- [x] Dropdown certificados en Revisiones (Sprint 3)
- [x] UI limpiada (Sprint 1): sin icono rayo, sin demo button, sin pricing page

### ⚠️ Pendiente para lanzamiento
- [x] **Sistema de autenticación real** (Sprint 4 — completado)
- [ ] Variables de entorno de producción configuradas
- [ ] SSL/HTTPS en producción
- [ ] OpenAI API key real (actualmente sugerencias determinísticas)
- [ ] AWS S3 configurado para almacenamiento PDFs
- [x] Rate limiting en endpoints tRPC (auth: 10/15min, AI: 30/hora)
- [x] Tests unitarios mínimos (cálculos REBT) — 37 tests

---

## SPRINT 4 — AUTENTICACIÓN REAL (Guía completa)

### Contexto actual
El sistema usa un `DEMO_USER` hardcodeado en `client/src/_core/hooks/useAuth.ts` —
siempre autenticado, sin sesión real. El backend tiene infraestructura JWT completa
(`sdk.signSession`, `sdk.verifySession`, `jose`, `COOKIE_NAME`) pero ligada a Manus OAuth.

### Recomendación: Email/Password + JWT propio

**¿Por qué esta opción?**
- El 80% de la infraestructura JWT ya existe en `server/_core/sdk.ts`
- `signSession()` y `verifySession()` ya funcionan con HS256 + `jose`
- Sin dependencias externas de pago ni proveedores de terceros
- Máximo control sobre el flujo
- Coste: 0€

**Paquetes necesarios** (todos gratuitos, ya parcialmente instalados):
```bash
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
# jose ya está instalado ✓
# cookie ya está instalada ✓
```

---

### Paso a paso — implementación

#### 1. Añadir columna `passwordHash` al schema (`drizzle/schema.ts`)

```typescript
// En la tabla `users`, añadir:
passwordHash: varchar("passwordHash", { length: 255 }),
```

Luego ejecutar:
```bash
pnpm db:push
```

> El campo `openId` se mantiene pero ahora se genera como UUID propio
> (usar `crypto.randomUUID()` del propio Node.js — sin dependencias extra).

---

#### 2. Crear rutas Express de auth (`server/_core/localAuth.ts`, archivo nuevo)

```typescript
import bcrypt from "bcryptjs";
import type { Express } from "express";
import * as db from "../db";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

export function registerLocalAuthRoutes(app: Express) {
  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }
    const existing = await db.getUserByEmail(email); // ver paso 3
    if (existing) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const openId = crypto.randomUUID(); // ID único propio
    await db.upsertUser({ openId, name, email, loginMethod: "email", lastSignedIn: new Date() });
    await db.setUserPasswordHash(openId, passwordHash); // ver paso 3
    const token = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ ok: true });
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }
    const user = await db.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    const token = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ ok: true });
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ ok: true });
  });
}
```

---

#### 3. Añadir helpers de BD (`server/db.ts` o `server/db-users.ts`)

```typescript
// Buscar usuario por email
export async function getUserByEmail(email: string) {
  const [user] = await drizzle.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

// Guardar hash de contraseña
export async function setUserPasswordHash(openId: string, passwordHash: string) {
  await drizzle.update(users)
    .set({ passwordHash })
    .where(eq(users.openId, openId));
}
```

---

#### 4. Registrar las rutas en `server/index.ts`

```typescript
import { registerLocalAuthRoutes } from "./_core/localAuth";
// ...
registerLocalAuthRoutes(app);
// Quitar o mantener comentado: registerOAuthRoutes(app);
```

---

#### 5. Actualizar `server/_core/sdk.ts` → `authenticateRequest()`

Eliminar el bloque de sincronización con OAuth (líneas ~274-289):

```typescript
// ELIMINAR este bloque:
if (!user) {
  try {
    const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
    // ...
  } catch (error) { ... }
}
```

Simplificar a:
```typescript
async authenticateRequest(req: Request): Promise<User> {
  const cookies = this.parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await this.verifySession(sessionCookie);
  if (!session) throw ForbiddenError("Invalid session cookie");
  const user = await db.getUserByOpenId(session.openId);
  if (!user) throw ForbiddenError("User not found");
  return user;
}
```

---

#### 6. Actualizar `client/src/_core/hooks/useAuth.ts`

Reemplazar el DEMO_USER por una query real a `auth.me`:

```typescript
// El endpoint auth.me ya existe en routers.ts
export function useAuth(_options?: UseAuthOptions) {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });
  const logoutMutation = trpc.auth.logout.useMutation();

  return {
    user: user ?? null,
    loading: isLoading,
    error: error ?? null,
    isAuthenticated: !!user,
    refresh: () => {},
    logout: async () => { await logoutMutation.mutateAsync(); },
  };
}
```

---

#### 7. Actualizar `client/src/pages/Auth.tsx`

Reemplazar el botón de Manus por un formulario email/password con dos pestañas (Login / Registro). Usar `fetch` o `axios` hacia `/api/auth/login` y `/api/auth/register`.

---

#### 8. Variables de entorno necesarias

```env
# .env
JWT_SECRET=una-clave-secreta-larga-y-aleatoria-min-32-chars
DATABASE_URL=mysql://...
# Ya no se necesitan: VITE_OAUTH_PORTAL_URL, VITE_APP_ID, OAUTH_SERVER_URL
```

---

#### Resumen de archivos afectados

| Archivo | Acción |
|---------|--------|
| `drizzle/schema.ts` | Añadir `passwordHash` |
| `server/_core/localAuth.ts` | Crear (rutas register/login/logout) |
| `server/_core/sdk.ts` | Simplificar `authenticateRequest()` |
| `server/index.ts` | Registrar `registerLocalAuthRoutes` |
| `server/db.ts` | Añadir `getUserByEmail`, `setUserPasswordHash` |
| `client/src/_core/hooks/useAuth.ts` | Reemplazar DEMO_USER por query real |
| `client/src/pages/Auth.tsx` | Formulario email/password |
| `.env` | Limpiar vars Manus, añadir JWT_SECRET |

---

## SPRINT 5 — INFORME: Documentación por CCAA y Casos de Uso

### 5.1 Situación actual de la app

CertIA genera actualmente **CIE para instalaciones de Baja Tensión** bajo el marco del
**REBT (RD 842/2002)**. El tipo de instalación implícitamente soportado es:

- Instalaciones en **viviendas** (ITC-BT-25) — el caso mejor cubierto
- Instalaciones en **locales comerciales y oficinas** (ITC-BT-28) — parcialmente

---

### 5.2 Documentos requeridos por Comunidad Autónoma

Aunque el REBT es normativa estatal, **cada CCAA gestiona la legalización** a través de su
organismo industrial. Los documentos y formularios varían:

---

#### Cataluña
- **Organismo**: Agència per a la Competitivitat de l'Empresa (ACCIÓ) / Oficines de Gestió Empresarial
- **Formulario propio**: Sí — formulario normalizado de la Generalitat
- **Proceso**: Presentación telemática a través del canal empresa.gencat.cat
- **Peculiaridades**:
  - Requiere certificado digital de instalador autorizado
  - Distinción obligatoria entre instalación nueva y modificación
  - Exige memoria técnica de diseño para instalaciones >100A
- **Tipos de instalación con formulario específico**: vivienda, local, industrial, garaje colectivo

#### Madrid
- **Organismo**: Dirección General de Industria, Energía y Minas (DGIEM)
- **Formulario propio**: Sí — CIE normalizado de la Comunidad de Madrid
- **Proceso**: Tramitación online a través de la sede electrónica
- **Peculiaridades**:
  - Para instalaciones >100kW se requiere proyecto firmado por ingeniero
  - Potencia ≤10kW: solo CIE del instalador
  - Potencia 10-100kW: CIE + memoria técnica

#### Andalucía
- **Organismo**: Agencia de Industria y Comercio (AIC) / Ventanilla Única Empresarial
- **Formulario propio**: Sí — Impreso AI/14 o equivalente electrónico
- **Proceso**: Presentación en oficinas AIC o telemática
- **Peculiaridades**:
  - Requiere visado colegial para instalaciones industriales >50kW
  - Plazo de legalización: 30 días desde puesta en servicio

#### Comunitat Valenciana
- **Organismo**: IVACE (Institut Valencià de Competitivitat Empresarial)
- **Formulario propio**: Sí — a través del portal GUC (Gestor Único de Certificaciones)
- **Proceso**: 100% telemático con certificado digital
- **Peculiaridades**:
  - El GUC genera automáticamente el número de expediente
  - Integración con el Registro de Instalaciones (REEBLE)
  - Envío directo al distribuidor eléctrico para alta de suministro

#### País Vasco
- **Organismo**: Ente Vasco de la Energía (EVE) / Departamento de Desarrollo Económico
- **Formulario propio**: Sí — DIE (Declaración de Instalación Eléctrica)
- **Proceso**: Tramitación a través de Industria Vasca (www.industriavasca.eus)
- **Peculiaridades**:
  - DIE triplicada: copia para el instalador, el cliente y la administración
  - Para potencias >10kW: inspección previa por OCA obligatoria
  - Normativa adicional: Decreto 283/1999 del Gobierno Vasco

#### Murcia
- **Organismo**: Dirección General de Industria y Empresa
- **Formulario propio**: Formulario regional adaptado al REBT estatal
- **Proceso**: Sede electrónica CARM
- **Peculiaridades**:
  - Instalaciones en zonas de baño/piscinas: requieren inspección OCA antes de CIE
  - Para potencias >100A en locales: proyecto técnico obligatorio

#### Galicia
- **Organismo**: Instituto Galego de Consumo e da Competencia (IGCC)
- **Formulario propio**: Sí — modelos normalizados de la Xunta
- **Proceso**: Sede electrónica xunta.gal
- **Peculiaridades**:
  - Comunidad con más OCA homologadas proporcionalmente
  - Requiere inscripción previa del instalador en el registro de la CCAA

#### Resto de CCAA (resumen)
| CCAA | Organismo gestor | Formulario propio | Trámite online |
|------|-----------------|------------------|---------------|
| Aragón | Dpto. de Industria | Sí | Sí |
| Asturias | Dirección de Industria | Sí | Parcial |
| Cantabria | Dpto. de Industria | Estatal adaptado | Sí |
| Castilla y León | Consejería de Industria | Sí | Sí |
| Castilla-La Mancha | Junta de Comunidades | Sí | Parcial |
| Extremadura | Junta de Extremadura | Estatal | Parcial |
| Navarra | Dpto. de Desarrollo Económico | Sí | Sí |
| La Rioja | Consejería de Industria | Sí | Sí |
| Baleares | Govern de les Illes Balears | Sí | Sí |
| Canarias | Cabildo/Consejería Industria | Sí | Parcial |

---

### 5.3 Tipos de instalación que la app podría cubrir (roadmap ampliación)

#### Actualmente soportados ✅
| Tipo | ITC aplicable | Notas |
|------|--------------|-------|
| Viviendas unifamiliares y pisos | ITC-BT-25 | Caso principal, muy bien cubierto |
| Locales comerciales y oficinas | ITC-BT-28 | Parcialmente cubierto |

#### Próxima iteración (alta demanda, coste bajo) 🔜
| Tipo | ITC aplicable | Valor añadido |
|------|--------------|---------------|
| Garajes y aparcamientos | ITC-BT-29 | Muy frecuente en obra nueva |
| Instalaciones con grupo electrógeno | ITC-BT-43 | Diferenciador competitivo |
| Puntos de recarga VE | ITC-BT-52 | Mercado en auge, alta demanda |
| Instalaciones fotovoltaicas (BT) | ITC-BT-40 | Boom solar actual |

#### Medio plazo (mayor complejidad) 📅
| Tipo | ITC aplicable | Consideraciones |
|------|--------------|----------------|
| Piscinas y fuentes | ITC-BT-31 | Requiere zonas de peligro específicas |
| Instalaciones agrícolas | ITC-BT-12 y ITC-BT-13 | Mercado rural amplio |
| Establecimientos sanitarios | ITC-BT-38 | Alta normativa, mercado específico |
| Locales con riesgo de incendio/explosión | ITC-BT-29 (ATEX) | Complejo, requiere certificación |

---

### 5.4 Recomendaciones estratégicas (Sprint 5)

1. **Prioridad inmediata**: Añadir soporte para **puntos de recarga VE (ITC-BT-52)**
   — mercado en expansión exponencial, pocos SaaS especializados, alto ROI.

2. **Diferenciador**: Tramitación online adaptada por CCAA — si la app pre-rellena
   el formulario específico de cada comunidad, el instalador ahorra 1-2h adicionales.

3. **Validación de mercado antes de desarrollar**:
   - Contactar a 5-10 instaladores por CCAA antes de construir templates específicos
   - Priorizar las CCAA con más instaladores autorizados: Cataluña, Madrid, Andalucía

4. **Templates CCAA actuales** (ya implementados en el código):
   murcia, madrid, cataluna, andalucia, valencia, paisvasco — **validar que el contenido
   cumple realmente con los formularios oficiales actualizados de cada CCAA**.

---

## INFRAESTRUCTURA PRODUCCIÓN

### Pendiente antes del lanzamiento

- [ ] **Dominio + SSL**: Configurar dominio certia.io (o equivalente) + Let's Encrypt / Cloudflare
- [ ] **Base de datos**: TiDB Serverless free tier o PlanetScale free tier (MySQL compatible con Drizzle)
- [ ] **Hosting backend**: Railway, Render, o Fly.io — todos tienen free tier suficiente para MVP
- [ ] **Variables de entorno de producción**:
  ```
  DATABASE_URL=
  JWT_SECRET=
  OPENAI_API_KEY=
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  AWS_ACCESS_KEY_ID=
  AWS_SECRET_ACCESS_KEY=
  AWS_S3_BUCKET=
  ```
- [ ] **Stripe webhooks**: Configurar endpoint `/api/webhooks/stripe` en el dashboard de Stripe
- [ ] **Rate limiting**: Añadir `express-rate-limit` en endpoints de auth y AI (evitar abuso)
- [ ] **Logs y monitoreo**: Sentry free tier para errores en producción

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
Sprint 4 (Auth)  →  Variables de entorno  →  Deploy staging  →  Tests manuales  →  LAUNCH
```

El lanzamiento puede hacerse **sin** S3 (almacenando PDFs en base de datos como blob o
generándolos on-demand), **sin** OpenAI real (sugerencias determinísticas son funcionales),
pero **no puede hacerse sin auth real**.
