import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const RESULT_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  passed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  deferred: "bg-gray-100 text-gray-800",
} as const;

const RESULT_LABELS = {
  pending: "Pendiente",
  passed: "Aprobada",
  failed: "No conforme",
  deferred: "Aplazada",
} as const;

export default function InspectionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ certificateId: "", scheduledDate: "", notes: "" });

  const { data: inspections = [], refetch } = trpc.inspections.list.useQuery();
  const createMutation = trpc.inspections.create.useMutation();
  const updateMutation = trpc.inspections.update.useMutation();
  const deleteMutation = trpc.inspections.delete.useMutation();

  const handleCreate = async () => {
    if (!form.certificateId || !form.scheduledDate) {
      toast.error("Certificado y fecha son obligatorios");
      return;
    }
    try {
      await createMutation.mutateAsync({
        certificateId: Number(form.certificateId),
        scheduledDate: form.scheduledDate,
        notes: form.notes || undefined,
      });
      toast.success("Revisión programada");
      setForm({ certificateId: "", scheduledDate: "", notes: "" });
      setDialogOpen(false);
      refetch();
    } catch {
      toast.error("Error al programar la revisión");
    }
  };

  const handleMarkPassed = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, result: "passed", completedDate: new Date().toISOString() });
      toast.success("Revisión marcada como aprobada");
      refetch();
    } catch {
      toast.error("Error al actualizar la revisión");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta revisión programada?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const upcoming = inspections.filter((i) => i.result === "pending");
  const completed = inspections.filter((i) => i.result !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revisiones periódicas</h2>
          <p className="text-gray-600 text-sm mt-1">Gestiona las inspecciones obligatorias según ITC-BT-05</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Programar revisión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Programar revisión periódica</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>ID del certificado</Label>
                <Input
                  value={form.certificateId}
                  onChange={(e) => setForm({ ...form, certificateId: e.target.value })}
                  placeholder="Ej: 1"
                  type="number"
                />
              </div>
              <div>
                <Label>Fecha programada</Label>
                <Input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Observaciones opcionales..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreate}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Guardando..." : "Programar revisión"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plazos informativos */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Plazos reglamentarios (ITC-BT-05)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-800">Viviendas</p>
              <p className="text-blue-600">Cada 20 años</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-800">Locales y oficinas</p>
              <p className="text-blue-600">Cada 5 años</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-800">Industrial</p>
              <p className="text-blue-600">Cada 5 años</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-800">Pública concurrencia</p>
              <p className="text-blue-600">Cada 5 años</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pendientes */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-600" />
          Pendientes ({upcoming.length})
        </h3>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-gray-500">
              No hay revisiones pendientes
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((insp) => (
              <Card key={insp.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Certificado #{insp.certificateId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Fecha: {format(new Date(insp.scheduledDate), "d MMM yyyy", { locale: es })}
                      </p>
                      {insp.notes && <p className="text-sm text-gray-500 mt-1">{insp.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={RESULT_COLORS[insp.result as keyof typeof RESULT_COLORS]}>
                        {RESULT_LABELS[insp.result as keyof typeof RESULT_LABELS]}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPassed(insp.id)}
                        className="text-green-700 border-green-300 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprobada
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(insp.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completadas */}
      {completed.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Historial</h3>
          <div className="space-y-2">
            {completed.map((insp) => (
              <Card key={insp.id} className="opacity-75">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Certificado #{insp.certificateId}</p>
                      <p className="text-sm text-gray-500">
                        Programada: {format(new Date(insp.scheduledDate), "d MMM yyyy", { locale: es })}
                        {insp.completedDate && ` · Completada: ${format(new Date(insp.completedDate), "d MMM yyyy", { locale: es })}`}
                      </p>
                    </div>
                    <Badge className={RESULT_COLORS[insp.result as keyof typeof RESULT_COLORS]}>
                      {RESULT_LABELS[insp.result as keyof typeof RESULT_LABELS]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
