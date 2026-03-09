import type { Express, Request, Response } from "express";
import * as db from "../db";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

/**
 * Ruta de login rápido SOLO para desarrollo local.
 * NO incluir en producción.
 * Crea una sesión para el usuario del seed (test-user-001).
 */
export function registerDevAuthRoutes(app: Express) {
  if (process.env.NODE_ENV !== "development") return;

  app.get("/api/dev-login", async (req: Request, res: Response) => {
    try {
      const DEV_OPEN_ID = "test-user-001";

      // Buscar el usuario del seed en la DB
      let user = await db.getUserByOpenId(DEV_OPEN_ID);

      // Si no existe (seed no ejecutado), crearlo al vuelo
      if (!user) {
        await db.upsertUser({
          openId: DEV_OPEN_ID,
          name: "Instalador de Prueba",
          email: "test@certia.io",
          lastSignedIn: new Date(),
        });
        user = await db.getUserByOpenId(DEV_OPEN_ID);
      }

      if (!user) {
        res.status(500).json({ error: "No se pudo crear el usuario de desarrollo. Ejecuta npm run seed primero." });
        return;
      }

      // Crear sesión JWT
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "Dev User",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirigir al dashboard
      res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[DevAuth] Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  console.log("[DevAuth] ⚡ Ruta de login de desarrollo activa: GET /api/dev-login");
}
