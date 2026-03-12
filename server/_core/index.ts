import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerLocalAuthRoutes } from "./localAuth";
import { registerDevAuthRoutes } from "./devAuth";
import { registerChatRoutes } from "./chat";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import * as db from "../db";
import { generateCertificateHTMLByCCAA } from "../services/pdf-generation";
import { buildCertificatePdfInputFromId } from "../services/export/certificate-package";

// ── Rate limiters ──────────────────────────────────────────────────────────────
// Auth: 10 intentos por 15 minutos por IP (evita fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera 15 minutos antes de intentarlo de nuevo." },
  skip: () => process.env.NODE_ENV === "development",
});

// AI: 30 peticiones por hora por IP (controla coste de OpenAI)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Límite de uso de IA alcanzado. Inténtalo de nuevo en una hora." },
  skip: () => process.env.NODE_ENV === "development",
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Apply rate limiting to auth endpoints
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  // Apply rate limiting to AI endpoints
  app.use("/api/trpc/ai.", aiLimiter);
  app.use("/api/chat", aiLimiter);

  // Email/password auth routes (/api/auth/register, /api/auth/login, /api/auth/logout)
  registerLocalAuthRoutes(app);
  // Dev login bypass (solo development, ignorado en producción)
  registerDevAuthRoutes(app);
  // Chat API with streaming and tool calling
  registerChatRoutes(app);
  // PDF REST endpoint — /api/pdf/:id
  // Returns self-printing HTML for the certificate (browser opens print dialog)
  app.get("/api/pdf/:id", async (req, res) => {
    try {
      const certId = parseInt(req.params.id, 10);
      if (isNaN(certId)) {
        res.status(400).send('ID inválido');
        return;
      }

      // In demo mode context always returns DEMO_USER (id=1)
      const ctx = await createContext({ req, res } as any);
      const userId = ctx.user?.id;
      if (!userId) {
        res.status(401).send('No autorizado');
        return;
      }

      const cert = await db.getCertificateById(certId, userId);
      if (!cert) {
        res.status(404).send('Certificado no encontrado');
        return;
      }

      const pdfInput = await buildCertificatePdfInputFromId(certId, userId);
      const html = await generateCertificateHTMLByCCAA(pdfInput, pdfInput.autonomousCommunity);
      const printableHtml = html.replace('</body>', '<script>window.onload=function(){window.print();}</script></body>');

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(printableHtml);
    } catch (err) {
      console.error('[PDF endpoint]', err);
      res.status(500).send('Error al generar el certificado');
    }
  });

  // Portal PDF — acceso público con token (sin sesión)
  // GET /api/portal/pdf/:certificateId?token=...
  app.get("/api/portal/pdf/:certificateId", async (req, res) => {
    try {
      const certId = parseInt(req.params.certificateId, 10);
      const token = (req.query.token as string) || "";
      if (isNaN(certId) || !token) {
        res.status(400).send("ID de certificado y token son obligatorios");
        return;
      }
      const tokenRecord = await db.getClientTokenByToken(token);
      if (!tokenRecord || new Date(tokenRecord.expiresAt) < new Date()) {
        res.status(401).send("Token inválido o expirado");
        return;
      }
      const cert = await db.getCertificateByIdAndClientId(certId, tokenRecord.clientId);
      if (!cert) {
        res.status(404).send("Certificado no encontrado");
        return;
      }
      const pdfInput = await buildCertificatePdfInputFromId(certId, cert.userId);
      const profile = await db.getProfileByUserId(cert.userId);
      const ccaa = profile?.autonomousCommunity ?? undefined;
      const html = await generateCertificateHTMLByCCAA(pdfInput, ccaa);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (err) {
      console.error("[Portal PDF]", err);
      res.status(500).send("Error al generar el certificado");
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
