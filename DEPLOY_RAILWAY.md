# CertIA — Plan de Deploy en Railway

> Plataforma elegida: **Railway** (free tier — $5 crédito/mes)
> Tiempo estimado: ~30 minutos

---

## Pre-requisitos

- [ ] Cuenta en [railway.app](https://railway.app) (registro con GitHub)
- [ ] Railway CLI instalado: `npm install -g @railway/cli`
- [ ] Repositorio en GitHub (o subir directamente con CLI)
- [ ] `.env` local con todas las variables listo (ya completado ✓)

---

## Paso 1 — Verificar que el build funciona en local

```bash
pnpm build
```

Debe generar:
- `dist/index.js` — servidor Express compilado
- `dist/public/` — frontend React estático

Si hay errores de TypeScript o build, resolverlos antes de continuar.

---

## Paso 2 — Crear `railway.toml` en la raíz del proyecto

Crear el archivo `railway.toml` con este contenido:

```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "pnpm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

---

## Paso 3 — Añadir `engines` al `package.json`

Añadir en `package.json` para que Railway use la versión correcta de Node:

```json
"engines": {
  "node": ">=20.0.0"
}
```

---

## Paso 4 — Crear `.railwayignore`

Crear el archivo `.railwayignore` para no subir archivos innecesarios:

```
node_modules
.env
dist
drizzle/meta
*.log
```

---

## Paso 5 — Login y deploy

```bash
# Login con la cuenta de Railway
railway login

# Inicializar proyecto (desde la raíz de D:\CertIA)
railway init

# Subir el proyecto
railway up
```

Railway detectará automáticamente Node.js + pnpm y ejecutará el build.

---

## Paso 6 — Configurar variables de entorno en Railway

En el dashboard de Railway → proyecto → **Variables**, añadir todas las variables del `.env` local:

```
DATABASE_URL=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_ENTERPRISE=
OPENAI_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
NODE_ENV=production
PORT=3000
```

> Railway también permite importar un `.env` directamente desde la UI.

---

## Paso 7 — Verificar el deploy

Railway genera automáticamente una URL pública del tipo:
```
https://certia-production.up.railway.app
```

Verificar:
- [ ] La app carga en el navegador
- [ ] El login/registro funciona
- [ ] Se puede crear un certificado completo
- [ ] El PDF se genera correctamente
- [ ] Stripe redirige al checkout (modo test)

---

## Paso 8 — Configurar dominio personalizado (opcional)

En Railway → proyecto → **Settings → Domains**:

1. Añadir dominio personalizado (ej: `app.certia.es`)
2. Crear registro CNAME en tu DNS apuntando a la URL de Railway
3. Railway provisiona el certificado SSL automáticamente (Let's Encrypt)

---

## Paso 9 — Configurar webhook de Stripe para producción

Cuando la app esté online, actualizar el webhook en el dashboard de Stripe:

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://tu-dominio.up.railway.app/api/webhooks/stripe`
3. Eventos a escuchar:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copiar el nuevo `whsec_...` → actualizar `STRIPE_WEBHOOK_SECRET` en Railway

---

## Posibles problemas y soluciones

| Problema | Causa probable | Solución |
|---|---|---|
| Build falla con error de tipos | TypeScript estricto en producción | Ejecutar `pnpm check` antes |
| App arranca pero DB no conecta | `DATABASE_URL` mal copiada | Verificar que no haya espacios ni saltos de línea |
| Puppeteer falla en producción | Faltan dependencias del SO | Añadir buildpack de Chrome o cambiar a generación HTML pura |
| `pnpm` no reconocido | Railway usa npm por defecto | Añadir `RAILWAY_PNPM=true` como variable de entorno |
| Stripe webhooks no llegan | Endpoint no configurado en dashboard | Seguir Paso 9 |

---

## Costes estimados (Railway)

| Recurso | Free tier | Estimación MVP (primeros usuarios) |
|---|---|---|
| CPU | Compartida | Suficiente |
| RAM | 512 MB | Suficiente para <50 usuarios concurrentes |
| Crédito | $5/mes gratis | ~$1-2/mes de consumo real en MVP |
| Tráfico | Ilimitado | — |
| SSL | Incluido | — |

> Si el $5/mes de crédito no es suficiente, Railway Starter Plan son $5/mes de pago con más recursos.

---

## Orden de ejecución

```
pnpm build local OK  →  crear railway.toml  →  railway login  →  railway up
→  configurar variables  →  verificar deploy  →  configurar Stripe webhook
→  (opcional) dominio personalizado
```
