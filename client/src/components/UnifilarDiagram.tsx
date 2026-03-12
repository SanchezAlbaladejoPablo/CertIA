import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CircuitData {
  num: string;
  name: string;
  pia: number;
  section: number;
  power: number;
  rcd: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  data: CircuitData | null;
}

// --- Subcomponent: renders SVG + tooltip ---
function UnifilarSVGView({ svgContent }: { svgContent: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, data: null });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const node = (e.target as Element).closest<SVGGElement>(".circuit-node");

    if (!node) {
      setTooltip((t) => ({ ...t, visible: false }));
      return;
    }

    const raw = node.dataset.circuit;
    if (!raw) return;

    try {
      const data: CircuitData = JSON.parse(raw);
      const containerRect = e.currentTarget.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      setTooltip((prev) => {
        if (prev.visible && prev.data?.num === data.num) {
          return { ...prev, visible: false };
        }
        return {
          visible: true,
          x: nodeRect.left - containerRect.left + nodeRect.width / 2,
          y: nodeRect.top - containerRect.top - 8,
          data,
        };
      });
    } catch {
      // ignore malformed JSON
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-x-auto" onClick={handleClick}>
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />

      {tooltip.visible && tooltip.data && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-xs min-w-[170px]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="font-bold text-gray-900 mb-1.5">
            {tooltip.data.num} — {tooltip.data.name}
          </p>
          <div className="space-y-0.5 text-gray-600">
            <div className="flex justify-between gap-4">
              <span>PIA</span>
              <span className="font-semibold text-gray-800">{tooltip.data.pia}A</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Sección</span>
              <span className="font-semibold text-gray-800">{tooltip.data.section}mm²</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Potencia</span>
              <span className="font-semibold text-gray-800">{tooltip.data.power}W</span>
            </div>
            {tooltip.data.rcd && (
              <p className="mt-1 text-green-700 font-semibold">RCD 30mA protegido</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Mode 1: render from SVG string (wizard, data already in memory) ---
interface UnifilarDiagramFromSVGProps {
  svgContent: string;
}

export function UnifilarDiagramFromSVG({ svgContent }: UnifilarDiagramFromSVGProps) {
  return <UnifilarSVGView svgContent={svgContent} />;
}

// --- Mode 2: load from certificate ID via tRPC ---
interface UnifilarDiagramFromIdProps {
  certificateId: number;
}

export function UnifilarDiagramFromId({ certificateId }: UnifilarDiagramFromIdProps) {
  const { data, isLoading, error } = trpc.ai.unifilarSvgFromId.useQuery({ id: certificateId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Generando esquema...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-600 text-sm">
        Error al cargar el esquema unifilar.
      </div>
    );
  }

  return <UnifilarSVGView svgContent={data.svgContent} />;
}
