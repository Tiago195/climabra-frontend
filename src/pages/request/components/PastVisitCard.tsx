import { Button } from "@/components/ui/button"
import {
  AirVent, FileText, MapPin, Clock, CheckCircle2, XCircle, UserX,
} from "lucide-react"
import { VisitTypePill } from "./VisitTypePill"
import type { IAppointmentDetailResponse } from "@/services/appointment"
import type { AppointmentStatus } from "@/services/enums"
import type { IClientResponse } from "@/services/client"
import { relativeDateLabel } from "@/lib/shifts"
import { VISIT_TYPE_META } from "@/lib/visitTypes"

interface Props {
  row: IAppointmentDetailResponse
  client: IClientResponse | undefined
  onOpenReports: () => void
}

interface PastStatusVisual {
  label: string
  chip: string
  Icon: typeof CheckCircle2
}

const PAST_STATUS_VISUAL: Record<Exclude<AppointmentStatus, "scheduled">, PastStatusVisual> = {
  completed: { label: "Concluída",      chip: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  canceled:  { label: "Cancelada",      chip: "bg-rose-100 text-rose-700",   Icon: XCircle },
  no_show:   { label: "Não compareceu", chip: "bg-amber-100 text-amber-700", Icon: UserX },
}

/**
 * Entrada compacta de uma visita já finalizada (concluída/cancelada/no-show), empilhada
 * DENTRO do card do dia no Histórico (mesmo padrão card-por-dia da Agenda). Mantém o fundo
 * acinzentado `bg-gray-50/60` — a suíte E2E ancora nesse container (nome do cliente + chip
 * de status + "Ver laudos"). Sem tile de data (o dia está no header do card) e sem badge de
 * turno (o turno é o cabeçalho da seção). Accent fino à esquerda na cor do tipo (D5/D8).
 */
export function PastVisitCard({ row, client, onOpenReports }: Props) {
  const appt = row.appointment
  const status = appt.status as Exclude<AppointmentStatus, "scheduled">
  const visual = PAST_STATUS_VISUAL[status] ?? {
    label: "Finalizada",
    chip: "bg-gray-100 text-gray-700",
    Icon: CheckCircle2,
  }
  const StatusIcon = visual.Icon

  const totalReports = row.reports.length
  const doneReports = row.reports.filter(r => r.status === "completed").length
  const showReportsLine = status === "completed" && row.equipments.length > 0

  return (
    <div
      className="rounded-lg border border-gray-200 bg-gray-50/60 pl-3 pr-2.5 py-2.5 space-y-2"
      style={{ borderLeftColor: VISIT_TYPE_META[appt.visitType].hex, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-700 truncate">{row.client.name}</p>
          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {client?.neighborhood || "Sem bairro"}
              {client?.city && `, ${client.city}`}
            </span>
            <span className="inline-flex items-center gap-0.5 text-gray-400 shrink-0 ml-1">
              <Clock className="w-2.5 h-2.5" />
              {relativeDateLabel(appt.scheduledDate)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <VisitTypePill visitType={appt.visitType} />
          <span className={`inline-flex items-center gap-1 rounded-full font-medium text-[10px] px-1.5 py-0.5 ${visual.chip}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {visual.label}
          </span>
        </div>
      </div>

      {showReportsLine && (
        <div className="flex items-center gap-2 bg-white/70 rounded-md px-2 py-1.5 ring-1 ring-gray-200">
          <AirVent className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <p className="text-[11px] text-gray-700 flex-1 min-w-0 truncate">
            {row.equipments.length} equipamento{row.equipments.length === 1 ? "" : "s"} ·{" "}
            <span className="font-semibold">{doneReports} de {totalReports}</span>{" "}
            laudo{totalReports === 1 ? "" : "s"} concluído{totalReports === 1 ? "" : "s"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenReports}
            className="h-7 text-[11px] gap-1 px-2 shrink-0"
          >
            <FileText className="w-3 h-3" /> Ver laudos
          </Button>
        </div>
      )}

      {!showReportsLine && appt.notes && (
        <p className="text-[11px] text-gray-500 italic bg-white/70 rounded-md px-2 py-1.5 ring-1 ring-gray-200">
          “{appt.notes}”
        </p>
      )}
    </div>
  )
}
