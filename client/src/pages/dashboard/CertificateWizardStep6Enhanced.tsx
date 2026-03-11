import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { UnifilarDiagramFromSVG } from "@/components/UnifilarDiagram";

interface Circuit {
  circuitNumber: string;
  circuitName: string;
  installedPower: number;
  cableSection: string;
  mcbRating: number;
  rcdRequired: boolean;
}

interface Step6Props {
  formData: {
    clientId?: number;
    newClient?: { name?: string; dniNif?: string };
    installationId?: number;
    newInstallation?: { name?: string; address?: string; city?: string; province?: string; postalCode?: string };
    installationType: string;
    supplyVoltage: number;
    installedPower: number;
    phases: number;
    groundingSystem?: string;
    diLength: string;
    diCableSection: string;
    boardLocation: string;
    igaRating: number;
    idSensitivity: number;
    earthResistance: string;
    circuits: Circuit[];
    insulationResistance: string;
    continuityContinuity: string;
    rcdTestCurrent: number;
    rcdTestTime: number;
    observations: string;
  };
  clients?: any[];
  installations?: any[];
}

export default function Step6Enhanced({ formData, clients, installations }: Step6Props) {
  const [pdfHtml, setPdfHtml] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [unifilarRequested, setUnifilarRequested] = useState(false);

  const client = clients?.find((c) => c.id === formData.clientId);
  const installation = installations?.find((i) => i.id === formData.installationId);

  const generatePdfQuery = trpc.pdf.generateCertificate.useQuery(
    {
      certificateId: 0,
      clientName: client?.name || formData.newClient?.name || "-",
      clientDni: client?.dniNif || formData.newClient?.dniNif,
      clientAddress: client?.address,
      clientPhone: client?.phone,
      installationType: formData.installationType,
      installationAddress: installation?.address || formData.newInstallation?.address || "-",
      installationCity: installation?.city || formData.newInstallation?.city,
      installationProvince: installation?.province || formData.newInstallation?.province,
      postalCode: installation?.postalCode || formData.newInstallation?.postalCode,
      cadastralReference: installation?.cadastralReference,
      cups: installation?.cups,
      supplyVoltage: formData.supplyVoltage,
      supplyPhases: formData.phases,
      installedPower: formData.installedPower,
      mainSwitchRating: formData.igaRating,
      mainRcdRating: formData.idSensitivity,
      earthResistance: parseFloat(formData.earthResistance) || 0,
      diLength: parseFloat(formData.diLength) || 0,
      diCableSection: parseFloat(formData.diCableSection) || 0,
      diCableMaterial: "Cu",
      insulationResistance: parseFloat(formData.insulationResistance) || 0,
      continuityContinuity: parseFloat(formData.continuityContinuity) || 0,
      rcdTestCurrent: formData.rcdTestCurrent,
      rcdTestTime: formData.rcdTestTime,
      observations: formData.observations,
      circuits: formData.circuits.map((c) => ({
        circuitNumber: c.circuitNumber,
        circuitName: c.circuitName,
        installedPower: c.installedPower,
        cableSection: parseFloat(c.cableSection),
        mcbRating: c.mcbRating,
        rcdRequired: c.rcdRequired,
      })),
    },
    { enabled: false }
  );

  const unifilarQuery = trpc.ai.generateDiagram.useQuery(
    {
      installationType: formData.installationType,
      supplyVoltage: formData.supplyVoltage,
      supplyPhases: formData.phases,
      groundingSystem: formData.groundingSystem ?? "TT",
      mainSwitchRating: formData.igaRating,
      mainRcdRating: formData.idSensitivity,
      circuits: formData.circuits.map((c) => ({
        circuitNumber: c.circuitNumber,
        circuitName: c.circuitName,
        installedPower: c.installedPower,
        cableSection: parseFloat(c.cableSection),
        mcbRating: c.mcbRating,
        rcdRequired: c.rcdRequired,
      })),
    },
    { enabled: unifilarRequested }
  );

  const handleGeneratePdf = async () => {
    try {
      const result = await generatePdfQuery.refetch();
      if (result.data?.html) {
        setPdfHtml(result.data.html);
        setActiveTab("pdf");
        toast.success("PDF generado");
      }
    } catch {
      toast.error("Error al generar PDF");
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfHtml) {
      toast.error("Genera el PDF primero");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([pdfHtml], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = `certificado-${Date.now()}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Descargando certificado...");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="pdf">Certificado</TabsTrigger>
          <TabsTrigger value="checklist">Verificación</TabsTrigger>
          <TabsTrigger value="unifilar">Unifilar</TabsTrigger>
        </TabsList>

        {/* TAB 1: RESUMEN */}
        <TabsContent value="summary" className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Resumen del Certificado</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cliente</p>
                <p className="font-semibold">{client?.name || formData.newClient?.name}</p>
                <p className="text-sm text-gray-500">{client?.dniNif || formData.newClient?.dniNif}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Instalación</p>
                <p className="font-semibold">{installation?.name || formData.newInstallation?.name}</p>
                <p className="text-sm text-gray-500">{installation?.address || formData.newInstallation?.address}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Datos Técnicos</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tipo de instalación</p>
                <p className="font-semibold">{formData.installationType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tensión</p>
                <p className="font-semibold">
                  {formData.supplyVoltage}V {formData.phases === 1 ? "Monofásico" : "Trifásico"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Potencia instalada</p>
                <p className="font-semibold">{formData.installedPower}W</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Protecciones Generales</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">IGA</p>
                <p className="font-semibold">{formData.igaRating}A</p>
              </div>
              <div>
                <p className="text-gray-600">Diferencial</p>
                <p className="font-semibold">{formData.idSensitivity}mA</p>
              </div>
              <div>
                <p className="text-gray-600">Tierra</p>
                <p className="font-semibold">{formData.earthResistance}Ω</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Circuitos ({formData.circuits.length})
            </h3>
            <div className="space-y-2">
              {formData.circuits.map((circuit) => (
                <div
                  key={circuit.circuitNumber}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {circuit.circuitNumber} - {circuit.circuitName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {circuit.installedPower}W · {circuit.cableSection}mm² · {circuit.mcbRating}A
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-900">
              Revisa todos los datos antes de generar el certificado. Una vez creado, podrás editar
              la mayoría de campos.
            </p>
          </div>
        </TabsContent>

        {/* TAB 2: CERTIFICADO PDF */}
        <TabsContent value="pdf" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Certificado de Instalación</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleGeneratePdf}
                disabled={generatePdfQuery.isPending}
                size="sm"
                variant="outline"
              >
                {generatePdfQuery.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generar PDF
                  </>
                )}
              </Button>
              {pdfHtml && (
                <Button
                  onClick={handleDownloadPdf}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              )}
            </div>
          </div>

          {pdfHtml ? (
            <Card>
              <CardContent className="pt-6">
                <div className="border rounded-lg p-4 bg-white max-h-96 overflow-auto">
                  <iframe
                    srcDoc={pdfHtml}
                    className="w-full h-96 border-0"
                    title="Certificado PDF"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500">
                  <p>Haz clic en "Generar PDF" para crear el certificado</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 3: VERIFICACIÓN */}
        <TabsContent value="checklist" className="space-y-4">
          <h3 className="font-semibold text-gray-900 mb-4">Lista de Verificación</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={!!formData.clientId || !!formData.newClient?.name}
                readOnly
                className="w-4 h-4"
              />
              <span
                className={
                  formData.clientId || formData.newClient?.name ? "text-green-700" : "text-gray-600"
                }
              >
                Cliente seleccionado o creado
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={!!formData.installationId || !!formData.newInstallation?.name}
                readOnly
                className="w-4 h-4"
              />
              <span
                className={
                  formData.installationId || formData.newInstallation?.name
                    ? "text-green-700"
                    : "text-gray-600"
                }
              >
                Instalación seleccionada o creada
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={formData.circuits.length > 0}
                readOnly
                className="w-4 h-4"
              />
              <span className={formData.circuits.length > 0 ? "text-green-700" : "text-gray-600"}>
                Circuitos añadidos ({formData.circuits.length})
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={!!formData.insulationResistance && !!formData.rcdTestCurrent}
                readOnly
                className="w-4 h-4"
              />
              <span
                className={
                  formData.insulationResistance && formData.rcdTestCurrent
                    ? "text-green-700"
                    : "text-gray-600"
                }
              >
                Mediciones eléctricas completadas
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <input type="checkbox" checked={!!pdfHtml} readOnly className="w-4 h-4" />
              <span className={pdfHtml ? "text-green-700" : "text-gray-600"}>
                Certificado PDF generado
              </span>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: ESQUEMA UNIFILAR */}
        <TabsContent value="unifilar" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">Esquema Unifilar</h3>
              <p className="text-xs text-gray-500 mt-0.5">Pasa el cursor sobre cada circuito para ver sus datos</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUnifilarRequested(true)}
              disabled={unifilarQuery.isFetching}
            >
              {unifilarQuery.isFetching ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" />Generar</>
              )}
            </Button>
          </div>

          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              {unifilarQuery.data?.svgContent ? (
                <UnifilarDiagramFromSVG svgContent={unifilarQuery.data.svgContent} />
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">
                  {unifilarQuery.isFetching
                    ? "Generando esquema..."
                    : "Haz clic en \"Generar\" para crear el esquema unifilar"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
