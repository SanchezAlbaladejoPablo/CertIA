import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Zap, Clock, Lightbulb, FileText, CheckCircle, ArrowRight } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-gray-900">CertIA</span>
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => window.location.href = loginUrl}>
                  Iniciar sesión
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = loginUrl}
                >
                  Empezar gratis
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Certificados Eléctricos en <span className="text-blue-600">20 minutos</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          CertIA automatiza la generación de Certificados de Instalación Eléctrica (CIE) conforme a REBT con inteligencia artificial, reduciendo 6-8 horas de trabajo a 20-30 minutos.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.href = loginUrl}
          >
            Empezar gratis
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button size="lg" variant="outline">
            Ver demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Características principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature
              icon={<Clock className="w-8 h-8" />}
              title="20 minutos"
              description="Crea certificados completos en minutos en lugar de horas"
            />
            <Feature
              icon={<Lightbulb className="w-8 h-8" />}
              title="IA Inteligente"
              description="Sugerencias automáticas de circuitos y cálculos eléctricos"
            />
            <Feature
              icon={<FileText className="w-8 h-8" />}
              title="PDF Oficial"
              description="Exportación a PDF con esquema unifilar incluido"
            />
            <Feature
              icon={<CheckCircle className="w-8 h-8" />}
              title="Conforme a REBT"
              description="Cumple con toda la normativa de instalaciones eléctricas"
            />
            <Feature
              icon={<Zap className="w-8 h-8" />}
              title="Cálculos Automáticos"
              description="Secciones de cable, caída de tensión y protecciones"
            />
            <Feature
              icon={<FileText className="w-8 h-8" />}
              title="Gestión Completa"
              description="Clientes, instalaciones y certificados en una plataforma"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Planes simples y transparentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <PricingCard
              name="Free"
              price="0€"
              description="Perfecto para empezar"
              features={[
                "1 certificado",
                "Gestión de clientes",
                "Cálculos básicos",
              ]}
            />
            <PricingCard
              name="Pro"
              price="49€"
              period="/mes"
              description="Para profesionales"
              features={[
                "Certificados ilimitados",
                "Gestión completa",
                "IA avanzada",
                "Soporte prioritario",
              ]}
              highlighted
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            ¿Listo para digitalizar tu trabajo?
          </h2>
          <p className="text-lg mb-8 text-blue-100">
            Únete a instaladores eléctricos que ya están ahorrando horas de trabajo
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => window.location.href = loginUrl}
          >
            Empezar gratis ahora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 CertIA. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4 text-blue-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-8 ${
        highlighted
          ? "bg-blue-600 text-white ring-2 ring-blue-600 scale-105"
          : "bg-white border border-gray-200"
      }`}
    >
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className={highlighted ? "text-blue-100" : "text-gray-600"}>{description}</p>
      <div className="my-6">
        <span className="text-4xl font-bold">{price}</span>
        {period && <span className={highlighted ? "text-blue-100" : "text-gray-600"}>{period}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        className={highlighted ? "w-full bg-white text-blue-600 hover:bg-gray-100" : "w-full"}
        variant={highlighted ? "default" : "outline"}
      >
        Empezar
      </Button>
    </div>
  );
}
