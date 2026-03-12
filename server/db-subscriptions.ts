// @ts-nocheck
/**
 * Procedimientos de base de datos para gestión de suscripciones
 * NOTE: Superseded by server/db.ts. Not imported by routers.ts.
 */

import { getDb } from "./db";
import { subscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Helper to get db instance (throws if unavailable)
async function db() {
  const instance = await getDb();
  if (!instance) throw new Error("Database not available");
  return instance;
}

/**
 * Obtiene la suscripción de un usuario
 */
export async function getSubscriptionByUserId(userId: number) {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });
    return subscription || null;
  } catch (error) {
    console.error("Error getting subscription:", error);
    throw error;
  }
}

/**
 * Crea una nueva suscripción para un usuario
 */
export async function createSubscription(userId: number) {
  try {
    const result = await db.insert(subscriptions).values({
      userId,
      plan: "free",
      status: "active",
      certificatesLimit: 5,
      certificatesUsed: 0,
    });

    return result;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

/**
 * Actualiza la suscripción de un usuario
 */
export async function updateSubscription(
  userId: number,
  data: Partial<typeof subscriptions.$inferInsert>
) {
  try {
    const result = await db
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));

    return result;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

/**
 * Incrementa el contador de certificados usados
 */
export async function incrementCertificateUsage(userId: number) {
  try {
    const subscription = await getSubscriptionByUserId(userId);

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const newCount = (subscription.certificatesUsed || 0) + 1;

    await db
      .update(subscriptions)
      .set({
        certificatesUsed: newCount,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));

    return newCount;
  } catch (error) {
    console.error("Error incrementing certificate usage:", error);
    throw error;
  }
}

/**
 * Obtiene el plan y límites de un usuario
 */
export async function getUserPlanInfo(userId: number) {
  try {
    const subscription = await getSubscriptionByUserId(userId);

    if (!subscription) {
      return {
        plan: "free",
        certificatesLimit: 5,
        certificatesUsed: 0,
        status: "active",
      };
    }

    return {
      plan: subscription.plan,
      certificatesLimit: subscription.certificatesLimit,
      certificatesUsed: subscription.certificatesUsed,
      status: subscription.status,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    };
  } catch (error) {
    console.error("Error getting user plan info:", error);
    throw error;
  }
}

/**
 * Verifica si un usuario puede crear un certificado
 */
export async function canUserCreateCertificate(userId: number): Promise<boolean> {
  try {
    const planInfo = await getUserPlanInfo(userId);

    if (planInfo.plan === "enterprise") {
      return true;
    }

    if (planInfo.plan === "pro") {
      return planInfo.certificatesUsed < planInfo.certificatesLimit;
    }

    // Free plan
    return planInfo.certificatesUsed < 5;
  } catch (error) {
    console.error("Error checking certificate creation permission:", error);
    return false;
  }
}

/**
 * Obtiene el número de certificados disponibles para un usuario
 */
export async function getAvailableCertificates(userId: number): Promise<number> {
  try {
    const planInfo = await getUserPlanInfo(userId);

    if (planInfo.plan === "enterprise") {
      return Infinity;
    }

    return Math.max(0, planInfo.certificatesLimit - planInfo.certificatesUsed);
  } catch (error) {
    console.error("Error getting available certificates:", error);
    return 0;
  }
}

/**
 * Resetea los contadores de uso mensual (debe ejecutarse en cron job)
 */
export async function resetMonthlyUsage() {
  try {
    const result = await db
      .update(subscriptions)
      .set({
        certificatesUsed: 0,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.plan, "free"));

    return result;
  } catch (error) {
    console.error("Error resetting monthly usage:", error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de suscripciones
 */
export async function getSubscriptionStats() {
  try {
    const allSubscriptions = await db.query.subscriptions.findMany();

    const stats = {
      total: allSubscriptions.length,
      byPlan: {
        free: allSubscriptions.filter((s) => s.plan === "free").length,
        pro: allSubscriptions.filter((s) => s.plan === "pro").length,
        enterprise: allSubscriptions.filter((s) => s.plan === "enterprise")
          .length,
      },
      byStatus: {
        active: allSubscriptions.filter((s) => s.status === "active").length,
        canceled: allSubscriptions.filter((s) => s.status === "canceled").length,
        past_due: allSubscriptions.filter((s) => s.status === "past_due").length,
      },
      totalCertificatesUsed: allSubscriptions.reduce(
        (sum, s) => sum + (s.certificatesUsed || 0),
        0
      ),
    };

    return stats;
  } catch (error) {
    console.error("Error getting subscription stats:", error);
    throw error;
  }
}
