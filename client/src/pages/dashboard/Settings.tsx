import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react";

const AUTONOMOUS_COMMUNITIES = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria",
  "Castilla-La Mancha", "Castilla y León", "Cataluña", "Comunidad Valenciana",
  "Extremadura", "Galicia", "Madrid", "Murcia", "Navarra", "País Vasco", "La Rioja",
];

const INSTALLER_CATEGORIES = [
  "Básica",
  "Especialista",
  "Responsable de Mantenimiento",
];

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <CompanyProfileSection />
      <InstallersSection />
      <SubscriptionSection />
    </div>
  );
}

// ─── Perfil de empresa ────────────────────────────────────────────────────────

function CompanyProfileSection() {
  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery();
  const upsertMutation = trpc.profile.upsert.useMutation();

  const [form, setForm] = useState({
    companyName: profile?.companyName || "",
    cifNif: profile?.cifNif || "",
    email: (profile as any)?.email || "",
    companyAuthNumber: profile?.companyAuthNumber || "",
    autonomousCommunity: profile?.autonomousCommunity || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    postalCode: profile?.postalCode || "",
    city: profile?.city || "",
    province: profile?.province || "",
  });

  // Sincroniza cuando llegan datos del servidor
  const [synced, setSynced] = useState(false);
  if (profile && !synced) {
    setForm({
      companyName: profile.companyName || "",
      cifNif: profile.cifNif || "",
      email: (profile as any).email || "",
      companyAuthNumber: profile.companyAuthNumber || "",
      autonomousCommunity: profile.autonomousCommunity || "",
      phone: profile.phone || "",
      address: profile.address || "",
      postalCode: profile.postalCode || "",
      city: profile.city || "",
      province: profile.province || "",
    });
    setSynced(true);
  }

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync(form);
      refetch();
      toast.success("Perfil de empresa actualizado");
    } catch {
      toast.error("Error al guardar el perfil");
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Empresa</CardTitle>
        <CardDescription>Datos de la empresa instaladora que aparecerán en los certificados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Datos de la empresa</h3>
          <div className="space-y-4">
            <Field label="Razón social / Nombre empresa">
              <Input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Instalaciones Eléctricas García S.L." />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CIF / NIF">
                <Input value={form.cifNif} onChange={e => setForm({ ...form, cifNif: e.target.value })} placeholder="B12345678" />
              </Field>
              <Field label="Teléfono">
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+34 600 000 000" />
              </Field>
            </div>
            <Field label="Email de empresa">
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@empresa.es" />
            </Field>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Autorización y comunidad</h3>
          <div className="space-y-4">
            <Field label="Nº autorización empresa instaladora">
              <Input value={form.companyAuthNumber} onChange={e => setForm({ ...form, companyAuthNumber: e.target.value })} placeholder="EIA-28-2024-001" />
            </Field>
            <Field label="Comunidad Autónoma">
              <Select value={form.autonomousCommunity} onValueChange={v => setForm({ ...form, autonomousCommunity: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una comunidad" /></SelectTrigger>
                <SelectContent>
                  {AUTONOMOUS_COMMUNITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Dirección fiscal</h3>
          <div className="space-y-4">
            <Field label="Dirección">
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="C/ Mayor 23" />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Código postal">
                <Input value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} placeholder="28001" />
              </Field>
              <Field label="Ciudad">
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Madrid" />
              </Field>
              <Field label="Provincia">
                <Input value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} placeholder="Madrid" />
              </Field>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 flex justify-end">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Instaladores ─────────────────────────────────────────────────────────────

type InstallerForm = {
  fullName: string;
  nif: string;
  phone: string;
  email: string;
  installerNumber: string;
  installerCategory: string;
};

const EMPTY_INSTALLER: InstallerForm = {
  fullName: "", nif: "", phone: "", email: "", installerNumber: "", installerCategory: "",
};

function InstallersSection() {
  const { data: installers = [], isLoading, refetch } = trpc.installers.list.useQuery();
  const createMutation = trpc.installers.create.useMutation();
  const updateMutation = trpc.installers.update.useMutation();
  const deleteMutation = trpc.installers.delete.useMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<InstallerForm>(EMPTY_INSTALLER);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_INSTALLER); setDialogOpen(true); };
  const openEdit = (ins: any) => {
    setEditingId(ins.id);
    setForm({
      fullName: ins.fullName || "",
      nif: ins.nif || "",
      phone: ins.phone || "",
      email: ins.email || "",
      installerNumber: ins.installerNumber || "",
      installerCategory: ins.installerCategory || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form });
        toast.success("Instalador actualizado");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Instalador añadido");
      }
      refetch();
      setDialogOpen(false);
    } catch {
      toast.error("Error al guardar el instalador");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("Instalador eliminado");
    } catch {
      toast.error("Error al eliminar el instalador");
    }
  };

  const handleToggleActive = async (ins: any) => {
    try {
      await updateMutation.mutateAsync({ id: ins.id, isActive: !ins.isActive });
      refetch();
    } catch {
      toast.error("Error al actualizar el estado");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instaladores</CardTitle>
              <CardDescription>Instaladores autorizados de la empresa. Se selecciona uno al crear cada certificado.</CardDescription>
            </div>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />Añadir instalador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : installers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No hay instaladores registrados.</p>
              <p className="text-xs mt-1">Añade al menos uno para poder crear certificados.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {installers.map((ins: any) => (
                <div key={ins.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${ins.isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                      {ins.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{ins.fullName}</p>
                        <Badge variant="outline" className={ins.isActive ? "border-green-300 text-green-700" : "border-gray-300 text-gray-400"}>
                          {ins.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {[ins.installerCategory, ins.installerNumber].filter(Boolean).join(" · ") || "Sin datos profesionales"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(ins)} title={ins.isActive ? "Desactivar" : "Activar"}>
                      {ins.isActive ? <UserX className="w-4 h-4 text-gray-400" /> : <UserCheck className="w-4 h-4 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(ins)}>
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(ins.id, ins.fullName)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar instalador" : "Nuevo instalador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Field label="Nombre completo *">
              <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Ana García López" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="NIF">
                <Input value={form.nif} onChange={e => setForm({ ...form, nif: e.target.value })} placeholder="12345678A" />
              </Field>
              <Field label="Teléfono">
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="600 000 000" />
              </Field>
            </div>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="instalador@empresa.es" />
            </Field>
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos profesionales</h4>
              <div className="space-y-4">
                <Field label="Nº carnet instalador">
                  <Input value={form.installerNumber} onChange={e => setForm({ ...form, installerNumber: e.target.value })} placeholder="28/2024/0001" />
                </Field>
                <Field label="Categoría">
                  <Select value={form.installerCategory} onValueChange={v => setForm({ ...form, installerCategory: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                    <SelectContent>
                      {INSTALLER_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Guardar cambios" : "Añadir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Suscripción ──────────────────────────────────────────────────────────────

function SubscriptionSection() {
  const { data: subscription, isLoading } = trpc.subscription.get.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan de Suscripción</CardTitle>
        <CardDescription>Gestiona tu suscripción y límites de uso</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-gray-500">Cargando...</div>
        ) : !subscription ? (
          <div className="text-gray-500">No hay información de suscripción disponible</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Plan actual</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{subscription.plan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className={`text-lg font-semibold capitalize ${subscription.status === "active" ? "text-green-600" : "text-red-600"}`}>
                  {subscription.status}
                </p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Certificados</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((subscription.certificatesUsed ?? 0) / (subscription.certificatesLimit ?? 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                  {subscription.certificatesUsed ?? 0} / {(subscription.certificatesLimit ?? 1) === -1 ? "∞" : subscription.certificatesLimit}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
