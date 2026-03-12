import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, PlusCircle, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Circuit {
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
}

interface Step4Props {
  formData: {
    installationType: string;
    supplyVoltage: number;
    installedPower: number;
    phases: number;
    circuits: Circuit[];
  };
  setFormData: (data: any) => void;
}

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

function PiaIndicator({ circuit }: { circuit: Circuit }) {
  const section = parseFloat(circuit.cableSection) || 0;
  const enabled = circuit.mcbRating > 0 && section > 0;

  const query = trpc.calculations.protectionCoordination.useQuery(
    {
      mcbRating: circuit.mcbRating,
      cableSection: section,
      material: circuit.cableMaterial as "Cu" | "Al",
      insulation: circuit.cableInsulation as "PVC" | "XLPE",
      correctionFactor: 1.0,
    },
    { enabled }
  );

  if (!enabled) return null;
  if (query.isPending) return <Loader2 className="w-3 h-3 animate-spin text-gray-400" />;
  if (!query.data) return null;

  return query.data.valid ? (
    <span title="PIA adecuado al cable">
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    </span>
  ) : (
    <span title={query.data.message}>
      <XCircle className="w-4 h-4 text-red-500" />
    </span>
  );
}

export default function Step4Enhanced({ formData, setFormData }: Step4Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [circuitForm, setCircuitForm] = useState<Circuit>({
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

  // Queries para IA y cálculos
  const suggestCircuitsMutation = trpc.ai.suggestCircuits.useQuery(
    {
      installationType: formData.installationType,
      installedPower: formData.installedPower,
    },
    { enabled: false }
  );

  const calculateCableSectionQuery = trpc.calculations.cableSection.useQuery(
    {
      power: circuitForm.installedPower,
      voltage: formData.supplyVoltage,
      phases: 1,
      length: parseFloat(circuitForm.length) || 0,
      material: circuitForm.cableMaterial as "Cu" | "Al",
      maxVoltageDrop: 3,
    },
    { enabled: false }
  );

  const piaCableSection = parseFloat(circuitForm.cableSection) || 0;
  const piaValidationEnabled =
    circuitForm.mcbRating > 0 && piaCableSection > 0;

  const protectionCoordinationQuery = trpc.calculations.protectionCoordination.useQuery(
    {
      mcbRating: circuitForm.mcbRating,
      cableSection: piaCableSection,
      material: circuitForm.cableMaterial as "Cu" | "Al",
      insulation: circuitForm.cableInsulation as "PVC" | "XLPE",
      correctionFactor: 1.0,
    },
    { enabled: piaValidationEnabled }
  );

  const handleSuggestCircuits = async () => {
    try {
      const result = await suggestCircuitsMutation.refetch();
      if (result.data?.circuits) {
        const suggestedCircuits = result.data.circuits.map((c: any) => ({
          id: `suggested-${Math.random()}`,
          circuitNumber: c.circuitNumber,
          circuitName: c.circuitName,
          circuitType: c.circuitType,
          installedPower: c.installedPower,
          length: "0",
          cableSection: c.cableSection.toString(),
          cableMaterial: "Cu",
          cableInsulation: "XLPE",
          cableCores: 3,
          mcbRating: c.mcbRating,
          mcbCurve: c.mcbCurve,
          rcdRequired: c.rcdRequired,
          rcdRating: 30,
          loadDescription: c.explanation,
        }));

        setFormData({
          ...formData,
          circuits: [...formData.circuits, ...suggestedCircuits],
        });

        toast.success(`${suggestedCircuits.length} circuitos sugeridos añadidos`);
      }
    } catch (error) {
      toast.error("Error al obtener sugerencias");
    }
  };

  const handleCalculateCableSection = async () => {
    if (!circuitForm.installedPower || !circuitForm.length) {
      toast.error("Ingresa potencia y longitud");
      return;
    }

    try {
      const result = await calculateCableSectionQuery.refetch();
      if (result.data?.data) {
        const calc = result.data.data;
        setCircuitForm({
          ...circuitForm,
          cableSection: calc.recommendedSection.toString(),
        });
        toast.success(
          `Sección recomendada: ${calc.recommendedSection}mm² (Caída: ${calc.voltageDrop}%)`
        );
      }
    } catch (error) {
      toast.error("Error al calcular sección");
    }
  };

  const addCircuit = () => {
    if (!circuitForm.circuitNumber || !circuitForm.circuitName || !circuitForm.cableSection || !circuitForm.mcbRating) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...formData.circuits];
      updated[editingIndex] = { ...circuitForm, id: circuitForm.id || `circuit-${Date.now()}` };
      setFormData({ ...formData, circuits: updated });
      toast.success("Circuito actualizado");
    } else {
      setFormData({
        ...formData,
        circuits: [...formData.circuits, { ...circuitForm, id: `circuit-${Date.now()}` }],
      });
      toast.success("Circuito añadido");
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
    setEditingIndex(null);
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Circuitos de la Instalación</h3>
        <Button
          onClick={handleSuggestCircuits}
          variant="outline"
          size="sm"
          disabled={suggestCircuitsMutation.isPending}
        >
          {suggestCircuitsMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sugiriendo...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Sugerir Circuitos IA
            </>
          )}
        </Button>
      </div>

      {formData.circuits.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No hay circuitos añadidos</p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleSuggestCircuits}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={suggestCircuitsMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Sugerir Circuitos
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Añadir Manual
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {formData.circuits.map((circuit, index) => (
            <div key={circuit.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
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
                  <span className="text-gray-500 text-xs">Sección / PIA</span>
                  <div className="flex items-center gap-1">
                    <p>{circuit.cableSection}mm² / {circuit.mcbRating}A</p>
                    <PiaIndicator circuit={circuit} />
                  </div>
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
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Añadir otro circuito
          </Button>
        </div>
      )}

      {showForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingIndex !== null ? "Editar" : "Nuevo"} Circuito
            </CardTitle>
            <CardDescription>
              Completa los datos del circuito. Los campos marcados con * son obligatorios.
            </CardDescription>
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
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.5"
                    value={circuitForm.cableSection}
                    onChange={(e) =>
                      setCircuitForm({ ...circuitForm, cableSection: e.target.value })
                    }
                    placeholder="1.5"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCalculateCableSection}
                    disabled={calculateCableSectionQuery.isPending}
                  >
                    {calculateCableSectionQuery.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Calc"
                    )}
                  </Button>
                </div>
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
                {piaValidationEnabled && (
                  <div className="mt-1">
                    {protectionCoordinationQuery.isPending ? (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                      </span>
                    ) : protectionCoordinationQuery.data ? (
                      protectionCoordinationQuery.data.valid ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> PIA adecuado al cable
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {protectionCoordinationQuery.data.message}
                        </span>
                      )
                    ) : null}
                  </div>
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
              <Label>Requiere diferencial (RCD) propio</Label>
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
