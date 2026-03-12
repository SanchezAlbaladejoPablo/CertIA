# CertIA

SaaS para instaladores eléctricos autorizados que automatiza la creación de **Certificados de Instalación Eléctrica (CIE)** según el REBT en España.

De 2-3 horas por certificado a **20-30 minutos**.

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [Propuesta de valor](documentation/01_VALUE_PROPOSITION.md) | Problema, solución, mercado y modelo de negocio |
| [Arquitectura técnica](documentation/02_ARCHITECTURE.md) | Stack, estructura, auth, API, BD y despliegue |
| [Dominio REBT](documentation/03_DOMAIN_REBT.md) | Glosario del dominio eléctrico para el equipo |
| [Roadmap](documentation/04_ROADMAP.md) | Estado del MVP y fases de crecimiento |

---

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend**: Node.js + Express + tRPC v11
- **BD**: Drizzle ORM + TiDB Cloud (MySQL-compatible)
- **Auth**: Email/password propio con JWT (jose + bcryptjs)
- **Pagos**: Stripe
- **Deploy**: Railway

---

## Comandos

```bash
pnpm dev        # Servidor de desarrollo
pnpm build      # Build de producción
pnpm start      # Arrancar en producción
pnpm test       # Tests con Vitest
pnpm check      # TypeScript typecheck
pnpm db:push    # Generar y ejecutar migraciones
pnpm seed       # Poblar BD con datos de prueba
```

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```bash
cp .env.example .env
```

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí | Connection string MySQL/TiDB |
| `JWT_SECRET` | Sí | Mínimo 32 chars aleatorios |
| `STRIPE_SECRET_KEY` | Sí | Clave secreta de Stripe |
| `STRIPE_PRICE_ID_PRO` | Sí | ID del precio del plan Pro |
| `NODE_ENV` | Sí | `development` o `production` |
| `OPENAI_API_KEY` | No | Si vacío, usa sugerencias estáticas |

---

## Deploy

El proyecto está configurado para Railway con nixpacks:

```bash
railway login
railway init
railway variable set DATABASE_URL="..." JWT_SECRET="..." ...
railway up
```

Ver [Arquitectura técnica](documentation/02_ARCHITECTURE.md) para la configuración completa.

---

## Parte del portafolio BuildAI

CertIA es el primer producto de **BuildAI**, plataforma modular para el sector de la construcción. El siguiente producto planificado es **DiseñIA** — herramienta de diseño de instalaciones eléctricas nuevas que comparte infraestructura con CertIA y permite importar proyectos directamente para su certificación.
