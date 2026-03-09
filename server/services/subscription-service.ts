/**
 * Servicio de gestión de suscripciones con Stripe
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export interface PlanLimits {
  certificatesLimit: number;
  monthlyLimit: number;
  aiSuggestionsLimit: number;
  diagramExportLimit: number;
  pdfDownloadLimit: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    certificatesLimit: 5,
    monthlyLimit: 5,
    aiSuggestionsLimit: 10,
    diagramExportLimit: 10,
    pdfDownloadLimit: 10,
  },
  pro: {
    certificatesLimit: 500,
    monthlyLimit: 500,
    aiSuggestionsLimit: 1000,
    diagramExportLimit: 1000,
    pdfDownloadLimit: 1000,
  },
  enterprise: {
    certificatesLimit: Infinity,
    monthlyLimit: Infinity,
    aiSuggestionsLimit: Infinity,
    diagramExportLimit: Infinity,
    pdfDownloadLimit: Infinity,
  },
};

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amount: number; // en centavos
  currency: string;
  interval: "month" | "year";
}

/**
 * Obtiene o crea un cliente de Stripe
 */
export async function getOrCreateStripeCustomer(
  userId: number,
  email: string,
  name?: string
): Promise<string> {
  try {
    // Buscar cliente existente por metadata
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    // Crear nuevo cliente
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString(),
      },
    });

    return customer.id;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw new Error("Failed to create Stripe customer");
  }
}

/**
 * Crea una sesión de checkout para suscripción
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session.id;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
}

/**
 * Crea una sesión de portal de cliente para gestionar suscripción
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    console.error("Error creating portal session:", error);
    throw new Error("Failed to create portal session");
  }
}

/**
 * Obtiene la suscripción actual de un cliente
 */
export async function getSubscription(
  stripeSubscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId
    );
    return subscription;
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    return null;
  }
}

/**
 * Cancela una suscripción
 */
export async function cancelSubscription(
  stripeSubscriptionId: string,
  immediate: boolean = false
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      {
        cancel_at_period_end: !immediate,
      }
    );

    if (immediate) {
      await stripe.subscriptions.del(stripeSubscriptionId);
    }

    return subscription;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw new Error("Failed to cancel subscription");
  }
}

/**
 * Verifica si el usuario puede crear un nuevo certificado
 */
export function canCreateCertificate(
  plan: string,
  certificatesUsed: number,
  certificatesLimit: number
): boolean {
  if (plan === "enterprise") {
    return true;
  }

  return certificatesUsed < certificatesLimit;
}

/**
 * Verifica si el usuario puede usar sugerencias IA
 */
export function canUseAISuggestions(
  plan: string,
  suggestionsUsed: number,
  suggestionsLimit: number
): boolean {
  if (plan === "enterprise" || plan === "pro") {
    return true;
  }

  return suggestionsUsed < suggestionsLimit;
}

/**
 * Verifica si el usuario puede descargar PDF
 */
export function canDownloadPDF(
  plan: string,
  downloadsUsed: number,
  downloadsLimit: number
): boolean {
  if (plan === "enterprise" || plan === "pro") {
    return true;
  }

  return downloadsUsed < downloadsLimit;
}

/**
 * Obtiene los límites del plan
 */
export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Incrementa el contador de certificados usados
 */
export async function incrementCertificateCount(
  subscriptionId: number,
  db: any
): Promise<void> {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: (sub) => eq(sub.id, subscriptionId),
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const newCount = (subscription.certificatesUsed || 0) + 1;

    await db
      .update(db.subscriptions)
      .set({ certificatesUsed: newCount })
      .where(eq(db.subscriptions.id, subscriptionId));
  } catch (error) {
    console.error("Error incrementing certificate count:", error);
    throw error;
  }
}

/**
 * Procesa un webhook de Stripe
 */
export async function handleStripeWebhook(
  event: Stripe.Event,
  db: any,
  eq: any
): Promise<void> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Obtener el usuario asociado al cliente
      const customer = await stripe.customers.retrieve(customerId);
      const userId = parseInt(
        (customer.metadata?.userId as string) || "0",
        10
      );

      if (userId) {
        // Actualizar o crear suscripción en la BD
        const priceId = subscription.items.data[0].price.id;
        const plan = getPlanFromPriceId(priceId);

        await db
          .update(db.subscriptions)
          .set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            plan,
            status: subscription.status as "active" | "canceled" | "past_due",
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          })
          .where(eq(db.subscriptions.userId, userId));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const customer = await stripe.customers.retrieve(customerId);
      const userId = parseInt(
        (customer.metadata?.userId as string) || "0",
        10
      );

      if (userId) {
        await db
          .update(db.subscriptions)
          .set({
            plan: "free",
            status: "canceled",
            canceledAt: new Date(),
          })
          .where(eq(db.subscriptions.userId, userId));
      }
      break;
    }

    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      // Manejar eventos de pago si es necesario
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Obtiene el plan basado en el priceId de Stripe
 * (Esta función debe mapearse según tus IDs de Stripe)
 */
function getPlanFromPriceId(priceId: string): "free" | "pro" | "enterprise" {
  // Mapear tus priceIds de Stripe aquí
  const priceIdMap: Record<string, "free" | "pro" | "enterprise"> = {
    [process.env.STRIPE_PRICE_ID_PRO || ""]: "pro",
    [process.env.STRIPE_PRICE_ID_ENTERPRISE || ""]: "enterprise",
  };

  return priceIdMap[priceId] || "free";
}
