import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MapPin, Navigation, AlertTriangle } from "lucide-react"
import { ShiftBadge } from "@/components/ShiftBadge"
import type {
  IAppointmentDetailResponse,
  IAppointmentInfo,
  IAppointmentReportInfo,
} from "@/services/appointment"
import type { IClientResponse } from "@/services/client"
import {
  FUTURE_BUCKET_BARS, FUTURE_BUCKET_LABELS,
  DAY_NAMES_SHORT, MONTH_NAMES_SHORT,
  futureBucketFor, type FutureBucket,
} from "@/lib/shifts"
import { AppointmentActions } from "./AppointmentActions"

interface Props {
  appointments: IAppointmentDetailResponse[]
  clientsById: Map<string, IClientResponse>
  creatingReportFor: string | null
  onCreateReport: (appt: IAppointmentInfo, equipmentId: string) => Promise<void> | void
  onComplete: (appt: IAppointmentInfo, reports: IAppointmentReportInfo[]) => Promise<void> | void
  onCancel: (id: string) => Promise<void> | void
}

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/**
 * Modo Timeline — aba "Próximas".
 *
 * REGRA: uma visita só sai daqui quando vira `completed` ou `canceled`.
 * Visitas `scheduled` com data já vencida ficam no bucket "Pendente"
 * (destaque âmbar) porque precisam de ação do provider.
 */
export function AppointmentTimelineView({
  appointments, clientsById, creatingReportFor,
  onCreateReport, onComplete, onCancel,
}: Props) {
  const today = todayISO()

  const scheduled = appointments
    .filter(row => row.appointment.status === "scheduled")
    .map(row => {
      const c = clientsById.get(row.client.id)
      return {
        row,
        client: c,
        neighborhood: c?.neighborhood ?? "",
        bucket: futureBucketFor(row.appointment.scheduledDate, today) as FutureBucket,
      }
    })

  const groups: { bucket: FutureBucket; items: typeof scheduled }[] =
    (["pending", "today", "week", "later"] as FutureBucket[]).map(b => ({
      bucket: b,
      items: scheduled
        .filter(e => e.bucket === b)
        // pendentes: mais antigas primeiro (mais urgentes); demais: bairro+nome
        .sort((a, b) => {
          if (a.bucket === "pending") {
            return a.row.appointment.scheduledDate.localeCompare(b.row.appointment.scheduledDate)
          }
          return (
            a.neighborhood.localeCompare(b.neighborhood, "pt-BR") ||
            a.row.client.name.localeCompare(b.row.client.name, "pt-BR")
          )
        }),
    }))

  if (scheduled.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">Nenhuma visita em aberto</p>
          <p className="text-gray-400 text-sm mt-1">
            Crie uma solicitação ou aguarde clientes agendarem pelo link
          </p>
        </CardContent>
      </Card>
    )
  }

  const pendingCount = groups.find(g => g.bucket === "pending")?.items.length ?? 0

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Ordenadas por bairro dentro de cada período</span>
          </div>
          <p className="text-[11px] text-gray-500">
            {scheduled.length} visita{scheduled.length > 1 ? "s" : ""} em aberto
            {pendingCount > 0 && (
              <>
                {" "}·{" "}
                <span className="text-amber-700 font-semibold inline-flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" /> {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
                </span>
              </>
            )}
          </p>
        </CardContent>
      </Card>

      {groups.map(g => {
        if (g.items.length === 0) return null
        const isPending = g.bucket === "pending"
        return (
          <div key={g.bucket} className="space-y-2">
            <div className="flex items-center gap-2 pt-1">
              <div className={`h-1.5 w-1.5 rounded-full ${FUTURE_BUCKET_BARS[g.bucket]}`} />
              <p className={`text-[11px] font-bold uppercase tracking-wider ${
                isPending ? "text-amber-700" : "text-gray-600"
              }`}>
                {FUTURE_BUCKET_LABELS[g.bucket]}
                {isPending && (
                  <AlertTriangle className="w-3 h-3 inline ml-1 -mt-0.5" />
                )}
              </p>
              <span className="text-[10px] text-gray-400">
                · {g.items.length} visita{g.items.length > 1 ? "s" : ""}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {g.items.map(({ row, client }) => {
              const appt = row.appointment
              const d = new Date(`${appt.scheduledDate}T00:00:00`)
              return (
                <Card
                  key={appt.id}
                  className={isPending ? "border-amber-300 bg-amber-50/30" : undefined}
                >
                  <CardContent className="py-3 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className={`flex flex-col items-center justify-center rounded-lg w-11 py-1 shrink-0 ${
                        isPending ? "bg-amber-100 text-amber-800" : "bg-gray-50 text-gray-900"
                      }`}>
                        <span className="text-[9px] uppercase font-bold opacity-70">
                          {DAY_NAMES_SHORT[d.getDay()]}
                        </span>
                        <span className="text-base font-bold leading-none">
                          {d.getDate()}
                        </span>
                        <span className="text-[9px] opacity-70">
                          {MONTH_NAMES_SHORT[d.getMonth()]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {row.client.name}
                          </p>
                          <ShiftBadge shift={appt.shift} size="xs" />
                        </div>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {client?.neighborhood || "Sem bairro"}
                            {client?.city && `, ${client.city}`}
                          </span>
                        </p>
                        {isPending && (
                          <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            Data já passou — conclua ou cancele
                          </p>
                        )}
                        {appt.notes && (
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{appt.notes}</p>
                        )}
                      </div>
                    </div>

                    <AppointmentActions
                      row={row}
                      compact
                      creatingReportFor={creatingReportFor}
                      onCreateReport={onCreateReport}
                      onComplete={onComplete}
                      onCancel={onCancel}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
