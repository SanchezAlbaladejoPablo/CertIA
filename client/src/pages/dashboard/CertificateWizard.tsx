import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const INSTALLATION_TYPES = [
  "Vivienda unifamiliar",
  "Local comercial",
  "Nave industrial",
  "Oficina",
  "Escuela/Centro educativo",
  "Hospital/Centro sanitario",
];

const CIRCUIT_TYPES = [
  "Iluminación",
  "Tomas de uso general",
  "Cocina",
  "Lavadora/Lavavajillas",
  "Calefacción",
  "Aire acondicionado",
  "Piscina",
  "Garaje",
  "Otro",
];

const CABLE_MATERIALS = ["Cu", "Al"];
const CABLE_INSULATIONS = ["PVC", "XLPE"];
const MCB_CURVES = ["B", "C", "D"];

interface CertificateFormData {
  // Step 1: Client
  clientId?: number;
  newClient?: {
    type?: "person" | "company";
    name?: string;
    dniNif?: string;
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    province?: string;
  };

  // Step 2: Installation
  installationId?: number;
  newInstallation?: {
    name?: string;
    type?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    province?: string;
    cadastralReference?: string;
    cups?: string;
  };
  installationType: string;
  locationCategory: string;
  electrificationGrade: string;
  supplyVoltage: number;
  installedPower: number;
  phases: number;

  // Step 3: Derivation & Board
  groundingSystem: string;
  ambientTemp: number;
  installMethod: string;
  groupedCables: number;
  diLength: string;
  diCableSection: string;
  diCableMaterial: "Cu" | "Al";
  diCableInsulation: string;
  boardLocation: string;
  igaRating: number;
  idSensitivity: number;
  overvoltageProtection: boolean;
  earthResistance: string;

  // Step 4: Circuits
  circuits: Array<{
    id?: string;
    circuitNumber: string;
    circuitName: string;
    circuitType: string;
    installedPower: number;
    length: string;
    cableSection: string;
    cableMaterial: string;
    cableInsulation: string;
    cableCores: number;
    mcbRating: number;
    mcbCurve: string;
    rcdRequired: boolean;
    rcdRating: number;
    loadDescription: string;
  }>;

  // Step 5: Measurements
  insulationResistance: string;
  continuityContinuity: string;
  rcdTestCurrent: number;
  rcdTestTime: number;
  observations: string;
}

const STEPS = [
  { id: 1, name: "Cliente", description: "Selecciona o crea un cliente" },
  { id: 2, name: "Instalación", description: "Datos de la instalación" },
  { id: 3, name: "Derivación", description: "Derivación individual y cuadro" },
  { id: 4, name: "Circuitos", description: "Circuitos de la instalación" },
  { id: 5, name: "Mediciones", description: "Pruebas eléctricas" },
  { id: 6, name: "Revisión", description: "Revisar y confirmar" },
];

const EMPTY_FORM: CertificateFormData = {
  installationType: "",
  locationCategory: "Seco",
  electrificationGrade: "Básico",
  supplyVoltage: 230,
  installedPower: 0,
  phases: 1,
  groundingSystem: "TT",
  ambientTemp: 30,
  installMethod: "embedded_conduit",
  groupedCables: 1,
  diLength: "",
  diCableSection: "",
  diCableMaterial: "Cu",
  diCableInsulation: "PVC",
  boardLocation: "",
  igaRating: 0,
  idSensitivity: 30,
  overvoltageProtection: false,
  earthResistance: "",
  circuits: [],
  insulationResistance: "",
  continuityContinuity: "",
  rcdTestCurrent: 0,
  rcdTestTime: 0,
  observations: "",
};

export default function CertificateWizard() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const editId = params?.id ? parseInt(params.id) : null;
  const isEditing = !!editId;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CertificateFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: profile } = trpc.profile.get.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const createClientMutation = trpc.clients.create.useMutation();
  const { data: installations } = trpc.installations.list.useQuery();
  const createInstallationMutation = trpc.installations.create.useMutation();
  const createCertificateMutation = trpc.certificates.create.useMutation();
  const updateCertificateMutation = trpc.certificates.update.useMutation();
  const createCircuitMutation = trpc.circuits.create.useMutation();

  // Carga de datos para modo edición
  const { data: existingCert } = trpc.certificates.get.useQuery(
    { id: editId! },
    { enabled: isEditing }
  );
  const { data: existingCircuits } = trpc.circuits.listByCertificate.useQuery(
    { certificateId: editId! },
    { enabled: isEditing }
  );

  // Pre-popula el formulario al editar
  useEffect(() => {
    if (!existingCert) return;
    setFormData(prev => ({
      ...prev,
      clientId: existingCert.clientId,
      installationId: existingCert.installationId,
      installationType: existingCert.installationType || "",
      locationCategory: (existingCert as any).locationCategory || "Seco",
      electrificationGrade: (existingCert as any).electrificationGrade || "Básico",
      groundingSystem: (existingCert as any).groundingSystem || "TT",
      ambientTemp: (existingCert as any).ambientTemp ?? 30,
      installMethod: (existingCert as any).installMethod || "embedded_conduit",
      groupedCables: (existingCert as any).groupedCables ?? 1,
      supplyVoltage: existingCert.supplyVoltage ?? 230,
      installedPower: existingCert.installedPower ?? 0,
      phases: existingCert.phases ?? 1,
      diLength: existingCert.diLength || "",
      diCableSection: existingCert.diCableSection || "",
      diCableMaterial: (existingCert.diCableMaterial as "Cu" | "Al") || "Cu",
      diCableInsulation: existingCert.diCableInsulation || "PVC",
      boardLocation: existingCert.boardLocation || "",
      igaRating: existingCert.igaRating ?? 0,
      idSensitivity: existingCert.idSensitivity ?? 30,
      overvoltageProtection: existingCert.overvoltageProtection ?? false,
      earthResistance: existingCert.earthResistance || "",
      insulationResistance: existingCert.insulationResistance || "",
      continuityContinuity: existingCert.continuityContinuity || "",
      rcdTestCurrent: existingCert.rcdTestCurrent ?? 0,
      rcdTestTime: existingCert.rcdTestTime ?? 0,
      observations: existingCert.observations || "",
    }));
  }, [existingCert]);

  useEffect(() => {
    if (!existingCircuits || existingCircuits.length === 0) return;
    setFormData(prev => ({
      ...prev,
      circuits: existingCircuits.map(c => ({
        id: String(c.id),
        circuitNumber: c.circuitNumber,
        circuitName: c.circuitName,
        circuitType: (c as any).circuitType || "",
        installedPower: (c as any).installedPower ?? (c as any).power ?? 0,
        length: String((c as any).length || ""),
        cableSection: String((c as any).cableSection || ""),
        cableMaterial: (c as any).cableMaterial || "Cu",
        cableInsulation: (c as any).cableInsulation || "PVC",
        cableCores: (c as any).cableCores ?? 2,
        mcbRating: (c as any).mcbRating ?? 0,
        mcbCurve: (c as any).mcbCurve || "C",
        rcdRequired: (c as any).rcdRequired ?? false,
        rcdRating: (c as any).rcdRating ?? 30,
        loadDescription: (c as any).loadDescription || "",
      })),
    }));
  }, [existingCircuits]);

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 1 && formData.newClient) {
      try {
        const result = await createClientMutation.mutateAsync(formData.newClient as any);
        setFormData({ ...formData, clientId: (result as any).insertId, newClient: undefined });
      } catch (error) {
        toast.error("Error al crear el cliente");
        return;
      }
    }

    if (currentStep === 2 && formData.newInstallation && formData.clientId) {
      try {
        const result = await createInstallationMutation.mutateAsync({
          clientId: formData.clientId!,
          ...formData.newInstallation,
        } as any);
        setFormData({ ...formData, installationId: (result as any).insertId, newInstallation: undefined });
      } catch (error) {
        toast.error("Error al crear la instalación");
        return;
      }
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async (status: "issued" | "draft" = "issued") => {
    if (!validateStep(6)) return;

    if (!formData.clientId || !formData.installationId) {
      toast.error("Faltan datos del cliente o instalación");
      return;
    }

    setSaving(true);
    try {
      const extendedData = {
        installationType: formData.installationType,
        locationCategory: formData.locationCategory,
        electrificationGrade: formData.electrificationGrade,
        groundingSystem: formData.groundingSystem,
        ambientTemp: formData.ambientTemp,
        installMethod: formData.installMethod,
        groupedCables: formData.groupedCables,
        supplyVoltage: formData.supplyVoltage,
        installedPower: formData.installedPower,
        phases: formData.phases,
        diLength: formData.diLength,
        diCableSection: formData.diCableSection,
        diCableMaterial: formData.diCableMaterial,
        diCableInsulation: formData.diCableInsulation,
        boardLocation: formData.boardLocation,
        igaRating: formData.igaRating,
        idSensitivity: formData.idSensitivity,
        overvoltageProtection: formData.overvoltageProtection,
        earthResistance: formData.earthResistance,
        insulationResistance: formData.insulationResistance,
        continuityContinuity: formData.continuityContinuity,
        rcdTestCurrent: formData.rcdTestCurrent,
        rcdTestTime: formData.rcdTestTime,
        observations: formData.observations,
        status,
      };

      let certId: number;

      if (isEditing && editId) {
        // Actualizar certificado existente
        await updateCertificateMutation.mutateAsync({ id: editId, ...extendedData });
        certId = editId;
      } else {
        // Crear nuevo certificado con todos los datos
        const result = await createCertificateMutation.mutateAsync({
          clientId: formData.clientId,
          installationId: formData.installationId,
          ...extendedData,
        });
        certId = (result as any).insertId;

        // Guardar circuitos
        for (const circuit of formData.circuits) {
          await createCircuitMutation.mutateAsync({
            certificateId: certId,
            circuitNumber: circuit.circuitNumber,
            circuitName: circuit.circuitName,
            circuitType: circuit.circuitType,
            installedPower: circuit.installedPower,
            length: circuit.length,
            cableSection: circuit.cableSection,
            cableMaterial: circuit.cableMaterial,
            cableInsulation: circuit.cableInsulation,
            cableCores: circuit.cableCores,
            mcbRating: circuit.mcbRating,
            mcbCurve: circuit.mcbCurve,
            rcdRequired: circuit.rcdRequired,
            rcdRating: circuit.rcdRating,
            loadDescription: circuit.loadDescription,
          });
        }
      }

      toast.success(isEditing ? "Certificado actualizado" : status === "draft" ? "Borrador guardado correctamente" : "Certificado creado correctamente");
      setLocation("/dashboard");
    } catch (error) {
      toast.error(isEditing ? "Error al actualizar el certificado" : "Error al crear el certificado");
    } finally {
      setSaving(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.clientId && !formData.newClient?.name) {
          toast.error("Selecciona o crea un cliente");
          return false;
        }
        return true;
      case 2:
        if (!formData.installationType || !formData.installedPower) {
          toast.error("Completa los datos de la instalación");
          return false;
        }
        if (!formData.installationId && !formData.newInstallation?.name) {
          toast.error("Selecciona o crea una instalación");
          return false;
        }
        return true;
      case 3:
        if (!formData.diCableSection || !formData.igaRating || !formData.earthResistance) {
          toast.error("Completa los datos de la derivación y cuadro");
          return false;
        }
        return true;
      case 4:
        if (formData.circuits.length === 0) {
          toast.error("Añade al menos un circuito");
          return false;
        }
        return true;
      case 5:
        if (!formData.insulationResistance || !formData.rcdTestCurrent) {
          toast.error("Completa las mediciones eléctricas");
          return false;
        }
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? "Editar Certificado" : "Nuevo Certificado"}
          </h1>
          <p className="text-gray-600 mt-1">Paso {currentStep} de {STEPS.length}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <Progress value={progress} className="h-2" />
        <div className="grid grid-cols-6 gap-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`text-center py-2 px-2 rounded-lg transition-colors ${
                step.id === currentStep
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : step.id < currentStep
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <div className="text-xs font-bold">{step.id}</div>
              <div className="text-xs hidden sm:block">{step.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && <Step1Client formData={formData} setFormData={setFormData} clients={clients} />}
          {currentStep === 2 && <Step2Installation formData={formData} setFormData={setFormData} installations={installations} />}
          {currentStep === 3 && <Step3Derivation formData={formData} setFormData={setFormData} />}
          {currentStep === 4 && <Step4Circuits formData={formData} setFormData={setFormData} />}
          {currentStep === 5 && <Step5Measurements formData={formData} setFormData={setFormData} />}
          {currentStep === 6 && <Step6Review formData={formData} clients={clients} installations={installations} profile={profile} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        {currentStep === STEPS.length ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleFinish("draft")}
              disabled={saving}
            >
              Guardar borrador
            </Button>
            <Button
              onClick={() => handleFinish()}
              className="bg-green-600 hover:bg-green-700"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? "Guardando..." : "Creando..."}
                </>
              ) : (
                isEditing ? "Guardar Cambios" : "Crear Certificado"
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={createClientMutation.isPending || createInstallationMutation.isPending}
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Client Selection
function Step1Client({
  formData,
  setFormData,
  clients,
}: {
  formData: CertificateFormData;
  setFormData: (data: CertificateFormData) => void;
  clients?: any[];
}) {
  const [useExisting, setUseExisting] = useState(true);

  return (
    <div className="space-y-6">
      {/* FASE 5.1: Cargar plantilla */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={useExisting}
            onChange={() => setUseExisting(true)}
            className="w-4 h-4"
          />
          <span>Cliente existente</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!useExisting}
            onChange={() => setUseExisting(false)}
            className="w-4 h-4"
          />
          <span>Nuevo cliente</span>
        </label>
      </div>

      {useExisting ? (
        <div>
          <Label>Selecciona un cliente</Label>
          <Select
            value={formData.clientId?.toString() || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, clientId: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name} ({client.dniNif || "Sin DNI"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select
              value={formData.newClient?.type || "person"}
              onValueChange={(value: any) =>
                setFormData({
                  ...formData,
                  newClient: { ...formData.newClient, type: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Persona física</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nombre / Razón social *</Label>
            <Input
              value={formData.newClient?.name || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newClient: { ...formData.newClient, name: e.target.value },
                })
              }
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <Label>DNI / NIF</Label>
            <Input
              value={formData.newClient?.dniNif || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newClient: { ...formData.newClient, dniNif: e.target.value },
                })
              }
              placeholder="12345678A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.newClient?.email || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newClient: { ...formData.newClient, email: e.target.value },
                  })
                }
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.newClient?.phone || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newClient: { ...formData.newClient, phone: e.target.value },
                  })
                }
                placeholder="+34 600 000 000"
              />
            </div>
          </div>

          <div>
            <Label>Dirección</Label>
            <Input
              value={formData.newClient?.address || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newClient: { ...formData.newClient, address: e.target.value },
                })
              }
              placeholder="C/ Mayor 23"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Código postal</Label>
              <Input
                value={formData.newClient?.postalCode || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newClient: { ...formData.newClient, postalCode: e.target.value },
                  })
                }
                placeholder="28001"
              />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input
                value={formData.newClient?.city || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newClient: { ...formData.newClient, city: e.target.value },
                  })
                }
                placeholder="Madrid"
              />
            </div>
            <div>
              <Label>Provincia</Label>
              <Input
                value={formData.newClient?.province || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newClient: { ...formData.newClient, province: e.target.value },
                  })
                }
                placeholder="Madrid"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 2: Installation
function Step2Installation({
  formData,
  setFormData,
  installations,
}: {
  formData: CertificateFormData;
  setFormData: (data: CertificateFormData) => void;
  installations?: any[];
}) {
  const [useExisting, setUseExisting] = useState(true);

  const address = formData.newInstallation?.address ?? "";
  const city = formData.newInstallation?.city ?? "";
  const province = formData.newInstallation?.province ?? "";
  const hasCadastralRef = !!(formData.newInstallation?.cadastralReference?.trim());
  const cadastreEnabled = address.length >= 5 && city.length >= 2 && province.length >= 2 && !hasCadastralRef;

  const cadastreQuery = trpc.cadastre.search.useQuery(
    { address, city, province },
    { enabled: cadastreEnabled }
  );

  // Auto-fill the cadastral reference when found
  if (cadastreQuery.data?.found && cadastreQuery.data.reference && !hasCadastralRef) {
    setFormData({
      ...formData,
      newInstallation: { ...formData.newInstallation, cadastralReference: cadastreQuery.data.reference },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={useExisting}
            onChange={() => setUseExisting(true)}
            className="w-4 h-4"
          />
          <span>Instalación existente</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!useExisting}
            onChange={() => setUseExisting(false)}
            className="w-4 h-4"
          />
          <span>Nueva instalación</span>
        </label>
      </div>

      {useExisting ? (
        <div>
          <Label>Selecciona una instalación</Label>
          <Select
            value={formData.installationId?.toString() || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, installationId: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una instalación" />
            </SelectTrigger>
            <SelectContent>
              {installations?.map((inst) => (
                <SelectItem key={inst.id} value={inst.id.toString()}>
                  {inst.name} ({inst.address || "Sin dirección"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Nombre de la instalación *</Label>
            <Input
              value={formData.newInstallation?.name || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newInstallation: { ...formData.newInstallation, name: e.target.value },
                })
              }
              placeholder="Vivienda Principal"
            />
          </div>

          <div>
            <Label>Dirección</Label>
            <Input
              value={formData.newInstallation?.address || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newInstallation: { ...formData.newInstallation, address: e.target.value },
                })
              }
              placeholder="C/ Mayor 23"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Código postal</Label>
              <Input
                value={formData.newInstallation?.postalCode || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newInstallation: { ...formData.newInstallation, postalCode: e.target.value },
                  })
                }
                placeholder="28001"
              />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input
                value={formData.newInstallation?.city || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newInstallation: { ...formData.newInstallation, city: e.target.value },
                  })
                }
                placeholder="Madrid"
              />
            </div>
            <div>
              <Label>Provincia</Label>
              <Input
                value={formData.newInstallation?.province || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newInstallation: { ...formData.newInstallation, province: e.target.value },
                  })
                }
                placeholder="Madrid"
              />
            </div>
          </div>

          <div>
            <Label>Referencia catastral</Label>
            <div className="relative">
              <Input
                value={formData.newInstallation?.cadastralReference || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newInstallation: { ...formData.newInstallation, cadastralReference: e.target.value },
                  })
                }
                placeholder="Ej: 2823901TF3H5001S"
                className={cadastreQuery.isFetching ? "pr-10" : ""}
              />
              {cadastreQuery.isFetching && (
                <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            {cadastreEnabled && !cadastreQuery.isFetching && cadastreQuery.data && !cadastreQuery.data.found && (
              <p className="text-xs text-amber-600 mt-1">{cadastreQuery.data.error} — puedes introducirla manualmente</p>
            )}
            {hasCadastralRef && cadastreQuery.data?.found && (
              <p className="text-xs text-green-600 mt-1">Referencia obtenida automáticamente del Catastro</p>
            )}
          </div>

          <div>
            <Label>CUPS</Label>
            <Input
              value={formData.newInstallation?.cups || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newInstallation: { ...formData.newInstallation, cups: e.target.value },
                })
              }
              placeholder="Ej: ES0021000012345678AB"
            />
          </div>
        </div>
      )}

      <div className="border-t pt-6 space-y-4">
        <div>
          <Label>Tipo de instalación *</Label>
          <Select
            value={formData.installationType}
            onValueChange={(value) =>
              setFormData({ ...formData, installationType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {INSTALLATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Clasificación del local</h3>

        <div>
          <Label>Tipo de local (ITC-BT-30) *</Label>
          <Select
            value={formData.locationCategory}
            onValueChange={(value) =>
              setFormData({ ...formData, locationCategory: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona clasificación" />
            </SelectTrigger>
            <SelectContent>
              {["Seco", "Húmedo", "Mojado", "Con riesgo de corrosión", "Polvoriento", "Con riesgo de incendio", "Con riesgo de explosión"].map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Datos de suministro</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tensión de suministro *</Label>
            <Select
              value={formData.supplyVoltage.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, supplyVoltage: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="230">230V Monofásico</SelectItem>
                <SelectItem value="400">400V Trifásico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fases *</Label>
            <Select
              value={formData.phases.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, phases: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Monofásico (1)</SelectItem>
                <SelectItem value="3">Trifásico (3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Potencia instalada (W) *</Label>
          <Input
            type="number"
            value={formData.installedPower}
            onChange={(e) => {
              const power = parseInt(e.target.value) || 0;
              const grade = formData.installationType === "Vivienda unifamiliar" && power > 5750 ? "Elevado" : "Básico";
              setFormData({ ...formData, installedPower: power, electrificationGrade: grade });
            }}
            placeholder="9200"
          />
        </div>

        {formData.installationType === "Vivienda unifamiliar" && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Grado de electrificación (ITC-BT-25):</strong>{" "}
              {formData.electrificationGrade}{" "}
              <span className="text-blue-600">
                {formData.electrificationGrade === "Elevado"
                  ? "— más de 5.750W (mínimo 5 circuitos + adicionales)"
                  : "— hasta 5.750W (mínimo 5 circuitos obligatorios)"}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 3: Derivation & Board
function Step3Derivation({
  formData,
  setFormData,
}: {
  formData: CertificateFormData;
  setFormData: (data: CertificateFormData) => void;
}) {
  // 4.1 — Autocálculo IGA desde potencia instalada
  const igaQuery = trpc.calculations.mainSwitch.useQuery(
    { installedPower: formData.installedPower, phases: formData.phases },
    { enabled: formData.installedPower > 0 }
  );
  useEffect(() => {
    if (igaQuery.data && !formData.igaRating) {
      setFormData({ ...formData, igaRating: igaQuery.data });
    }
  }, [igaQuery.data]);

  // 4.2 — Autocálculo sección DI (maxVoltageDrop: 1% — ITC-BT-15)
  const diSectionQuery = trpc.calculations.cableSection.useQuery(
    {
      power: formData.installedPower,
      voltage: formData.supplyVoltage,
      phases: formData.phases,
      length: parseFloat(formData.diLength) || 0,
      material: formData.diCableMaterial,
      maxVoltageDrop: 1, // ITC-BT-15: límite DI = 1%
      insulation: formData.diCableInsulation as 'PVC' | 'XLPE',
      ambientTemp: formData.ambientTemp,
      groupedCables: formData.groupedCables,
      installMethod: formData.installMethod,
    },
    { enabled: formData.installedPower > 0 && parseFloat(formData.diLength) > 0 }
  );

  // 4.4 — Rt máxima (ITC-BT-18/24): Rt_max = 50 / (Idn_A)
  const rtMax = formData.idSensitivity > 0
    ? Math.round((50 / (formData.idSensitivity / 1000)) * 10) / 10
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Derivación Individual (DI)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Longitud (m) *</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.diLength}
                onChange={(e) =>
                  setFormData({ ...formData, diLength: e.target.value })
                }
                placeholder="15"
              />
            </div>
            <div>
              <Label>Sección (mm²) *</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.diCableSection}
                onChange={(e) =>
                  setFormData({ ...formData, diCableSection: e.target.value })
                }
                placeholder="6"
              />
              {diSectionQuery.data && parseFloat(formData.diLength) > 0 && (
                <p className="text-xs text-blue-700 mt-1">
                  Mínimo recomendado: <strong>{diSectionQuery.data.recommendedSection} mm²</strong>
                  {" "}(ΔU={diSectionQuery.data.voltageDrop}%, Iz={diSectionQuery.data.izCorrected}A)
                  {" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setFormData({ ...formData, diCableSection: String(diSectionQuery.data!.recommendedSection) })}
                  >Usar</button>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Material *</Label>
              <Select
                value={formData.diCableMaterial}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, diCableMaterial: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CABLE_MATERIALS.map((mat) => (
                    <SelectItem key={mat} value={mat}>
                      {mat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aislamiento *</Label>
              <Select
                value={formData.diCableInsulation}
                onValueChange={(value) =>
                  setFormData({ ...formData, diCableInsulation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CABLE_INSULATIONS.map((ins) => (
                    <SelectItem key={ins} value={ins}>
                      {ins}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Cuadro de Distribución</h3>
        <div className="space-y-4">
          <div>
            <Label>Sistema de puesta a tierra (ITC-BT-08) *</Label>
            <Select
              value={formData.groundingSystem}
              onValueChange={(value) =>
                setFormData({ ...formData, groundingSystem: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TT">TT — Neutro del transformador a tierra, masas a tierra local (viviendas)</SelectItem>
                <SelectItem value="TN-S">TN-S — Conductor de neutro y protección separados</SelectItem>
                <SelectItem value="TN-C">TN-C — Conductor PEN combinado</SelectItem>
                <SelectItem value="TN-C-S">TN-C-S — Combinado PEN parcial</SelectItem>
                <SelectItem value="IT">IT — Neutro aislado de tierra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ubicación del cuadro</Label>
            <Input
              value={formData.boardLocation}
              onChange={(e) =>
                setFormData({ ...formData, boardLocation: e.target.value })
              }
              placeholder="Pasillo entrada"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Intensidad IGA (A) *</Label>
              <Input
                type="number"
                value={formData.igaRating}
                onChange={(e) =>
                  setFormData({ ...formData, igaRating: parseInt(e.target.value) || 0 })
                }
                placeholder="40"
              />
              {igaQuery.data && (
                <p className="text-xs text-blue-700 mt-1">
                  Sugerido: <strong>{igaQuery.data}A</strong>
                  {formData.igaRating !== igaQuery.data && (
                    <> — <button type="button" className="underline" onClick={() => setFormData({ ...formData, igaRating: igaQuery.data! })}>Usar</button></>
                  )}
                </p>
              )}
            </div>
            <div>
              <Label>Sensibilidad ID (mA) *</Label>
              <Select
                value={formData.idSensitivity.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, idSensitivity: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 mA</SelectItem>
                  <SelectItem value="300">300 mA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.overvoltageProtection}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, overvoltageProtection: checked as boolean })
              }
            />
            <Label>Protector de sobretensiones</Label>
          </div>

          <div>
            <Label>Resistencia de tierra (Ω) *</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.earthResistance}
              onChange={(e) =>
                setFormData({ ...formData, earthResistance: e.target.value })
              }
              placeholder="25"
            />
            {/* 4.4 — Rt máxima según sensibilidad diferencial (ITC-BT-18/24) */}
            {rtMax !== null && (
              <p className={`text-xs mt-1 ${parseFloat(formData.earthResistance) > rtMax ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
                Límite máximo: {rtMax.toLocaleString()} Ω (Rt ≤ 50V / Idn)
                {parseFloat(formData.earthResistance) > rtMax && <span> — ⚠ Excedido</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-1">Condiciones de instalación</h3>
        <p className="text-sm text-gray-500 mb-4">Factores de corrección de intensidad admisible (ITC-BT-19)</p>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Temperatura ambiente (°C)</Label>
              <Select
                value={formData.ambientTemp.toString()}
                onValueChange={(v) => setFormData({ ...formData, ambientTemp: parseInt(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[25, 30, 35, 40, 45, 50].map(t => (
                    <SelectItem key={t} value={t.toString()}>{t}°C{t === 30 ? " (estándar)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cables agrupados</Label>
              <Select
                value={formData.groupedCables.toString()}
                onValueChange={(v) => setFormData({ ...formData, groupedCables: parseInt(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 cable (kg=1.00)</SelectItem>
                  <SelectItem value="2">2 cables (kg=0.80)</SelectItem>
                  <SelectItem value="3">3 cables (kg=0.70)</SelectItem>
                  <SelectItem value="4">4 cables (kg=0.65)</SelectItem>
                  <SelectItem value="5">5 cables (kg=0.60)</SelectItem>
                  <SelectItem value="6">6 cables (kg=0.57)</SelectItem>
                  <SelectItem value="9">7–9 cables (kg=0.54)</SelectItem>
                  <SelectItem value="12">10–12 cables (kg=0.50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Método de instalación</Label>
              <Select
                value={formData.installMethod}
                onValueChange={(v) => setFormData({ ...formData, installMethod: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="air">Al aire libre (ki=1.00)</SelectItem>
                  <SelectItem value="surface_conduit">Bajo tubo en superficie (ki=0.85)</SelectItem>
                  <SelectItem value="embedded_conduit">Bajo tubo empotrado (ki=0.77)</SelectItem>
                  <SelectItem value="embedded_wall">Empotrado en pared (ki=0.77)</SelectItem>
                  <SelectItem value="perforated_tray">Bandeja perforada (ki=1.00)</SelectItem>
                  <SelectItem value="solid_tray">Bandeja no perforada (ki=0.85)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Imax tabla simplificada para Cu-PVC al aire (ITC-BT-19) — validación cliente
const IMAX_CU_PVC_CLIENT: Record<number, number> = {
  1.5: 16, 2.5: 20, 4: 25, 6: 32, 10: 44, 16: 57, 25: 76, 35: 92, 50: 119,
};
const IMAX_CU_XLPE_CLIENT: Record<number, number> = {
  1.5: 18, 2.5: 24, 4: 30, 6: 38, 10: 52, 16: 68, 25: 90, 35: 109, 50: 141,
};
function clientValidateCoordination(mcbRating: number, cableSection: number, insulation: string) {
  const table = insulation === 'XLPE' ? IMAX_CU_XLPE_CLIENT : IMAX_CU_PVC_CLIENT;
  const iz = table[cableSection];
  if (!iz) return null;
  return { valid: mcbRating <= iz, iz };
}

// Indicador de coordinación PIA ↔ cable usando el endpoint del servidor (REBT)
function CircuitCoordinationIndicator({ circuit }: { circuit: { mcbRating: number; cableSection: string; cableMaterial?: string; cableInsulation?: string } }) {
  const section = parseFloat(String(circuit.cableSection)) || 0;
  const mcb = circuit.mcbRating || 0;
  const material = (circuit.cableMaterial === 'Al' ? 'Al' : 'Cu') as 'Cu' | 'Al';
  const insulation = (circuit.cableInsulation === 'XLPE' ? 'XLPE' : 'PVC') as 'PVC' | 'XLPE';
  const enabled = section > 0 && mcb > 0 && [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50].includes(section);
  const { data } = trpc.calculations.protectionCoordination.useQuery(
    { mcbRating: mcb, cableSection: section, material, insulation, correctionFactor: 1 },
    { enabled }
  );
  if (!enabled || !data) return null;
  return (
    <p className={`text-xs mt-1 ${data.valid ? 'text-green-700' : 'text-red-700 font-semibold'}`}>
      {data.valid ? 'PIA adecuado al cable' : data.message}
    </p>
  );
}

// Step 4: Circuits
function Step4Circuits({
  formData,
  setFormData,
}: {
  formData: CertificateFormData;
  setFormData: (data: CertificateFormData) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [circuitForm, setCircuitForm] = useState({
    circuitNumber: "",
    circuitName: "",
    circuitType: "",
    installedPower: 0,
    length: "",
    cableSection: "",
    cableMaterial: "Cu",
    cableInsulation: "PVC",
    cableCores: 2,
    mcbRating: 0,
    mcbCurve: "C",
    rcdRequired: false,
    rcdRating: 30,
    loadDescription: "",
  });

  // 4.3 — Autocálculo sección y PIA por circuito (maxVoltageDrop: 3% — ITC-BT-19)
  const circuitSectionQuery = trpc.calculations.cableSection.useQuery(
    {
      power: circuitForm.installedPower,
      voltage: formData.supplyVoltage,
      phases: formData.phases,
      length: parseFloat(circuitForm.length) || 0,
      material: circuitForm.cableMaterial as 'Cu' | 'Al',
      maxVoltageDrop: 3, // ITC-BT-19: circuitos interiores = 3%
      insulation: circuitForm.cableInsulation as 'PVC' | 'XLPE',
      ambientTemp: formData.ambientTemp,
      groupedCables: formData.groupedCables,
      installMethod: formData.installMethod,
    },
    { enabled: circuitForm.installedPower > 0 && parseFloat(circuitForm.length) > 0 }
  );
  const circuitIgaQuery = trpc.calculations.mainSwitch.useQuery(
    { installedPower: circuitForm.installedPower, phases: formData.phases },
    { enabled: circuitForm.installedPower > 0 }
  );

  const addCircuit = () => {
    if (!circuitForm.circuitNumber || !circuitForm.circuitName) {
      toast.error("Completa número y nombre del circuito");
      return;
    }

    const circuitData = {
      ...circuitForm,
      installedPower: parseInt(String(circuitForm.installedPower)) || 0,
      cableCores: parseInt(String(circuitForm.cableCores)) || 2,
      mcbRating: parseInt(String(circuitForm.mcbRating)) || 0,
      rcdRating: circuitForm.rcdRating ? parseInt(String(circuitForm.rcdRating)) : 30,
    };

    if (editingIndex !== null) {
      const updated = [...formData.circuits];
      updated[editingIndex] = { ...circuitData, id: updated[editingIndex].id };
      setFormData({ ...formData, circuits: updated });
      setEditingIndex(null);
    } else {
      setFormData({
        ...formData,
        circuits: [...formData.circuits, { ...circuitData, id: Date.now().toString() }],
      });
    }

    setCircuitForm({
      circuitNumber: "",
      circuitName: "",
      circuitType: "",
      installedPower: 0,
      length: "",
      cableSection: "",
      cableMaterial: "Cu",
      cableInsulation: "PVC",
      cableCores: 2,
      mcbRating: 0,
      mcbCurve: "C",
      rcdRequired: false,
      rcdRating: 30,
      loadDescription: "",
    });
    setShowForm(false);
    toast.success("Circuito añadido");
  };

  const removeCircuit = (index: number) => {
    setFormData({
      ...formData,
      circuits: formData.circuits.filter((_, i) => i !== index),
    });
  };

  const editCircuit = (index: number) => {
    setCircuitForm(formData.circuits[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {formData.circuits.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No hay circuitos añadidos</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Añadir Circuito
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 2.5 — Resumen de potencias */}
          {(() => {
            const sumW = formData.circuits.reduce((acc, c) => acc + (c.installedPower || 0), 0);
            const declared = formData.installedPower || 0;
            const ratio = declared > 0 ? sumW / declared : 0;
            const over = sumW > declared && declared > 0;
            const low  = ratio < 0.8 && declared > 0;
            return (
              <div className={`p-3 rounded-lg border text-sm ${over ? 'bg-red-50 border-red-300 text-red-800' : low ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
                <span className="font-semibold">Suma de potencias: {sumW.toLocaleString()}W</span>
                {declared > 0 && <span className="ml-2 text-xs">(Potencia declarada: {declared.toLocaleString()}W)</span>}
                {over && <span className="ml-2 font-semibold">⚠ La suma supera la potencia instalada declarada</span>}
                {!over && low && <span className="ml-2">— Suma inferior al 80% de la potencia declarada</span>}
                {!over && !low && declared > 0 && <span className="ml-2">✓ Coherente</span>}
              </div>
            );
          })()}

          {formData.circuits.map((circuit, index) => {
            return (
            <div key={circuit.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Nº</span>
                  <p className="font-semibold">{circuit.circuitNumber}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs">Nombre</span>
                  <p className="font-semibold">{circuit.circuitName}</p>
                  {/* 2.4 — Coordinación PIA ↔ cable (backend REBT) */}
                  <CircuitCoordinationIndicator circuit={circuit} />
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Potencia</span>
                  <p>{circuit.installedPower}W</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Sección / PIA</span>
                  <p>{circuit.cableSection}mm² / {circuit.mcbRating}A</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => editCircuit(index)}>Editar</Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => removeCircuit(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Eliminar
                </Button>
              </div>
            </div>
            );
          })}

          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full"
          >
            + Añadir otro circuito
          </Button>
        </div>
      )}

      {showForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingIndex !== null ? "Editar" : "Nuevo"} Circuito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de circuito *</Label>
                <Input
                  value={circuitForm.circuitNumber}
                  onChange={(e) =>
                    setCircuitForm({ ...circuitForm, circuitNumber: e.target.value })
                  }
                  placeholder="C1"
                />
              </div>
              <div>
                <Label>Nombre del circuito *</Label>
                <Input
                  value={circuitForm.circuitName}
                  onChange={(e) =>
                    setCircuitForm({ ...circuitForm, circuitName: e.target.value })
                  }
                  placeholder="Iluminación"
                />
              </div>
            </div>

            <div>
              <Label>Tipo de circuito</Label>
              <Select
                value={circuitForm.circuitType}
                onValueChange={(value) =>
                  setCircuitForm({ ...circuitForm, circuitType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CIRCUIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Potencia instalada (W)</Label>
                <Input
                  type="number"
                  value={circuitForm.installedPower}
                  onChange={(e) =>
                    setCircuitForm({
                      ...circuitForm,
                      installedPower: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="1000"
                />
              </div>
              <div>
                <Label>Longitud (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={circuitForm.length}
                  onChange={(e) =>
                    setCircuitForm({ ...circuitForm, length: e.target.value })
                  }
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Sección (mm²) *</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={circuitForm.cableSection}
                  onChange={(e) =>
                    setCircuitForm({ ...circuitForm, cableSection: e.target.value })
                  }
                  placeholder="1.5"
                />
                {/* 4.3 — Sugerencia de sección calculada */}
                {circuitSectionQuery.data && circuitForm.installedPower > 0 && parseFloat(circuitForm.length) > 0 && (
                  <p className="text-xs text-blue-700 mt-1">
                    Mínimo: <strong>{circuitSectionQuery.data.recommendedSection} mm²</strong>
                    {" "}(ΔU={circuitSectionQuery.data.voltageDrop}%)
                    {" "}
                    <button type="button" className="underline" onClick={() => setCircuitForm({ ...circuitForm, cableSection: String(circuitSectionQuery.data!.recommendedSection) })}>Usar</button>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Material</Label>
              <Select
                value={circuitForm.cableMaterial}
                onValueChange={(value) =>
                  setCircuitForm({ ...circuitForm, cableMaterial: value })
                }
              >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CABLE_MATERIALS.map((mat) => (
                      <SelectItem key={mat} value={mat}>
                        {mat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Aislamiento</Label>
                <Select
                  value={circuitForm.cableInsulation}
                  onValueChange={(value) =>
                    setCircuitForm({ ...circuitForm, cableInsulation: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CABLE_INSULATIONS.map((ins) => (
                      <SelectItem key={ins} value={ins}>
                        {ins}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Núcleos</Label>
                <Input
                  type="number"
                  value={circuitForm.cableCores}
                  onChange={(e) =>
                    setCircuitForm({
                      ...circuitForm,
                      cableCores: parseInt(e.target.value) || 2,
                    })
                  }
                  placeholder="2"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>PIA (A) *</Label>
                <Input
                  type="number"
                  value={circuitForm.mcbRating}
                  onChange={(e) =>
                    setCircuitForm({
                      ...circuitForm,
                      mcbRating: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="10"
                />
                {/* 4.3 — Sugerencia de PIA calculado */}
                {circuitIgaQuery.data && circuitForm.installedPower > 0 && (
                  <p className="text-xs text-blue-700 mt-1">
                    Mínimo: <strong>{circuitIgaQuery.data}A</strong>
                    {" "}
                    <button type="button" className="underline" onClick={() => setCircuitForm({ ...circuitForm, mcbRating: circuitIgaQuery.data! })}>Usar</button>
                  </p>
                )}
              </div>
              <div>
                <Label>Curva</Label>
                <Select
                  value={circuitForm.mcbCurve}
                  onValueChange={(value) =>
                    setCircuitForm({ ...circuitForm, mcbCurve: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MCB_CURVES.map((curve) => (
                      <SelectItem key={curve} value={curve}>
                        Curva {curve}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>RCD (mA)</Label>
                <Input
                  type="number"
                  value={circuitForm.rcdRating}
                  onChange={(e) =>
                    setCircuitForm({
                      ...circuitForm,
                      rcdRating: parseInt(e.target.value) || 30,
                    })
                  }
                  placeholder="30"
                  disabled={!circuitForm.rcdRequired}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={circuitForm.rcdRequired}
                onCheckedChange={(checked) =>
                  setCircuitForm({
                    ...circuitForm,
                    rcdRequired: checked as boolean,
                  })
                }
              />
              <Label>Diferencial propio</Label>
            </div>

            <div>
              <Label>Descripción de carga</Label>
              <Textarea
                value={circuitForm.loadDescription}
                onChange={(e) =>
                  setCircuitForm({
                    ...circuitForm,
                    loadDescription: e.target.value,
                  })
                }
                placeholder="Descripción de los elementos conectados"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={addCircuit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {editingIndex !== null ? "Actualizar" : "Añadir"} Circuito
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setEditingIndex(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Step 5: Measurements
function Step5Measurements({
  formData,
  setFormData,
}: {
  formData: CertificateFormData;
  setFormData: (data: CertificateFormData) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Pruebas Eléctricas</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Resistencia aislamiento (MΩ) *</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.insulationResistance}
                onChange={(e) =>
                  setFormData({ ...formData, insulationResistance: e.target.value })
                }
                placeholder="0.5"
              />
            </div>
            <div>
              <Label>Resistencia continuidad (Ω) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.continuityContinuity}
                onChange={(e) =>
                  setFormData({ ...formData, continuityContinuity: e.target.value })
                }
                placeholder="0.05"
              />
            </div>
          </div>

          {/* 2.6 — Tensión de contacto ITC-BT-24 */}
          {(() => {
            const rt = parseFloat(formData.earthResistance) || 0;
            const idn = formData.idSensitivity || 0;
            if (!rt || !idn) return null;
            const uc = Math.round(rt * (idn / 1000) * 100) / 100;
            const ok = uc <= 50;
            return (
              <div className={`p-3 rounded-lg border text-sm ${ok ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                <span className="font-semibold">Tensión de contacto (ITC-BT-24): </span>
                <span>Uc = Rt({rt}Ω) × Idn({idn}mA) = <strong>{uc}V</strong></span>
                {ok
                  ? <span className="ml-2">✓ Conforme (≤ 50V)</span>
                  : <span className="ml-2 font-semibold">⚠ No conforme — reducir Rt o usar diferencial más sensible</span>}
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Test RCD - Corriente (mA) *</Label>
              <Input
                type="number"
                value={formData.rcdTestCurrent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rcdTestCurrent: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="30"
              />
            </div>
            <div>
              <Label>Test RCD - Tiempo (ms) *</Label>
              <Input
                type="number"
                value={formData.rcdTestTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rcdTestTime: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="200"
              />
            </div>
          </div>

          {/* 3.8 — Verificación tiempo de disparo IEC 60755 */}
          {(() => {
            const t = formData.rcdTestTime;
            const idn = formData.rcdTestCurrent || formData.idSensitivity || 0;
            if (!t || !idn) return null;
            // Límite según IEC 60755: 300 ms a 1×Idn (diferencial estándar)
            const maxTime = 300;
            const conforme = t <= maxTime;
            const margin = maxTime - t;
            return (
              <div className={`p-3 rounded-lg border text-sm ${conforme ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                <span className="font-semibold">Tiempo de disparo RCD (IEC 60755 / ITC-BT-24): </span>
                <span>
                  Medido <strong>{t} ms</strong> — Máximo admisible a 1×I<sub>dn</sub>: <strong>{maxTime} ms</strong>
                </span>
                {conforme
                  ? <span className="ml-2">✓ Conforme — margen {margin} ms</span>
                  : <span className="ml-2 font-semibold">⚠ No conforme — el diferencial no dispara en tiempo reglamentario</span>
                }
              </div>
            );
          })()}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Observaciones</h3>
        <Textarea
          value={formData.observations}
          onChange={(e) =>
            setFormData({ ...formData, observations: e.target.value })
          }
          placeholder="Notas adicionales sobre la instalación"
          rows={5}
        />
      </div>
    </div>
  );
}

// Step 6: Review
function Step6Review({
  formData,
  clients,
  installations,
  profile,
}: {
  formData: CertificateFormData;
  clients?: any[];
  installations?: any[];
  profile?: any;
}) {
  const client = clients?.find((c) => c.id === formData.clientId);
  const installation = installations?.find((i) => i.id === formData.installationId);

  const hasInstallerData = profile?.fullName || profile?.installerNumber || profile?.companyName;

  return (
    <div className="space-y-6">
      {/* Advertencia si faltan datos del instalador */}
      {!hasInstallerData && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <p className="text-sm text-amber-900 font-semibold">Datos del instalador incompletos</p>
          <p className="text-sm text-amber-800 mt-1">
            Para que el CIE sea válido legalmente, completa tus datos profesionales en{" "}
            <a href="/dashboard/settings" className="underline font-medium">Configuración → Perfil del Instalador</a>.
          </p>
        </div>
      )}

      {/* Datos del instalador */}
      {hasInstallerData && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Instalador Autorizado</h3>
          <div className="grid grid-cols-2 gap-4 text-sm bg-green-50 p-4 rounded-lg border border-green-200">
            <div>
              <p className="text-gray-600">Nombre</p>
              <p className="font-semibold">{profile?.fullName || '-'}</p>
            </div>
            <div>
              <p className="text-gray-600">Nº Carnet</p>
              <p className="font-semibold">{profile?.installerNumber || '-'}</p>
            </div>
            <div>
              <p className="text-gray-600">Empresa</p>
              <p className="font-semibold">{profile?.companyName || '-'}</p>
            </div>
            <div>
              <p className="text-gray-600">Nº autorización empresa</p>
              <p className="font-semibold">{(profile as any)?.companyAuthNumber || '-'}</p>
            </div>
          </div>
        </div>
      )}

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
            <p className="font-semibold">{formData.supplyVoltage}V</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Potencia instalada</p>
            <p className="font-semibold">{formData.installedPower}W</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tipo de local</p>
            <p className="font-semibold">{formData.locationCategory}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sist. puesta a tierra</p>
            <p className="font-semibold">{formData.groundingSystem}</p>
          </div>
          {formData.installationType === "Vivienda unifamiliar" && (
            <div>
              <p className="text-sm text-gray-600">Grado electrificación</p>
              <p className="font-semibold">{formData.electrificationGrade}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Derivación Individual</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Longitud</p>
            <p className="font-semibold">{formData.diLength}m</p>
          </div>
          <div>
            <p className="text-gray-600">Sección</p>
            <p className="font-semibold">{formData.diCableSection}mm²</p>
          </div>
          <div>
            <p className="text-gray-600">Material</p>
            <p className="font-semibold">{formData.diCableMaterial}</p>
          </div>
          <div>
            <p className="text-gray-600">Tierra</p>
            <p className="font-semibold">{formData.earthResistance}Ω</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Circuitos ({formData.circuits.length})</h3>
        <div className="space-y-2">
          {formData.circuits.map((circuit) => (
            <div key={circuit.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">{circuit.circuitNumber} - {circuit.circuitName}</p>
                <p className="text-sm text-gray-600">{circuit.installedPower}W • {circuit.cableSection}mm² • {circuit.mcbRating}A</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          ✓ Revisa todos los datos antes de crear el certificado. Una vez creado, podrás editar la mayoría de campos.
        </p>
      </div>
    </div>
  );
}
