import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  issued: "Emitido",
  submitted: "Presentado",
  registered: "Registrado",
  signed: "Firmado",
  archived: "Archivado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  issued: "bg-blue-100 text-blue-800",
  submitted: "bg-orange-100 text-orange-800",
  registered: "bg-purple-100 text-purple-800",
  signed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

export default function PortalPage() {
  const params = useParams<{ token: string }>();
  const { data, isLoading, error } = trpc.portal.getClientData.useQuery(
    { token: params.token ?? "" },
    { enabled: !!params.token }
  );

  if (!params.token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-gray-600">Enlace de acceso no válido</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-red-600 font-semibold">Enlace inválido o expirado</p>
            <p className="text-gray-500 text-sm mt-2">
              Contacta con tu instalador para obtener un nuevo enlace de acceso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Portal del Cliente</h1>
          <p className="text-gray-600 mt-1">Acceso a tus certificados de instalación eléctrica</p>
        </div>

        {/* Client info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Datos del titular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nombre</p>
                <p className="font-semibold">{data.client.name}</p>
              </div>
              {data.client.dniNif && (
                <div>
                  <p className="text-gray-500">DNI/NIF</p>
                  <p className="font-semibold">{data.client.dniNif}</p>
                </div>
              )}
              {data.client.email && (
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-semibold">{data.client.email}</p>
                </div>
              )}
              {data.client.phone && (
                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <p className="font-semibold">{data.client.phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Tus certificados ({data.certificates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.certificates.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay certificados disponibles</p>
            ) : (
              <div className="space-y-3">
                {data.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {cert.certificateNumber ?? `Certificado #${cert.id}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {cert.installationType ?? "Instalación eléctrica"}
                        {" · "}
                        {format(new Date(cert.createdAt), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[cert.status] ?? "bg-gray-100 text-gray-800"}>
                        {STATUS_LABELS[cert.status] ?? cert.status}
                      </Badge>
                      {(cert.status === "issued" || cert.status === "signed") && (
                        <a
                          href={`/api/portal/pdf/${cert.id}?token=${encodeURIComponent(params.token ?? "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Ver PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Acceso seguro generado por tu instalador autorizado · CertIA
        </p>
      </div>
    </div>
  );
}
