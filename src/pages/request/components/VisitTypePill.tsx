import type { VisitType } from "@/services/enums"

// Pill do tipo de visita, exibida ao lado do ShiftBadge nos cards. "standard"
// não ganha pill (é o caso comum). Cores espelham o NewAppointmentDialog (F2):
// avaliação em azul, execução em teal.
const VISIT_TYPE_PILL: Partial<Record<VisitType, { label: string; className: string }>> = {
  assessment: { label: "Avaliação", className: "bg-blue-100 text-blue-700" },
  execution: { label: "Execução", className: "bg-teal-100 text-teal-700" },
}

export function VisitTypePill({ visitType }: { visitType: VisitType }) {
  const cfg = VISIT_TYPE_PILL[visitType]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center rounded-full font-medium text-[10px] px-1.5 py-0.5 ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
