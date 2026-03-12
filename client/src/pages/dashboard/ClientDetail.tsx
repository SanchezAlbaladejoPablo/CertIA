import { useParams } from "wouter";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Loader2, FileText, MapPin, Phone, Mail, Building2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  issued: "bg-blue-100 text-blue-800",
  submitted: "bg-orange-100 text-orange-800",
  registered: "bg-purple-100 text-purple-800",
  signed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  issued: "Emitido",
  submitted: "Presentado",
  registered: "Registrado",
  signed: "Firmado",
  archived: "Archivado",
};

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const clientId = params?.id ? parseInt(params.id) : null;

  const { data, isLoading } = trpc.clients.getWithRelations.useQuery(
    { id: clientId! },
    { enabled: !!clientId }
  );

  if (!clientId) return <div>ID de cliente inválido</div>;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data?.client) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Cliente no encontrado</p>
        <Button className="mt-4" onClick={() => setLocation("/dashboard")}>
          Volver al dashboard
        </Button>
      </div>
    );
  }

  const { client, installations: clientInstallations, certificates: clientCertificates } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-500 text-sm">{client.type === "company" ? "Empresa" : "Persona física"}</p>
        </div>
      </div>

      {/* Datos del cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Datos del titular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-gray-500 mb-1">DNI / NIF</p>
              <p className="font-medium">{client.dniNif || "-"}</p>
            </div>
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500 mb-1">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500 mb-1">Teléfono</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500 mb-1">Dirección</p>
                  <p className="font-medium">
                    {client.address}
                    {client.postalCode && `, ${client.postalCode}`}
                    {client.city && ` ${client.city}`}
                    {client.province && ` (${client.province})`}
                  </p>
                </div>
              </div>
            )}
            {client.notes && (
              <div className="col-span-2">
                <p className="text-gray-500 mb-1">Notas</p>
                <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{client.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instalaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Instalaciones ({clientInstallations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clientInstallations.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin instalaciones registradas</p>
          ) : (
            <div className="space-y-3">
              {clientInstallations.map((inst: any) => (
                <div key={inst.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{inst.name}</p>
                    <p className="text-sm text-gray-500">
                      {inst.address || "Sin dirección"}
                      {inst.type && ` — ${inst.type}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificados */}
      <Card>
        <CardHeader>
          <CardTitle>Certificados ({clientCertificates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clientCertificates.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin certificados emitidos</p>
          ) : (
            <div className="space-y-3">
              {clientCertificates.map((cert: any) => (
                <div key={cert.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{cert.certificateNumber || `#${cert.id}`}</p>
                    <p className="text-sm text-gray-500">
                      {cert.installationType || "Tipo desconocido"} —{" "}
                      {new Date(cert.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[cert.status] || "bg-gray-100"}>
                    {STATUS_LABELS[cert.status] || cert.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/pdf/${cert.id}`, "_blank")}
                  >
                    PDF
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
