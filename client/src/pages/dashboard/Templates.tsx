import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, MapPin, CheckCircle2, Clock } from "lucide-react";

interface CcaaTemplate {
  id: string;
  name: string;
  authority: string;
  status: "available" | "pending";
  differences: string[];
  note?: string;
}

const CCAA_TEMPLATES: CcaaTemplate[] = [
  {
    id: "generico",
    name: "Genérico (resto de CCAA)",
    authority: "Ministerio de Industria, Comercio y Turismo — REBT Real Decreto 842/2002",
    status: "available",
    differences: [
      "Encabezado con referencia al REBT y normativa estatal",
      "Todos los apartados estándar del CIE: datos del titular, instalación, derivación individual, circuitos, mediciones y firma",
      "Válido para Aragón, Asturias, Baleares, Canarias, Cantabria, Castilla-La Mancha, Castilla y León, Extremadura, Galicia, La Rioja, Navarra y Murcia",
    ],
  },
  {
    id: "madrid",
    name: "Comunidad de Madrid",
    authority: "Consejería de Economía, Hacienda e Innovación",
    status: "available",
    differences: [
      "Encabezado adaptado con referencia a la Comunidad de Madrid",
      "Mención explícita a la Consejería competente",
      "Misma estructura de campos que el modelo estándar",
    ],
  },
  {
    id: "andalucia",
    name: "Andalucía",
    authority: "Junta de Andalucía — Consejería de Industria, Energía y Minas",
    status: "available",
    differences: [
      "Encabezado adaptado con referencia a la Junta de Andalucía",
      "Mención a la Consejería de Industria, Energía y Minas",
      "Misma estructura de campos que el modelo estándar",
    ],
  },
  {
    id: "cataluña",
    name: "Cataluña",
    authority: "Generalitat de Catalunya — Departament d'Empresa i Treball",
    status: "available",
    differences: [
      "Encabezado en catalán: «Segons el REBT»",
      "Referencia al Departament d'Empresa i Treball",
      "Misma estructura de campos que el modelo estándar",
    ],
    note: "El encabezado incluye terminología en catalán según la normativa autonómica.",
  },
  {
    id: "comunidad valenciana",
    name: "Comunitat Valenciana",
    authority: "Generalitat Valenciana — Conselleria d'Economia Sostenible",
    status: "available",
    differences: [
      "Encabezado adaptado con referencia a la Generalitat Valenciana",
      "Mención a la Conselleria d'Economia Sostenible, Sectors Productius, Comerç i Treball",
      "Misma estructura de campos que el modelo estándar",
    ],
  },
  {
    id: "país vasco",
    name: "País Vasco / Euskadi",
    authority: "Gobierno Vasco / Eusko Jaurlaritza — Departamento de Desarrollo Económico",
    status: "available",
    differences: [
      "Encabezado bilingüe: «Gobierno Vasco / Eusko Jaurlaritza»",
      "Referencia al Departamento de Desarrollo Económico, Sostenibilidad y Medio Ambiente",
      "Misma estructura de campos que el modelo estándar",
    ],
  },
];

const COMMON_FIELDS = [
  "Datos del titular de la instalación (nombre, DNI, dirección, teléfono)",
  "Datos de la instalación (tipo, categoría del local, grado de electrificación)",
  "Derivación individual (longitud, sección, material, método de instalación)",
  "Cuadro de circuitos (número, nombre, potencia, sección de cable, PIA, diferencial)",
  "Protecciones generales (IGA, ID, protección contra sobretensiones)",
  "Mediciones reglamentarias (resistencia de aislamiento, continuidad, ensayo del diferencial)",
  "Sistema de puesta a tierra (resistencia medida)",
  "Datos del instalador autorizado y firma",
  "Esquema unifilar (generado automáticamente)",
];

export default function TemplatesPage() {
  const { data: profile } = trpc.profile.get.useQuery();
  const installerCcaa = profile?.autonomousCommunity?.toLowerCase() ?? "";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Plantillas de certificado</h2>
        <p className="text-gray-600 mt-1">
          CertIA genera el CIE adaptado automáticamente a tu Comunidad Autónoma según el perfil del instalador.
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">¿Cómo funciona la selección de plantilla?</p>
        <p className="text-blue-700">
          Al generar un certificado, el sistema detecta la <strong>Comunidad Autónoma configurada en tu perfil</strong> (Configuración → Información Profesional) y aplica automáticamente la plantilla correspondiente. Si tu CCAA no tiene plantilla específica, se usa el modelo genérico estatal.
        </p>
        {installerCcaa && (
          <p className="mt-2 font-medium text-blue-800">
            Tu CCAA configurada actualmente:{" "}
            <span className="text-blue-900">{profile?.autonomousCommunity}</span>
          </p>
        )}
      </div>

      {/* Common fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Campos incluidos en todos los certificados</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {COMMON_FIELDS.map((field) => (
              <li key={field} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {field}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CCAA cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CCAA_TEMPLATES.map((tmpl) => {
          const isMyccaa =
            installerCcaa &&
            (tmpl.id === installerCcaa ||
              (tmpl.id === "generico" &&
                !CCAA_TEMPLATES.some(
                  (t) => t.id !== "generico" && t.id === installerCcaa
                )));

          return (
            <CcaaCard
              key={tmpl.id}
              template={tmpl}
              isMyccaa={!!isMyccaa}
            />
          );
        })}
      </div>
    </div>
  );
}

function CcaaCard({
  template,
  isMyccaa,
}: {
  template: CcaaTemplate;
  isMyccaa: boolean;
}) {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const utils = trpc.useUtils();

  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      const { html } = await utils.pdf.templatePreview.fetch({ ccaa: template.id });
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      toast.error(err?.data?.message ?? err?.message ?? "Error al generar la muestra");
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <Card className={`relative ${isMyccaa ? "border-blue-400 ring-1 ring-blue-300" : ""}`}>
      {isMyccaa && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-blue-600 text-white text-xs">Tu CCAA</Badge>
        </div>
      )}
      <CardHeader className="pb-2 pr-24">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <CardTitle className="text-sm font-semibold text-gray-900 leading-tight">
            {template.name}
          </CardTitle>
        </div>
        <p className="text-xs text-gray-500 mt-1 leading-snug">{template.authority}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {template.status === "pending" ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            Plantilla específica en desarrollo — se usa el modelo genérico
          </div>
        ) : (
          <ul className="space-y-1">
            {template.differences.map((d) => (
              <li key={d} className="flex items-start gap-1.5 text-xs text-gray-600">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        )}
        {template.note && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            {template.note}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-1"
          onClick={handlePreview}
          disabled={loadingPreview}
        >
          {loadingPreview ? (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
          ) : (
            <Eye className="w-3.5 h-3.5 mr-2" />
          )}
          Ver muestra
        </Button>
      </CardContent>
    </Card>
  );
}
