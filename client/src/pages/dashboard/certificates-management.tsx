import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Download, Copy, Trash2, Edit2, Mail, ShieldCheck, ShieldAlert, Shield, SendHorizonal, Info, Network, Loader2, Printer } from "lucide-react";
import { UnifilarDiagramFromId } from "@/components/UnifilarDiagram";
import { checkAutoFirmaStatus, signWithAutoFirma, initAutoFirma, AUTOFIRMA_DOWNLOAD_URL, AUTOFIRMA_SCRIPT_REPO } from "@/services/autofirma";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// FASE 5.3: estados extendidos
type CertificateStatus = "draft" | "issued" | "submitted" | "registered" | "signed" | "archived";

const STATUS_COLORS: Record<CertificateStatus, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  issued: "bg-blue-100 text-blue-800",
  submitted: "bg-orange-100 text-orange-800",
  registered: "bg-purple-100 text-purple-800",
  signed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<CertificateStatus, string> = {
  draft: "Borrador",
  issued: "Emitido",
  submitted: "Presentado",
  registered: "Registrado",
  signed: "Firmado",
  archived: "Archivado",
};

export default function CertificatesManagement() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [auditDialog, setAuditDialog] = useState<{ certId: number; certNumber: string } | null>(null);
  const [autoFirmaAvailable, setAutoFirmaAvailable] = useState<boolean | null>(null);
  const [unifilarDialog, setUnifilarDialog] = useState<{ certId: number; certNumber: string | null } | null>(null);

  const certificatesQuery = trpc.certificates.list.useQuery();
  const deleteCertificateMutation = trpc.certificates.delete.useMutation();
  const duplicateCertificateMutation = trpc.certificates.duplicate.useMutation();
  const emitCertificateMutation = trpc.certificates.updateStatus.useMutation();
  const sendToClientMutation = trpc.certificates.sendToClient.useMutation();
  const submitSignedMutation = trpc.signatures.submitSigned.useMutation();
  const utils = trpc.useUtils();

  const auditTrailQuery = trpc.signatures.getAuditTrail.useQuery(
    { certificateId: auditDialog?.certId ?? 0 },
    { enabled: !!auditDialog }
  );

  const filteredCertificates = useMemo(() => {
    let result = certificatesQuery.data || [];

    if (searchTerm) {
      result = result.filter(
        (cert) =>
          cert.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cert.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((cert) => cert.status === statusFilter);
    }

    if (sortBy === "date") {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      result = [...result].sort((a, b) => a.clientName.localeCompare(b.clientName));
    }

    return result;
  }, [certificatesQuery.data, searchTerm, statusFilter, sortBy]);

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este certificado?")) {
      try {
        await deleteCertificateMutation.mutateAsync({ id });
        toast.success("Certificado eliminado");
        certificatesQuery.refetch();
      } catch {
        toast.error("Error al eliminar el certificado");
      }
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateCertificateMutation.mutateAsync({ id });
      toast.success("Certificado duplicado");
      certificatesQuery.refetch();
    } catch {
      toast.error("Error al duplicar el certificado");
    }
  };

  const handleEmit = async (id: number) => {
    const key = `emit-${id}`;
    setLoadingAction(key);
    try {
      await emitCertificateMutation.mutateAsync({ id, status: "issued" });
      toast.success("Certificado emitido correctamente");
      certificatesQuery.refetch();
    } catch {
      toast.error("Error al emitir el certificado");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendToClient = async (id: number) => {
    const key = `email-${id}`;
    setLoadingAction(key);
    try {
      await sendToClientMutation.mutateAsync({ id });
      toast.success("Certificado enviado al cliente por email");
    } catch (e: any) {
      const msg = e?.message?.includes("email") ? "El cliente no tiene email registrado" : "Error al enviar el email";
      toast.error(msg);
    } finally {
      setLoadingAction(null);
    }
  };


  const handleSignWithDNIe = async (id: number) => {
    const key = `sign-${id}`;
    setLoadingAction(key);
    try {
      const status = checkAutoFirmaStatus();
      setAutoFirmaAvailable(status === 'available');

      if (status === 'script_not_loaded') {
        toast.error("autoscript.js no encontrado. Consulta la guía de instalación.", {
          description: "Descarga autoscript.js del repositorio oficial y colócalo en client/public/afirma/js/",
          action: { label: "Repositorio", onClick: () => window.open(AUTOFIRMA_SCRIPT_REPO, "_blank") },
          duration: 12000,
        });
        return;
      }

      if (status === 'not_initialized') {
        initAutoFirma();
        toast.info("Inicializando AutoFirma, inténtalo de nuevo en un momento...");
        return;
      }

      // Obtener el certificado como HTML en Base64
      const certResult = await utils.pdf.generateFromCertificateId.fetch({ id });
      const dataB64 = btoa(unescape(encodeURIComponent(certResult.html)));

      toast.info("AutoFirma abierto — selecciona tu certificado e introduce el PIN");
      const signed = await signWithAutoFirma(dataB64);

      // Enviar al backend
      await submitSignedMutation.mutateAsync({
        certificateId: id,
        signedPdfBase64: signed.signatureB64,
        certificateBase64: signed.signatureB64,
        originalPdfBase64: dataB64,
        userAgent: navigator.userAgent,
      });

      toast.success("Certificado firmado electrónicamente");
      certificatesQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al firmar el certificado");
    } finally {
      setLoadingAction(null);
    }
  };


  const handleDownloadPackage = async (id: number, certNumber?: string | null) => {
    const key = `package-${id}`;
    setLoadingAction(key);
    try {
      const result = await utils.export.certificatePackage.fetch({ id });
      const byteCharacters = atob(result.file);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName || `certia-package-${certNumber ?? id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Paquete ZIP descargado correctamente");
    } catch {
      toast.error("Error al generar el paquete ZIP");
    } finally {
      setLoadingAction(null);
    }
  };

  const stats = useMemo(() => {
    const data = certificatesQuery.data || [];
    return {
      total: data.length,
      draft: data.filter((c) => c.status === "draft").length,
      issued: data.filter((c) => c.status === "issued").length,
      signed: data.filter((c) => c.status === "signed").length,
    };
  }, [certificatesQuery.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Certificados</h1>
            <p className="text-gray-600 mt-1">Gestiona todos tus certificados de instalación</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setLocation("/dashboard/certificates/new")}>+ Nuevo Certificado</Button>
        </div>

        {/* Ciclo de vida */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700 mb-2">Ciclo de vida de un certificado</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className="bg-yellow-100 text-yellow-800">Borrador</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-blue-100 text-blue-800">Emitido</Badge>
                <span className="text-gray-400 text-xs">(acción del instalador)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-orange-100 text-orange-800">Presentado</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-purple-100 text-purple-800">Registrado</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-green-100 text-green-800">Firmado</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-gray-100 text-gray-800">Archivado</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Los estados a partir de <strong>Presentado</strong> serán actualizados automáticamente según las comunicaciones de la Consejería de tu Comunidad Autónoma (pendiente de integración).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-gray-600 text-sm mt-1">Total de Certificados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.draft}</div>
              <p className="text-gray-600 text-sm mt-1">Borradores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.issued}</div>
              <p className="text-gray-600 text-sm mt-1">Emitidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.signed}</div>
              <p className="text-gray-600 text-sm mt-1">Firmados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente o número de certificado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borradores</SelectItem>
                <SelectItem value="issued">Emitidos</SelectItem>
                <SelectItem value="submitted">Presentados</SelectItem>
                <SelectItem value="registered">Registrados</SelectItem>
                <SelectItem value="signed">Firmados</SelectItem>
                <SelectItem value="archived">Archivados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Más recientes</SelectItem>
                <SelectItem value="name">Por cliente (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de certificados */}
      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-gray-500 text-lg">
              No hay certificados que coincidan con tu búsqueda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{cert.clientName}</p>
                      {cert.certificateNumber && (
                        <p className="text-sm text-gray-500">{cert.certificateNumber}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cert.installationType}</td>
                  <td className="px-6 py-4">
                    <Badge className={STATUS_COLORS[cert.status as CertificateStatus]}>
                      {STATUS_LABELS[cert.status as CertificateStatus]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(cert.createdAt), "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/pdf/${cert.id}`, "_blank")}
                        title="Ver CIE y guardar como PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPackage(cert.id, cert.certificateNumber)}
                        disabled={loadingAction === `package-${cert.id}`}
                        title="Descargar todos los documentos (ZIP)"
                      >
                        {loadingAction === `package-${cert.id}`
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Download className="w-4 h-4" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUnifilarDialog({ certId: cert.id, certNumber: cert.certificateNumber ?? null })}
                        title="Ver esquema unifilar"
                      >
                        <Network className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendToClient(cert.id)}
                        disabled={loadingAction === `email-${cert.id}`}
                        title="Enviar por email al cliente"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSignWithDNIe(cert.id)}
                        disabled={loadingAction === `sign-${cert.id}`}
                        title={cert.status === 'signed' ? 'Certificado ya firmado' : 'Firmar con DNIe (eIDAS)'}
                        className={cert.status === 'signed' ? 'text-green-600' : ''}
                      >
                        {cert.status === 'signed'
                          ? <ShieldCheck className="w-4 h-4" />
                          : <Shield className="w-4 h-4" />
                        }
                      </Button>
                      {cert.status === 'signed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAuditDialog({ certId: cert.id, certNumber: cert.certificateNumber ?? String(cert.id) })}
                          title="Ver evidencias de firma"
                          className="text-blue-600"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </Button>
                      )}
                      {cert.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEmit(cert.id)}
                          disabled={loadingAction === `emit-${cert.id}`}
                          title="Emitir certificado"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <SendHorizonal className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(cert.id)}
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar certificado"
                        onClick={() => setLocation(`/dashboard/certificates/${cert.id}`)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cert.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* Modal Audit Trail de firma */}
      <Dialog open={!!auditDialog} onOpenChange={(open) => !open && setAuditDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Evidencias de firma — {auditDialog?.certNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {auditTrailQuery.isPending && <p className="text-gray-400">Cargando evidencias...</p>}
            {auditTrailQuery.data?.length === 0 && (
              <p className="text-gray-500">No hay evidencias registradas para este certificado.</p>
            )}
            {auditTrailQuery.data?.map((record) => (
              <div key={record.id} className="border rounded-lg p-3 space-y-1 bg-gray-50">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Firmado por</span>
                    <p className="font-semibold">{record.signerName}</p>
                  </div>
                  {record.signerNif && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase">NIF</span>
                      <p>{record.signerNif}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-500 uppercase">CA emisora</span>
                    <p className="text-xs">{record.signerCertIssuer ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Cert. válido hasta</span>
                    <p className="text-xs">
                      {record.signerCertNotAfter
                        ? new Date(record.signerCertNotAfter).toLocaleDateString('es-ES')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Fecha de firma</span>
                    <p>{new Date(record.signedAt).toLocaleString('es-ES')}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">IP firmante</span>
                    <p>{record.clientIp}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 uppercase">Sello de tiempo</span>
                    <p className={record.timestampTime ? 'text-green-600' : 'text-amber-600'}>
                      {record.timestampTime
                        ? `✓ ${record.tsaUrl} — ${new Date(record.timestampTime).toLocaleString('es-ES')}`
                        : '⚠ Sin sello de tiempo (PAdES-B)'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 uppercase">Hash del documento original</span>
                    <p className="font-mono text-xs break-all text-gray-600">{record.documentHash}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Esquema Unifilar */}
      <Dialog open={!!unifilarDialog} onOpenChange={(open) => !open && setUnifilarDialog(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              Esquema Unifilar — {unifilarDialog?.certNumber ?? `Certificado #${unifilarDialog?.certId}`}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 -mt-2 mb-2">Pasa el cursor sobre cada circuito para ver sus datos</p>
          {unifilarDialog && (
            <UnifilarDiagramFromId certificateId={unifilarDialog.certId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
