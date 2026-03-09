import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AUTONOMOUS_COMMUNITIES = [
  "Andalucía",
  "Aragón",
  "Asturias",
  "Baleares",
  "Canarias",
  "Cantabria",
  "Castilla-La Mancha",
  "Castilla y León",
  "Cataluña",
  "Comunidad Valenciana",
  "Extremadura",
  "Galicia",
  "Madrid",
  "Murcia",
  "Navarra",
  "País Vasco",
  "La Rioja",
];

const INSTALLER_CATEGORIES = [
  "Básica",
  "Especialista",
  "Responsable de Mantenimiento",
];

export default function SettingsPage() {
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const upsertMutation = trpc.profile.upsert.useMutation();
  
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "",
    companyName: profile?.companyName || "",
    cifNif: profile?.cifNif || "",
    installerNumber: profile?.installerNumber || "",
    installerCategory: profile?.installerCategory || "",
    autonomousCommunity: profile?.autonomousCommunity || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    postalCode: profile?.postalCode || "",
    city: profile?.city || "",
    province: profile?.province || "",
  });

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync(formData);
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      toast.error("Error al actualizar el perfil");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil del Instalador</CardTitle>
          <CardDescription>
            Información profesional y de contacto del instalador autorizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Información Personal</h3>
            <div className="space-y-4">
              <div>
                <Label>Nombre completo</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Juan Pérez García"
                />
              </div>

              <div>
                <Label>Nombre de empresa</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="Instalaciones Eléctricas García"
                />
              </div>

              <div>
                <Label>CIF / NIF</Label>
                <Input
                  value={formData.cifNif}
                  onChange={(e) =>
                    setFormData({ ...formData, cifNif: e.target.value })
                  }
                  placeholder="12345678A"
                />
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Información Profesional</h3>
            <div className="space-y-4">
              <div>
                <Label>Número de registro de instalador</Label>
                <Input
                  value={formData.installerNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, installerNumber: e.target.value })
                  }
                  placeholder="Ej: 28/2024/0001"
                />
              </div>

              <div>
                <Label>Categoría de instalador</Label>
                <Select
                  value={formData.installerCategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, installerCategory: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Comunidad Autónoma</Label>
                <Select
                  value={formData.autonomousCommunity}
                  onValueChange={(value) =>
                    setFormData({ ...formData, autonomousCommunity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una comunidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTONOMOUS_COMMUNITIES.map((community) => (
                      <SelectItem key={community} value={community}>
                        {community}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Dirección</h3>
            <div className="space-y-4">
              <div>
                <Label>Dirección</Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="C/ Mayor 23"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Código postal</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    placeholder="28001"
                  />
                </div>
                <div>
                  <Label>Ciudad</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Madrid"
                  />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Input
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    placeholder="Madrid"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t pt-6 flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle>Plan de Suscripción</CardTitle>
          <CardDescription>
            Gestiona tu suscripción y límites de uso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionInfo />
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionInfo() {
  const { data: subscription, isLoading } = trpc.subscription.get.useQuery();

  if (isLoading) {
    return <div className="text-gray-500">Cargando información de suscripción...</div>;
  }

  if (!subscription) {
    return <div className="text-gray-500">No hay información de suscripción disponible</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Plan actual</p>
          <p className="text-lg font-semibold text-gray-900 capitalize">
            {subscription.plan}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Estado</p>
          <p className={`text-lg font-semibold capitalize ${
            subscription.status === "active" ? "text-green-600" : "text-red-600"
          }`}>
            {subscription.status}
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">Límite de certificados</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    (subscription.certificatesLimit ?? 1) === -1
                      ? 0
                      : ((subscription.certificatesUsed ?? 0) / (subscription.certificatesLimit ?? 1)) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
            {subscription.certificatesUsed ?? 0} / {(subscription.certificatesLimit ?? 1) === -1 ? "∞" : subscription.certificatesLimit}
          </span>
        </div>
      </div>

      {subscription.currentPeriodEnd && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600">Próxima renovación</p>
          <p className="text-gray-900">
            {new Date(subscription.currentPeriodEnd).toLocaleDateString("es-ES")}
          </p>
        </div>
      )}
    </div>
  );
}
