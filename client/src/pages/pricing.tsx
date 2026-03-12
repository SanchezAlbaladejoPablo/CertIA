import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: Array<{
    name: string;
    included: boolean;
  }>;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratuito",
    description: "Perfecto para comenzar",
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: "",
    stripePriceIdYearly: "",
    features: [
      { name: "5 certificados/mes", included: true },
      { name: "Cálculos REBT básicos", included: true },
      { name: "10 sugerencias IA/mes", included: true },
      { name: "Esquemas Mermaid", included: true },
      { name: "Exportación PDF", included: false },
      { name: "Soporte por email", included: false },
      { name: "API access", included: false },
    ],
  },
  {
    id: "pro",
    name: "Profesional",
    description: "Para instaladores activos",
    priceMonthly: 29,
    priceYearly: 290,
    stripePriceIdMonthly: "",
    stripePriceIdYearly: "",
    recommended: true,
    features: [
      { name: "500 certificados/mes", included: true },
      { name: "Cálculos REBT avanzados", included: true },
      { name: "1000 sugerencias IA/mes", included: true },
      { name: "Esquemas Mermaid ilimitados", included: true },
      { name: "Exportación PDF ilimitada", included: true },
      { name: "Soporte prioritario", included: true },
      { name: "API access", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Empresarial",
    description: "Para grandes organizaciones",
    priceMonthly: 99,
    priceYearly: 990,
    stripePriceIdMonthly: "",
    stripePriceIdYearly: "",
    features: [
      { name: "Certificados ilimitados", included: true },
      { name: "Cálculos REBT personalizados", included: true },
      { name: "Sugerencias IA ilimitadas", included: true },
      { name: "Esquemas Mermaid ilimitados", included: true },
      { name: "Exportación PDF ilimitada", included: true },
      { name: "Soporte 24/7 dedicado", included: true },
      { name: "API access completo", included: true },
    ],
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const createCheckoutMutation = trpc.subscription.createCheckoutSession.useMutation();
  const user = trpc.auth.me.useQuery();
  const planInfo = trpc.subscription.getPlanInfo.useQuery(undefined, {
    enabled: !!user.data,
  });

  const handleUpgrade = async (plan: Plan) => {
    if (!user.data) {
      toast.error("Debes iniciar sesión para actualizar tu plan");
      return;
    }

    if (plan.id === "free") {
      toast.info("Ya estás en el plan gratuito");
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const priceId =
        billingCycle === "monthly" ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly;

      if (!priceId) {
        toast.error("Precio no configurado para este plan");
        return;
      }

      const result = await createCheckoutMutation.mutateAsync({
        priceId,
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing?checkout=canceled`,
      });

      window.location.href = `https://checkout.stripe.com/pay/${result.sessionId}`;
    } catch {
      toast.error("Error al procesar el pago");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Planes de Suscripción</h1>
          <p className="text-xl text-gray-600 mb-8">Elige el plan perfecto para tu negocio</p>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                billingCycle === "monthly"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                billingCycle === "yearly"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              Anual (Ahorra 17%)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => {
            const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const isCurrentPlan = planInfo.data?.plan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.recommended ? "ring-2 ring-blue-600 shadow-lg" : ""
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Recomendado
                    </span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price */}
                  <div className="mb-6">
                    {price === 0 ? (
                      <div className="text-3xl font-bold text-gray-900">Gratis</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-gray-900">€{price}</div>
                        <p className="text-gray-600 text-sm mt-1">
                          {billingCycle === "monthly" ? "/mes" : "/año"}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <div key={feature.name} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={feature.included ? "text-gray-900" : "text-gray-400"}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrentPlan || loadingPlan === plan.id}
                    className={`w-full ${
                      isCurrentPlan
                        ? "bg-gray-200 text-gray-700 cursor-not-allowed"
                        : plan.recommended
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                    }`}
                  >
                    {isCurrentPlan
                      ? "Plan Actual"
                      : loadingPlan === plan.id
                      ? "Procesando..."
                      : plan.id === "free"
                      ? "Cambiar a Gratuito"
                      : "Actualizar Ahora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  ¿Puedo cambiar de plan en cualquier momento?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sí, puedes cambiar tu plan en cualquier momento. Los cambios se aplicarán en tu
                  próximo ciclo de facturación.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  ¿Qué incluye el soporte prioritario?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Soporte por email con respuesta en menos de 24 horas, acceso a documentación
                  avanzada y consultoría técnica.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Hay contrato de larga duración?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  No, todos nuestros planes son mes a mes. Puedes cancelar en cualquier momento sin
                  penalización.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
