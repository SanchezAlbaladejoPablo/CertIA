import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Zap } from "lucide-react";

export default function Auth() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CertIA</h1>
          <p className="text-gray-600 mt-2">Certificación Eléctrica con IA</p>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>
              Accede a tu cuenta para gestionar certificados de instalaciones eléctricas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.href = loginUrl}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 h-auto"
              size="lg"
            >
              Iniciar sesión con Manus
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-sm text-gray-600">
                ¿Primera vez? Crea una cuenta haciendo clic en el botón de arriba
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600 mb-1">20 min</div>
            <p className="text-xs text-gray-600">Certificado en 20 minutos</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600 mb-1">IA</div>
            <p className="text-xs text-gray-600">Cálculos automáticos</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600 mb-1">PDF</div>
            <p className="text-xs text-gray-600">Exportación oficial</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600 mb-1">REBT</div>
            <p className="text-xs text-gray-600">Conforme a normativa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
