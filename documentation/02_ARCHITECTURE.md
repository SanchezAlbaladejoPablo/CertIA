# CertIA — Arquitectura Técnica

## Visión general

CertIA es una aplicación web full-stack de arquitectura monolítica desplegada en Railway. El frontend (SPA React) y el backend (Express + tRPC) se sirven desde el mismo proceso Node.js en producción.

```
┌─────────────────────────────────────────────────────┐
│                    Railway (Cloud)                   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              Node.js Process                  │   │
│  │                                              │   │
│  │   Express                                    │   │
│  │   ├── /api/auth/*     (email/password JWT)   │   │
│  │   ├── /api/trpc/*     (tRPC router)          │   │
│  │   ├── /api/pdf/:id    (generación HTML/PDF)  │   │
│  │   └── /api/portal/*   (acceso cliente final) │   │
│  │                                              │   │
│  │   Static files → dist/public/ (React SPA)   │   │
│  └──────────────────────────────────────────────┘   │
│                        │                            │
│                        │ mysql2                     │
│                        ▼                            │
│              TiDB Cloud (MySQL-compatible)          │
└─────────────────────────────────────────────────────┘
```

---

## Stack tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI |
| TypeScript | 5.9 | Tipado estático |
| Vite | 7 | Build tool |
| Tailwind CSS | v4 | Estilos |
| shadcn/ui | latest | Componentes UI |
| wouter | 3.7.1 | Routing |
| TanStack Query | v5 | Cache y fetching |
| tRPC client | v11 | API tipada |
| React Hook Form + Zod | latest | Formularios |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | ≥20 | Runtime |
| Express | 4 | HTTP server |
| tRPC | v11 | API end-to-end tipada |
| Drizzle ORM | latest | Acceso a BD |
| mysql2 | 3 | Driver MySQL/TiDB |
| jose | 6 | JWT signing/verification |
| bcryptjs | 3 | Hash de contraseñas |
| express-rate-limit | 8 | Rate limiting |
| Mermaid.js | via @streamdown/mermaid | Esquemas unifilares |

### Infraestructura
| Servicio | Uso |
|---|---|
| Railway | Hosting del proceso Node.js |
| TiDB Cloud | Base de datos MySQL-compatible |
| Stripe | Pagos y suscripciones |

---

## Estructura de directorios

```
certia/
├── client/src/
│   ├── pages/
│   │   ├── dashboard/
│   │   │   ├── CertificateWizard.tsx              # Wizard 6 pasos
│   │   │   ├── CertificateWizardStep4Enhanced.tsx # Circuitos + IA
│   │   │   ├── CertificateWizardStep6Enhanced.tsx # Revisión + PDF
│   │   │   └── certificates-management.tsx        # Lista certificados
│   │   ├── auth/                                  # Login / Registro
│   │   ├── clients.tsx                            # Gestión clientes
│   │   ├── installations.tsx                      # Gestión instalaciones
│   │   ├── settings.tsx                           # Perfil instalador
│   │   └── pricing.tsx                            # Planes de suscripción
│   ├── components/                                # UI compartida
│   ├── lib/trpc.ts                                # Cliente tRPC
│   └── _core/hooks/useAuth.ts                     # Hook autenticación
│
├── server/
│   ├── _core/
│   │   ├── index.ts          # Entry point Express
│   │   ├── context.ts        # Contexto tRPC (user injection)
│   │   ├── sdk.ts            # JWT sign/verify + authenticateRequest
│   │   ├── localAuth.ts      # Rutas /api/auth (register, login, logout)
│   │   ├── env.ts            # Variables de entorno tipadas
│   │   ├── trpc.ts           # publicProcedure / protectedProcedure
│   │   └── cookies.ts        # Opciones de cookie por entorno
│   ├── services/
│   │   ├── electrical-calculations.ts  # Motor de cálculos REBT
│   │   ├── diagram-generation.ts       # Generación SVG unifilar
│   │   ├── pdf-generation.ts           # Plantillas HTML por CCAA
│   │   ├── export/
│   │   │   └── certificate-package.ts # Ensamblado datos PDF
│   │   └── subscription-service.ts    # Lógica Stripe
│   ├── routers.ts            # Todos los endpoints tRPC
│   ├── db.ts                 # Funciones de acceso a BD
│   ├── db-certificates.ts    # Queries certificados
│   └── db-subscriptions.ts   # Queries suscripciones
│
├── drizzle/
│   ├── schema.ts             # Esquema completo de BD
│   └── migrations/           # Migraciones SQL generadas
│
└── shared/
    ├── types.ts              # Tipos compartidos cliente/servidor
    └── _core/errors.ts       # Errores tipados
```

---

## Autenticación

Sistema propio de email/password con JWT:

```
POST /api/auth/register
  → bcrypt.hash(password) → INSERT users → SignJWT → Set-Cookie

POST /api/auth/login
  → getUserByEmail → bcrypt.compare → SignJWT → Set-Cookie

Cada petición tRPC
  → parseCookie → jwtVerify(JWT_SECRET) → getUserByOpenId → ctx.user
```

- Token firmado con `HS256` usando `JWT_SECRET`
- Almacenado en cookie `httpOnly`, `SameSite=Lax`
- Expiración: 1 año
- `protectedProcedure` en tRPC lanza `UNAUTHORIZED` si `ctx.user` es null

---

## API (tRPC)

Todos los endpoints bajo `/api/trpc`. Tipado end-to-end: el cliente infiere los tipos directamente del router del servidor sin generación de código.

### Routers principales
```
auth.*          → me, logout
profile.*       → get, upsert
clients.*       → list, get, create, update, delete
installations.* → list, get, create, update, delete
certificates.*  → list, get, create, update, delete, duplicate
calculations.*  → cableSection, mainSwitch, voltageDrop, correctionFactor
ai.*            → suggestCircuits, reviewCertificate
diagrams.*      → generate, unifilarSvgFromId
pdf.*           → generate, downloadPdf
subscription.*  → get, createCheckoutSession, createPortalSession
```

### Rate limiting
- Auth endpoints: 10 req / 15 min / IP
- AI endpoints: 30 req / hora / IP

---

## Base de datos

MySQL-compatible (TiDB Cloud). ORM: Drizzle con migraciones versionadas.

### Tablas principales
```
users           → autenticación (openId, email, passwordHash)
profiles        → datos empresa instaladora (CIF, autorización CCAA)
installers      → técnicos de la empresa (carnet RITSIC, firma)
clients         → clientes del instalador
installations   → instalaciones por cliente
certificates    → CIE generados (wizard completo + estado)
circuits        → circuitos de cada certificado
measurements    → mediciones del paso 5
subscriptions   → estado Stripe por usuario
client_tokens   → tokens de acceso portal cliente (sin login)
```

---

## Motor de cálculos eléctricos

`server/services/electrical-calculations.ts` — núcleo de negocio.

Implementa según REBT:
- **Sección de conductores**: criterio de intensidad admisible (ITC-BT-07/19) con factores de corrección de temperatura (kt), agrupamiento (kg) y método de instalación (ki)
- **Caída de tensión**: fórmulas monofásica/trifásica con resistividad corregida a temperatura de servicio del aislamiento (PVC 70°C / XLPE 90°C)
- **Límites normativos**: 1% DI (ITC-BT-15), 3% interior (ITC-BT-19), 5% industrial (ITC-BT-47)
- **Coherencia protecciones**: Ib ≤ In ≤ Iz

---

## Generación de documentos

### PDF del CIE
1. `buildCertificatePdfInputFromId()` ensambla todos los datos (certificado + circuitos + mediciones + perfil + instalador)
2. `generateCertificateHTMLByCCAA()` selecciona la plantilla HTML según la CCAA del instalador
3. El HTML se sirve desde `/api/pdf/:id` con `window.print()` autoejecutado
4. Puppeteer está instalado para PDF nativo (pendiente de activar)

### Esquema unifilar
- `generateUnifilarSVG()` genera SVG programático escalado al número de circuitos
- Disponible en Step 6 del wizard y desde la lista de certificados
- Tooltips interactivos por circuito (PIA, sección, potencia, RCD)

---

## Despliegue

```
railway up
  → nixpacks detecta Node.js + pnpm
  → pnpm install && pnpm build
      → vite build        (→ dist/public/)
      → esbuild server    (→ dist/index.js)
  → pnpm start
      → NODE_ENV=production node dist/index.js
      → Express sirve static + tRPC + auth
```

### Variables de entorno requeridas en Railway
```
DATABASE_URL          TiDB Cloud connection string
JWT_SECRET            Mínimo 32 chars aleatorios
STRIPE_SECRET_KEY     sk_live_... o sk_test_...
STRIPE_PRICE_ID_PRO   price_...
NODE_ENV              production
PORT                  3000
```
