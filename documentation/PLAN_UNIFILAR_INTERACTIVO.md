# Plan — 5.2 Esquema Unifilar Interactivo

**Fecha:** Marzo 2026
**Estado:** COMPLETADO

---

## Estado previo

- `generateUnifilarHTML()` genera HTML estático con SVG/Mermaid básico (`server/services/diagram-generation.ts`)
- `pdf.generateUnifilarFromCertificateId` endpoint existe en `routers.ts` pero no se consume en ninguna página
- El esquema no se mostraba en ningún lugar de la UI del dashboard

---

## Alcance

### Incluido
- Panel visual del esquema unifilar en Step 6 del wizard (revisión final)
- Acceso desde `certificates-management.tsx` mediante icono en la tabla
- SVG generado programáticamente (reemplaza Mermaid estático): escala automática según número de circuitos
- Interactividad: hover/clic sobre cada elemento muestra tooltip con datos (potencia, sección, calibre PIA, diferencial)
- Componente React reutilizable `UnifilarDiagram.tsx`

### Excluido (post-launch)
- Exportación DXF/DWG (requiere librerías CAD externas)
- Edición directa de elementos en el diagrama (complejidad alta, bajo valor inmediato para MVP)

---

## Pasos

### 1. Mejorar `server/services/diagram-generation.ts`
Reemplazar el diagrama Mermaid estático por un SVG generado programáticamente con:
- Nodo red/acometida en la cabecera
- Nodo IGA con calibre y curva
- Nodo IDD (diferencial general) con sensibilidad mA
- Rama por circuito: PIA (calibre + curva) + sección cable + nombre + potencia
- `data-circuit` JSON attributes para interactividad en frontend
- Layout vertical tipo árbol; ancho adaptable al número de circuitos

### 2. Crear `client/src/components/UnifilarDiagram.tsx`
- Renderiza el SVG via `dangerouslySetInnerHTML`
- Event listeners para hover: tooltip flotante con datos del circuito
- Props: `certificateId: number` (carga via tRPC) o `html: string` (datos directos)
- Estado de carga / error

### 3. Integrar en Step 6 del wizard (`CertificateWizardStep6Enhanced.tsx`)
- Nueva sección "Esquema Unifilar" tras la vista previa del certificado
- Datos disponibles directamente desde el estado del wizard (sin llamada extra)

### 4. Integrar en `certificates-management.tsx`
- Nuevo icono `Network` en la fila de acciones de cada certificado
- Abre `Dialog` con `<UnifilarDiagram certificateId={cert.id} />`

---

## Archivos a modificar / crear

| Archivo | Acción |
|---------|--------|
| `server/services/diagram-generation.ts` | Reescribir `generateUnifilarHTML()` con SVG interactivo |
| `client/src/components/UnifilarDiagram.tsx` | Crear componente nuevo |
| `client/src/pages/dashboard/CertificateWizardStep6Enhanced.tsx` | Añadir sección unifilar |
| `client/src/pages/dashboard/certificates-management.tsx` | Añadir botón + modal |
| `documentation/FUNCIONALIDAD_COMPLETA.md` | Marcar 5.2 como completado |
