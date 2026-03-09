import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Download, Edit, Trash2, Copy, Search } from "lucide-react";
import { toast } from "sonner";

export default function CertificatesPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: certificates, isLoading, refetch } = trpc.certificates.list.useQuery();
  const deleteMutation = trpc.certificates.delete.useMutation();

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este certificado?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Certificado eliminado");
      refetch();
    } catch (error) {
      toast.error("Error al eliminar el certificado");
    }
  };

  const handleDuplicate = (id: number) => {
    toast.info("Funcionalidad de duplicado en desarrollo");
  };

  const filteredCertificates = certificates?.filter(cert =>
    cert.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.installationType?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Certificados</h2>
          <p className="text-gray-600 text-sm mt-1">Gestiona tus certificados de instalación</p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/certificates/new")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Certificado
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por número o tipo de instalación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{certificates?.length || 0}</div>
            <p className="text-gray-600 text-sm">Total de certificados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {certificates?.filter(c => c.status === "completed").length || 0}
            </div>
            <p className="text-gray-600 text-sm">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {certificates?.filter(c => c.status === "draft").length || 0}
            </div>
            <p className="text-gray-600 text-sm">En borrador</p>
          </CardContent>
        </Card>
      </div>

      {/* Certificates List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Cargando certificados...
            </CardContent>
          </Card>
        ) : filteredCertificates.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">No hay certificados</h3>
              <p className="text-gray-600 text-sm mb-4">
                Comienza creando tu primer certificado de instalación
              </p>
              <Button
                onClick={() => setLocation("/dashboard/certificates/new")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Certificado
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCertificates.map((cert) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {cert.certificateNumber || `Certificado #${cert.id}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {cert.installationType || "Sin especificar"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mt-3">
                      <span>Potencia: {cert.installedPower || "—"} W</span>
                      <span>Tensión: {cert.supplyVoltage || "—"} V</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cert.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : cert.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {cert.status === "completed" ? "Completado" : cert.status === "draft" ? "Borrador" : "Archivado"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/dashboard/certificates/${cert.id}`)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(cert.id)}
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {cert.pdfUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cert.pdfUrl && window.open(cert.pdfUrl, "_blank")}
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cert.id)}
                      title="Eliminar"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
