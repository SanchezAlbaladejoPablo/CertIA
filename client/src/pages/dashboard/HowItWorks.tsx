import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileSignature,
  HardHat,
  Info,
  Scale,
  Send,
  ShieldCheck,
  Timer,
  UserCheck,
  Zap,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROLES = [
  {
    icon: HardHat,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "Instalador Autorizado",
    subtitle: "Técnico cualificado (RII)",
    responsibilities: [
      "Inspección física de la instalación",
      "Verificación cumplimiento REBT",
      "Mediciones eléctricas obligatorias",
      "Firma personal con DNIe / FNMT vía AutoFirma",
    ],
    note: "Responsabilidad civil durante 10 años · Solo 2 min en CertIA",
    tag: "Técnico",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    icon: Building2,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "Empresa Instaladora",
    subtitle: "Inscrita en REI",
    responsibilities: [
      "Gestión de proyectos e instalaciones",
      "Firma del Anexo II (autorización de representación)",
      "Seguimiento de expedientes CIE ante CCAA",
      "Facturación al cliente final",
    ],
    note: "Requiere inscripción en el REI y habilitación de instaladores RII",
    tag: "Legal",
    tagColor: "bg-amber-100 text-amber-700",
  },
  {
    icon: Zap,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    title: "CertIA",
    subtitle: "Intermediario administrativo",
    responsibilities: [
      "Generación de formularios CERTINS específicos por CCAA",
      "Recepción y custodia de la firma técnica",
      "Tramitación ante portales oficiales de CCAA",
      "Descarga y distribución de CIE visados",
    ],
    note: "No firmamos técnicamente por el instalador · Actuamos como representantes autorizados",
    tag: "Intermediario",
    tagColor: "bg-emerald-100 text-emerald-700",
  },
];

const STEPS = [
  {
    number: 1,
    icon: ClipboardList,
    title: "Empresa sube los datos del proyecto",
    description:
      "Dirección, potencia (kW), tipo de instalación (BT/AT), cliente final y documentación opcional.",
    time: null,
    actor: "Empresa",
  },
  {
    number: 2,
    icon: FileSignature,
    title: "CertIA genera el CERTINS autonómico",
    description:
      "Seleccionamos automáticamente el formato oficial de tu Comunidad Autónoma y pre-rellenamos todos los campos técnicos.",
    time: null,
    actor: "CertIA",
  },
  {
    number: 3,
    icon: ShieldCheck,
    title: "El instalador revisa y firma (2 min)",
    description:
      "El técnico autorizado revisa los datos en pantalla, confirma la inspección física y firma con su DNIe o FNMT a través de AutoFirma.",
    time: "~2 min",
    actor: "Instalador",
  },
  {
    number: 4,
    icon: Send,
    title: "CertIA tramita ante la CCAA",
    description:
      "Subida automática al portal oficial de la Comunidad (sede.carm.es, gva.es/CERTINS, etc.) con seguimiento del expediente.",
    time: null,
    actor: "CertIA",
  },
  {
    number: 5,
    icon: CheckCircle2,
    title: "La empresa recibe las 4 copias oficiales",
    description:
      "Propietario (2 copias), compañía eléctrica (1 copia) y archivo de empresa (1 copia). Todo queda registrado en CertIA.",
    time: null,
    actor: "Empresa",
  },
];

const INITIAL_STEPS = [
  {
    icon: BadgeCheck,
    title: "Inscripción en el REI",
    description: "La empresa debe estar inscrita en el Registro de Empresas Instaladoras de su Comunidad.",
  },
  {
    icon: UserCheck,
    title: "Identificación de instaladores (RII)",
    description: "Alta de los técnicos autorizados con su número de carnet RII vigente.",
  },
  {
    icon: Scale,
    title: "Firma del Anexo II — Poderes de Representante",
    description:
      "Documento: \"Autorizo a CertIA para tramitar CIE en mi nombre ante los organismos autonómicos.\" Firma digital de la empresa REI. Solo se hace una vez.",
  },
];

const CCAA_PORTALS = [
  {
    ccaa: "Región de Murcia",
    priority: true,
    portal: "Sede CARM",
    url: "https://sede.carm.es/web/pagina?IDCONTENIDO=19&IDTIPO=240",
    system: "CERTINS / @firma",
    notes: "Portal Instalador Eléctrico",
  },
  {
    ccaa: "Comunidad Valenciana",
    priority: true,
    portal: "GVA CERTINS",
    url: "https://www.gva.es/va/inicio/procedimientos?id_proc=440",
    system: "CERTINS",
    notes: "Conselleria d'Indústria",
  },
  {
    ccaa: "Castilla-La Mancha",
    priority: false,
    portal: "JCCM",
    url: "https://www.jccm.es/tramites/1002270",
    system: "Sede electrónica",
    notes: "Industria y Energía",
  },
  {
    ccaa: "Comunidad de Madrid",
    priority: false,
    portal: "Sede CM",
    url: "https://sede.comunidad.madrid",
    system: "Portal Instalador",
    notes: "Dirección Gral. Industria",
  },
  {
    ccaa: "Andalucía",
    priority: false,
    portal: "Junta Digital",
    url: "https://www.juntadeandalucia.es/organismos/empresaconocimientodesarrolloeconomico.html",
    system: "Plataforma @firma",
    notes: "En implementación",
  },
  {
    ccaa: "Cataluña",
    priority: false,
    portal: "AOC",
    url: "https://www.aoc.cat",
    system: "e.TRAM / AOC",
    notes: "Consorci Administració Oberta",
  },
];

const NORMS = ["ITC-BT-03", "REBT 842/2002", "REI", "RII", "PAdES / DNIe"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Guía Legal y Operativa</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Cómo funciona CertIA</h1>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
          CertIA actúa como <strong>intermediario administrativo autorizado</strong>. Generamos los formularios
          CERTINS autonómicos, coordinamos la firma técnica del instalador y tramitamos el expediente ante la
          Consejería correspondiente.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {NORMS.map(n => (
            <Badge key={n} variant="outline" className="text-xs font-mono text-gray-500">
              {n}
            </Badge>
          ))}
        </div>
      </div>

      {/* Bloque 1: El problema */}
      <section>
        <SectionHeader
          icon={<Timer className="w-5 h-5 text-orange-500" />}
          title="El problema del papeleo"
          subtitle="Por qué un CIE puede costar 4 horas sin CertIA"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="border-red-100 bg-red-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Sin CertIA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Localizar el formulario CERTINS correcto para cada CCAA",
                "Rellenar manualmente campos técnicos (errores frecuentes)",
                "Coordinar al instalador para la firma presencial",
                "Acceder al portal oficial y navegar la burocracia",
                "Gestionar el seguimiento del expediente",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-800">
                  <span className="mt-0.5 shrink-0 text-red-400">✕</span>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Con CertIA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Formulario CERTINS autonómico generado automáticamente",
                "Datos técnicos pre-rellenados desde el sistema",
                "Instalador firma en remoto en 2 minutos con DNIe",
                "Tramitación automática ante el portal oficial",
                "Seguimiento del expediente desde el dashboard",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                  <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bloque 2: Roles legales */}
      <section>
        <SectionHeader
          icon={<Scale className="w-5 h-5 text-blue-600" />}
          title="Roles legales claros"
          subtitle="Tres actores con responsabilidades definidas según ITC-BT-03 y REBT"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {ROLES.map(role => {
            const Icon = role.icon;
            return (
              <Card key={role.title} className={`border ${role.border}`}>
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg ${role.bg} flex items-center justify-center mb-2`}>
                    <Icon className={`w-5 h-5 ${role.color}`} />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{role.title}</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">{role.subtitle}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${role.tagColor}`}>
                      {role.tag}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1.5">
                    {role.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                        {r}
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-gray-500 border-t pt-2">{role.note}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Bloque 3: Trámites iniciales */}
      <section>
        <SectionHeader
          icon={<ClipboardList className="w-5 h-5 text-purple-600" />}
          title="Trámites iniciales"
          subtitle="Requisitos que se completan una sola vez antes de empezar a operar"
        />
        <div className="mt-4 space-y-3">
          {INITIAL_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg border bg-white"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            El Anexo II es el documento legal que habilita a CertIA para tramitar expedientes en nombre de tu empresa.
            Sin este documento no podemos actuar como representantes ante las Consejerías.
          </span>
        </div>
      </section>

      {/* Bloque 4: Flujo en 5 pasos */}
      <section>
        <SectionHeader
          icon={<ArrowRight className="w-5 h-5 text-emerald-600" />}
          title="Flujo operativo en 5 pasos"
          subtitle="Desde la recepción del proyecto hasta la entrega de copias oficiales"
        />
        <div className="mt-4 relative">
          {/* vertical line */}
          <div className="absolute left-5 top-8 bottom-8 w-px bg-gray-200 hidden md:block" />
          <div className="space-y-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const actorColors: Record<string, string> = {
                Empresa: "bg-amber-100 text-amber-700",
                CertIA: "bg-emerald-100 text-emerald-700",
                Instalador: "bg-blue-100 text-blue-700",
              };
              return (
                <div key={i} className="flex items-start gap-4 pl-0 md:pl-2">
                  {/* Step number circle */}
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shrink-0 z-10 text-sm font-bold text-gray-500">
                    {step.number}
                  </div>
                  <div className="flex-1 p-4 rounded-lg border bg-white">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {step.time && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                            <Timer className="w-3 h-3" /> {step.time}
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${actorColors[step.actor]}`}>
                          {step.actor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bloque 5: Portales CCAA */}
      <section>
        <SectionHeader
          icon={<ExternalLink className="w-5 h-5 text-gray-600" />}
          title="Portales oficiales por Comunidad Autónoma"
          subtitle="Organismos y sistemas de tramitación electrónica compatibles con CertIA"
        />
        <div className="mt-4 rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Comunidad Autónoma</TableHead>
                <TableHead className="font-semibold text-gray-700">Portal</TableHead>
                <TableHead className="font-semibold text-gray-700">Sistema</TableHead>
                <TableHead className="font-semibold text-gray-700">Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CCAA_PORTALS.map(row => (
                <TableRow key={row.ccaa} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {row.ccaa}
                      {row.priority && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0 font-medium">
                          Prioritaria
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {row.portal}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 font-mono">{row.system}</TableCell>
                  <TableCell className="text-sm text-gray-500">{row.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Bloque 6: Llamada a la acción */}
      <section>
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  ¿Listo para empezar el proceso de autorización?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  El siguiente paso es formalizar el <strong>Anexo II</strong> y registrar los instaladores autorizados
                  de tu empresa. El equipo de CertIA te acompañará durante todo el proceso de alta.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-white rounded-lg p-3 border flex-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      Necesitas el <strong>Anexo II firmado</strong> antes de poder tramitar
                      expedientes ante las CCAA.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-white rounded-lg p-3 border flex-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      Una vez completado, podrás gestionar todos tus CIE desde el{" "}
                      <strong>dashboard de Certificados</strong>.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
