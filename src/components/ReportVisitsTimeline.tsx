import type { IReportVisit } from "@/services/report"
import type { AppointmentStatus } from "@/services/enums"
import { SHIFT_LABELS } from "@/lib/shifts"

// Papel da visita no laudo: avaliação (origem) × execução (retorno).
const ROLE_META: Record<IReportVisit["role"], { label: string; chip: string }> = {
  assessment: { label: "Avaliação", chip: "bg-blue-50 text-blue-700" },
  execution: { label: "Execução", chip: "bg-teal-50 text-teal-700" },
}

// Estado do agendamento da visita.
const VISIT_STATUS_META: Record<AppointmentStatus, { label: string; chip: string; done: boolean }> = {
  scheduled: { label: "Agendada", chip: "bg-blue-50 text-blue-600", done: false },
  completed: { label: "Concluída", chip: "bg-emerald-50 text-emerald-700", done: true },
  canceled: { label: "Cancelada", chip: "bg-gray-100 text-gray-500", done: false },
  no_show: { label: "Não compareceu", chip: "bg-rose-50 text-rose-600", done: false },
}

function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

/**
 * Timeline "Visitas deste laudo" (Fase F4): avaliação + execuções vinculadas,
 * com data/turno/papel/estado. Consome `visits[]` do detalhe do laudo.
 */
export function ReportVisitsTimeline({ visits }: { visits: IReportVisit[] }) {
  if (!visits || visits.length === 0) return null
  return (
    <div className="space-y-0">
      {visits.map((v, i) => {
        const role = ROLE_META[v.role]
        const st = VISIT_STATUS_META[v.status]
        const isLast = i === visits.length - 1
        return (
          <div key={i} className="flex gap-3">
            {/* conector vertical */}
            <div className="flex flex-col items-center pt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  st?.done ? "bg-emerald-500" : "border-2 border-gray-300 bg-white"
                }`}
              />
              {!isLast && <span className="w-px flex-1 bg-gray-200 my-1" />}
            </div>
            <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-3"}`}>
              <div className="flex items-center gap-2 flex-wrap">
                {role && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${role.chip}`}>
                    {role.label}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-800">
                  {formatDayMonth(v.scheduledDate)} · {SHIFT_LABELS[v.shift]}
                </span>
                {st && (
                  <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${st.chip}`}>
                    {st.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
