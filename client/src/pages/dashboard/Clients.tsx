import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Users, Edit, Trash2, Search } from "lucide-react";
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

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "person" as const,
    name: "",
    dniNif: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    province: "",
    notes: "",
  });

  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery();
  const createMutation = trpc.clients.create.useMutation();
  const deleteMutation = trpc.clients.delete.useMutation();

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Cliente creado exitosamente");
      setFormData({
        type: "person",
        name: "",
        dniNif: "",
        email: "",
        phone: "",
        address: "",
        postalCode: "",
        city: "",
        province: "",
        notes: "",
      });
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error al crear el cliente");
    }
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                <Label>Nombre / Razón social</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <Label>DNI / NIF</Label>
                <Input
                  value={formData.dniNif}
                  onChange={(e) =>
                    setFormData({ ...formData, dniNif: e.target.value })
                  }
                  placeholder="12345678A"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+34 600 000 000"
                />
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
                  <Label>Código postal</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    placeholder="28001"
                  />
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
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Cliente
                  </Button>
                </DialogTrigger>
              </Dialog>
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
