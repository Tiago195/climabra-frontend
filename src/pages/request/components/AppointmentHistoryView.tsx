import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { History } from "lucide-react"
import type { IAppointmentDetailResponse } from "@/services/appointment"
import type { IClientResponse } from "@/services/client"
import type { Shift } from "@/services/enums"
import { MONTH_NAMES_LONG, compareScheduledShift } from "@/lib/shifts"
import { DayGroupCard, ShiftSectionLabel } from "./dayGroup"
import { PastVisitCard } from "./PastVisitCard"
import { PastReportsDialog } from "./PastReportsDialog"

interface Props {
  appointments: IAppointmentDetailResponse[]
  clientsById: Map<string, IClientResponse>
}

/** "2026-07" → "Julho 2026" (mês por extenso capitalizado, como o MonthCalendar). */
const formatMonthTitle = (ym: string) => {
  const [y, m] = ym.split("-").map(Number)
  return `${MONTH_NAMES_LONG[(m ?? 1) - 1]} ${y}`
}

/**
 * Aba "Histórico" — só visitas que já saíram da timeline (completed, canceled, no_show).
 *
 * Agrupamento (aprovado pelo Tiago 16/07): MÊS (cabeçalho 1×) → card por DIA (mesmo padrão
 * card-por-dia da Agenda/Próximas) → seção por turno → entradas compactas. Cronológico
 * reverso: mês desc, dia desc e, dentro do dia, turno desc (o mais recente primeiro).
 */
export function AppointmentHistoryView({ appointments, clientsById }: Props) {
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
      .map(row => ({ row, client: clientsById.get(row.client.id) }))
      // Mais recente primeiro (dia desc, turno desc) — mesma intenção do histórico antigo.
      .sort((a, b) => -compareScheduledShift(a.row.appointment, b.row.appointment))
  }, [appointments, clientsById])

  type PastItem = typeof past[number]
  interface ShiftGroup { shift: Shift; items: PastItem[] }
  interface DayGroup { date: string; items: PastItem[]; shiftGroups: ShiftGroup[] }
  interface MonthGroup { month: string; items: PastItem[]; dayGroups: DayGroup[] }

  // Agrupa preservando a ordem de `past` (já ordenado desc): Map mantém a ordem de inserção,
  // então mês/dia/turno saem naturalmente do mais recente para o mais antigo.
  const monthGroups: MonthGroup[] = useMemo(() => {
    const months = new Map<string, PastItem[]>()
    for (const e of past) {
      const month = e.row.appointment.scheduledDate.slice(0, 7)
      const arr = months.get(month) ?? []
      arr.push(e)
      months.set(month, arr)
    }
    return [...months.entries()].map(([month, monthItems]) => {
      const days = new Map<string, PastItem[]>()
      for (const e of monthItems) {
        const date = e.row.appointment.scheduledDate
        const arr = days.get(date) ?? []
        arr.push(e)
        days.set(date, arr)
      }
      const dayGroups: DayGroup[] = [...days.entries()].map(([date, dayItems]) => {
        const shiftGroups: ShiftGroup[] = []
        for (const e of dayItems) {
          const s = e.row.appointment.shift
          let g = shiftGroups.find(x => x.shift === s)
          if (!g) { g = { shift: s, items: [] }; shiftGroups.push(g) }
          g.items.push(e)
        }
        return { date, items: dayItems, shiftGroups }
      })
      return { month, items: monthItems, dayGroups }
    })
  }, [past])

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
            <span>Agrupado por mês e dia · mais recentes primeiro · só leitura</span>
          </div>
        </CardContent>
      </Card>

      {monthGroups.map(mg => (
        <div key={mg.month} className="space-y-2">
          {/* Cabeçalho do mês (1×) — section header discreto, igual aos períodos da Agenda. */}
          <div className="flex items-center gap-2 pt-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              {formatMonthTitle(mg.month)}
            </p>
            <span className="text-[10px] text-gray-400">
              · {mg.items.length} visita{mg.items.length > 1 ? "s" : ""}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {mg.dayGroups.map(dg => (
            <DayGroupCard key={dg.date} date={dg.date} count={dg.items.length}>
              {dg.shiftGroups.map(sg => (
                <div key={sg.shift} className="space-y-1.5">
                  <ShiftSectionLabel shift={sg.shift} count={sg.items.length} />
                  <div className="space-y-1.5">
                    {sg.items.map(({ row, client }) => (
                      <PastVisitCard
                        key={row.appointment.id}
                        row={row}
                        client={client}
                        onOpenReports={() => handleOpenReports(row)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </DayGroupCard>
          ))}
        </div>
      ))}

      <PastReportsDialog
        row={reportsModalRow}
        open={!!reportsModalRow}
        onOpenChange={open => { if (!open) setReportsModalId(null) }}
      />
    </div>
  )
}
