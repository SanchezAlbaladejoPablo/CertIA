import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  supplyVoltage: number;
  installedPower: number;
  phases: number;

  // Step 3: Derivation & Board
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

export default function CertificateWizard() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CertificateFormData>({
    installationType: "",
    supplyVoltage: 230,
    installedPower: 0,
    phases: 1,
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
  });

  const { data: clients } = trpc.clients.list.useQuery();
  const createClientMutation = trpc.clients.create.useMutation();
  const { data: installations } = trpc.installations.list.useQuery();
  const createInstallationMutation = trpc.installations.create.useMutation();
  const createCertificateMutation = trpc.certificates.create.useMutation();

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 1 && formData.newClient) {
      try {
        const result = await createClientMutation.mutateAsync(formData.newClient);
        setFormData({ ...formData, clientId: result.insertId, newClient: undefined });
      } catch (error) {
        toast.error("Error al crear el cliente");
        return;
      }
    }

    if (currentStep === 2 && formData.newInstallation && formData.clientId) {
      try {
        const result = await createInstallationMutation.mutateAsync({
          clientId: formData.clientId,
          ...formData.newInstallation,
        });
        setFormData({ ...formData, installationId: result.insertId, newInstallation: undefined });
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

  const handleFinish = async () => {
    if (!validateStep(6)) return;

    if (!formData.clientId || !formData.installationId) {
      toast.error("Faltan datos del cliente o instalación");
      return;
    }

    try {
      const result = await createCertificateMutation.mutateAsync({
        clientId: formData.clientId,
        installationId: formData.installationId,
        installationType: formData.installationType,
        supplyVoltage: formData.supplyVoltage,
        installedPower: formData.installedPower,
        phases: formData.phases,
      });

      toast.success("Certificado creado exitosamente");
      setLocation(`/dashboard/certificates/${result.insertId}`);
    } catch (error) {
      toast.error("Error al crear el certificado");
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Crear Certificado</h1>
        <p className="text-gray-600 mt-1">Paso {currentStep} de {STEPS.length}</p>
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
          {currentStep === 6 && <Step6Review formData={formData} clients={clients} installations={installations} />}
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
          <Button
            onClick={handleFinish}
            className="bg-green-600 hover:bg-green-700"
            disabled={createCertificateMutation.isPending}
          >
            {createCertificateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Certificado"
            )}
          </Button>
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
            <Input
              value={formData.newInstallation?.cadastralReference || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newInstallation: { ...formData.newInstallation, cadastralReference: e.target.value },
                })
              }
              placeholder="Ej: 2823901TF3H5001S"
            />
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
            onChange={(e) =>
              setFormData({ ...formData, installedPower: parseInt(e.target.value) || 0 })
            }
            placeholder="9200"
          />
        </div>
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
          </div>
        </div>
      </div>
    </div>
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
          {formData.circuits.map((circuit, index) => (
            <div key={circuit.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Nº</span>
                  <p className="font-semibold">{circuit.circuitNumber}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs">Nombre</span>
                  <p className="font-semibold">{circuit.circuitName}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Potencia</span>
                  <p>{circuit.installedPower}W</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Sección</span>
                  <p>{circuit.cableSection}mm²</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editCircuit(index)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCircuit(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}

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
}: {
  formData: CertificateFormData;
  clients?: any[];
  installations?: any[];
}) {
  const client = clients?.find((c) => c.id === formData.clientId);
  const installation = installations?.find((i) => i.id === formData.installationId);

  return (
    <div className="space-y-6">
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
