import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { History } from "lucide-react"
import type { IAppointmentDetailResponse } from "@/services/appointment"
import type { IClientResponse } from "@/services/client"
import {
  PAST_BUCKET_BARS, PAST_BUCKET_LABELS,
  pastBucketFor, compareScheduledShift, type PastBucket,
} from "@/lib/shifts"
import { PastVisitCard } from "./PastVisitCard"
import { PastReportsDialog } from "./PastReportsDialog"

interface Props {
  appointments: IAppointmentDetailResponse[]
  clientsById: Map<string, IClientResponse>
}

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/**
 * Aba "Passadas" — só visitas que já saíram da timeline (completed,
 * canceled, no_show). Cronológico reverso, agrupado por janela temporal.
 */
export function AppointmentHistoryView({ appointments, clientsById }: Props) {
  const today = todayISO()
  const navigate = useNavigate()
  const [reportsModalId, setReportsModalId] = useState<string | null>(null)

  /**
   * Comportamento do clique em "Ver laudos":
   *   - 1 laudo existente → navega direto para a tela do laudo
   *   - >1 laudo OU sem laudo → abre o modal pra escolher qual abrir
   */
  const handleOpenReports = (row: IAppointmentDetailResponse) => {
    if (row.reports.length === 1) {
      navigate(`/dashboard/reports/${row.reports[0].id}`)
      return
    }
    setReportsModalId(row.appointment.id)
  }

  const past = useMemo(() => {
    return appointments
      .filter(row => row.appointment.status !== "scheduled")
      .map(row => ({
        row,
        client: clientsById.get(row.client.id),
        bucket: pastBucketFor(row.appointment.scheduledDate, today) as PastBucket,
      }))
      .sort((a, b) => -compareScheduledShift(a.row.appointment, b.row.appointment))
  }, [appointments, clientsById, today])

  const groups: { bucket: PastBucket; items: typeof past }[] =
    (["thisWeek", "thisMonth", "older"] as PastBucket[]).map(b => ({
      bucket: b,
      items: past.filter(e => e.bucket === b),
    }))

  const reportsModalRow = reportsModalId
    ? past.find(p => p.row.appointment.id === reportsModalId)?.row ?? null
    : null

  if (past.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <History className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">Nenhuma visita no histórico</p>
          <p className="text-gray-400 text-sm mt-1">
            Visitas concluídas ou canceladas aparecerão aqui
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <History className="w-3.5 h-3.5 text-gray-600" />
            <span>Mais recentes primeiro · só leitura</span>
          </div>
        </CardContent>
      </Card>

      {groups.map(g => {
        if (g.items.length === 0) return null
        return (
          <div key={g.bucket} className="space-y-2">
            <div className="flex items-center gap-2 pt-1">
              <div className={`h-1.5 w-1.5 rounded-full ${PAST_BUCKET_BARS[g.bucket]}`} />
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                {PAST_BUCKET_LABELS[g.bucket]}
              </p>
              <span className="text-[10px] text-gray-400">
                · {g.items.length} visita{g.items.length > 1 ? "s" : ""}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {g.items.map(({ row, client }) => (
              <PastVisitCard
                key={row.appointment.id}
                row={row}
                client={client}
                onOpenReports={() => handleOpenReports(row)}
              />
            ))}
          </div>
        )
      })}

      <PastReportsDialog
        row={reportsModalRow}
        open={!!reportsModalRow}
        onOpenChange={open => { if (!open) setReportsModalId(null) }}
      />
    </div>
  )
}
