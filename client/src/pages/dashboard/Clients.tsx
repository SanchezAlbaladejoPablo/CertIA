import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Users, Edit, Trash2, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY_FORM = {
  type: "person" as "person" | "company",
  name: "",
  dniNif: "",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
  city: "",
  province: "",
  notes: "",
};

type FormErrors = Partial<Record<keyof typeof EMPTY_FORM, string>>;

// DNI: 8 dígitos + letra (ej: 12345678Z)
// NIE: X/Y/Z + 7 dígitos + letra (ej: X1234567Z)
// CIF empresa: letra + 7 dígitos + dígito/letra (ej: A12345678)
const DNI_RE = /^[0-9]{8}[A-Z]$/i;
const NIE_RE = /^[XYZ][0-9]{7}[A-Z]$/i;
const CIF_RE = /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Teléfono español: 9 dígitos, empieza por 6, 7, 8 o 9
const PHONE_ES_RE = /^[6789][0-9]{8}$/;
// Código postal español: exactamente 5 dígitos
const CP_RE = /^[0-9]{5}$/;

function validateDniNif(value: string, type: "person" | "company"): string | undefined {
  if (!value.trim()) return undefined; // opcional
  const v = value.trim().toUpperCase();
  if (type === "company") {
    if (!CIF_RE.test(v)) return "CIF no válido (ej: A12345678)";
  } else {
    if (!DNI_RE.test(v) && !NIE_RE.test(v))
      return "DNI/NIE no válido (ej: 12345678Z o X1234567Z)";
  }
  return undefined;
}

function validateForm(data: typeof EMPTY_FORM): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "El nombre es obligatorio";
  } else if (data.name.trim().length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres";
  }

  const dniError = validateDniNif(data.dniNif, data.type);
  if (dniError) errors.dniNif = dniError;

  if (data.email.trim() && !EMAIL_RE.test(data.email)) {
    errors.email = "Email no válido (ej: correo@ejemplo.com)";
  }

  if (data.phone.trim()) {
    const digits = data.phone.replace(/[\s\-\+]/g, "");
    if (!PHONE_ES_RE.test(digits)) {
      errors.phone = "Teléfono no válido (9 dígitos, ej: 612345678)";
    }
  }

  if (data.postalCode.trim() && !CP_RE.test(data.postalCode.trim())) {
    errors.postalCode = "Código postal no válido (5 dígitos)";
  }

  return errors;
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [, setLocation] = useLocation();
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery();
  const createMutation = trpc.clients.create.useMutation();
  const deleteMutation = trpc.clients.delete.useMutation();

  const handleCreate = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Cliente creado exitosamente");
      setFormData(EMPTY_FORM);
      setErrors({});
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error al crear el cliente");
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setErrors({});
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este cliente?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Cliente eliminado");
      refetch();
    } catch (error) {
      toast.error("Error al eliminar el cliente");
    }
  };

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.dniNif?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-600 text-sm mt-1">Gestiona tus clientes y sus datos de contacto</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear nuevo cliente</DialogTitle>
              <DialogDescription>
                Añade un nuevo cliente a tu base de datos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type: value })
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
                <Label className={errors.name ? "text-red-600" : ""}>
                  Nombre / Razón social <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="Juan Pérez"
                  className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label className={errors.dniNif ? "text-red-600" : ""}>
                  {formData.type === "company" ? "CIF" : "DNI / NIE"}
                </Label>
                <Input
                  value={formData.dniNif}
                  onChange={(e) => {
                    setFormData({ ...formData, dniNif: e.target.value });
                    if (errors.dniNif) setErrors({ ...errors, dniNif: undefined });
                  }}
                  placeholder={formData.type === "company" ? "A12345678" : "12345678Z"}
                  className={errors.dniNif ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.dniNif && <p className="text-red-500 text-xs mt-1">{errors.dniNif}</p>}
              </div>

              <div>
                <Label className={errors.email ? "text-red-600" : ""}>
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="correo@ejemplo.com"
                  className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label className={errors.phone ? "text-red-600" : ""}>Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  placeholder="612345678"
                  className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={errors.postalCode ? "text-red-600" : ""}>Código postal</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => {
                      setFormData({ ...formData, postalCode: e.target.value });
                      if (errors.postalCode) setErrors({ ...errors, postalCode: undefined });
                    }}
                    placeholder="28001"
                    className={errors.postalCode ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
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
              </div>

              <Button
                onClick={handleCreate}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Cargando clientes...
            </CardContent>
          </Card>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">No hay clientes</h3>
              <p className="text-gray-600 text-sm mb-4">
                Comienza añadiendo tu primer cliente
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleDialogOpenChange(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{client.name}</h3>
                    <div className="flex gap-4 text-sm text-gray-600 mt-2">
                      {client.dniNif && <span>{client.dniNif}</span>}
                      {client.email && <span>{client.email}</span>}
                      {client.phone && <span>{client.phone}</span>}
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {client.type === "person" ? "Persona física" : "Empresa"}
                      </span>
                    </div>
                    {client.address && (
                      <p className="text-sm text-gray-500 mt-2">
                        {client.address}, {client.postalCode} {client.city}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Ver ficha"
                      onClick={() => setLocation(`/dashboard/clients/${client.id}`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
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
