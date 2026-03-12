# CertIA - CLAUDE.md

## Proyecto
**CertIA** es un SaaS para instaladores eléctricos autorizados que simplifica la creación de **Certificados de Instalación Eléctrica (CIE)** según el REBT (Reglamento Electrotécnico para Baja Tensión) en España. Es el MVP del portafolio **BuildAI** (plataforma modular para el sector construcción).

**Estado actual**: 85% completado. Core funcional. Pendiente: tests automatizados, rate limiting, caché servidor, setup producción.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite, Tailwind CSS v4 + shadcn/ui |
| Routing | wouter 3.7.1 |
| Estado/Data | TanStack Query v5 + tRPC v11 |
| Backend | Node.js + Express + tRPC |
| ORM / BD | Drizzle ORM + MySQL/TiDB |
| Auth | Manus OAuth |
| Pagos | Stripe |
| IA | OpenAI API (`@ai-sdk/openai`) |
| Storage | AWS S3 |
| Diagramas | Mermaid.js (`@streamdown/mermaid`) |
| Testing | Vitest |
| Package manager | **pnpm** (siempre usar pnpm, nunca npm/yarn) |

---

## Comandos Clave

```bash
pnpm dev          # Servidor desarrollo
pnpm build        # Build producción
pnpm test         # Tests con Vitest
pnpm check        # TypeScript typecheck
pnpm format       # Prettier
pnpm db:push      # Generar y ejecutar migraciones Drizzle
pnpm seed         # Poblar BD con datos de prueba
```

---

## Estructura del Proyecto

```
certia/
├── client/src/
│   ├── pages/dashboard/
│   │   ├── CertificateWizard.tsx           # Wizard principal (6 steps)
│   │   ├── CertificateWizardStep4Enhanced.tsx  # Step 4: Circuitos + IA
│   │   ├── CertificateWizardStep6Enhanced.tsx  # Step 6: Revisión + PDF
│   │   └── certificates-management.tsx     # Dashboard de certificados
│   ├── lib/trpc.ts                         # Cliente tRPC
│   └── _core/hooks/useAuth.ts              # Hook de autenticación
├── server/
│   ├── routers.ts                          # Todos los endpoints tRPC
│   ├── services/
│   │   ├── electrical-calculations.ts      # Motor de cálculos REBT
│   │   ├── diagram-generation.ts           # Generación Mermaid unifilares
│   │   ├── pdf-generation.ts               # Generación certificados HTML/PDF
│   │   └── subscription-service.ts         # Gestión Stripe
│   ├── db-certificates.ts                  # Procedimientos BD certificados
│   ├── db-subscriptions.ts                 # Procedimientos BD suscripciones
│   └── _core/                              # Infraestructura (auth, trpc, env...)
├── drizzle/
│   ├── schema.ts                           # Esquema completo de BD
│   └── migrations/
└── shared/
    ├── types.ts                            # Entry point tipos compartidos
    └── _core/errors.ts
```

---

## Dominio (REBT / CIE)

- **REBT**: Reglamento Electrotécnico para Baja Tensión
- **CIE**: Certificado de Instalación Eléctrica (el documento que genera la app)
- **ITC-BT**: Instrucciones Técnicas Complementarias (e.g. ITC-BT-07, ITC-BT-19, ITC-BT-25)
- **IGA/PIA/RCD**: Interruptor General Automático / Pequeño Interruptor Automático / Diferencial
- El wizard crea certificados en 6 pasos: Cliente → Instalación → Derivación → Circuitos (IA) → Mediciones → Revisión+PDF

---

## Endpoints tRPC Principales

- `auth.me`, `auth.logout`
- `profile.get`, `profile.upsert`
- `clients.*`, `installations.*`, `certificates.*`
- `calculations.cableSection`, `calculations.mainSwitch`, `calculations.voltageDrop`
- `ai.suggestCircuits`, `diagrams.generate`, `diagrams.export`
- `pdf.generate`, `pdf.download`
- `subscription.get`, `subscription.createCheckoutSession`, `subscription.createPortalSession`

---

## Planes de Suscripción

| Plan | Certificados/mes | Precio |
|------|-----------------|--------|
| Free | 5 | 0€ |
| Pro | 500 | — |
| Enterprise | Ilimitado | Custom |

---

## Patrones y Convenciones

- **Tipos**: Inferidos desde `drizzle/schema.ts` via `$inferSelect` / `$inferInsert`
- **API**: tRPC end-to-end tipado (no REST puro)
- **Formularios**: React Hook Form + Zod
- **BD**: Drizzle ORM con MySQL. Columnas en camelCase
- **Auth**: Manus OAuth (openId como identificador único de usuario)
- Siempre validar en `server/routers.ts` antes de llamar servicios

---

## Pendiente (Próximos pasos)

- [ ] Tests unitarios para `electrical-calculations.ts`
- [ ] Tests E2E automatizados (Playwright)
- [ ] Documentación API tRPC
- [ ] Rate limiting en endpoints
- [ ] Server-side caching (Redis)
- [ ] PDF real con Puppeteer (actualmente genera HTML)
- [ ] Integración real OpenAI (actualmente sugerencias determinísticas en Step 4)
- [ ] Setup producción: SSL, CDN, backups, monitoreo
