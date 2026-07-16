import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MapPin, Navigation, AlertTriangle } from "lucide-react"
import type {
  IAppointmentDetailResponse,
  IAppointmentInfo,
  IAppointmentReportInfo,
} from "@/services/appointment"
import type { IClientResponse } from "@/services/client"
import type { Shift } from "@/services/enums"
import { routeService } from "@/services/route"
import {
  FUTURE_BUCKET_BARS, FUTURE_BUCKET_LABELS,
  SHIFT_ORDER,
  futureBucketFor, type FutureBucket,
} from "@/lib/shifts"
import { VISIT_TYPE_META } from "@/lib/visitTypes"
import { AppointmentActions } from "./AppointmentActions"
import { VisitTypePill } from "./VisitTypePill"
import { DayGroupCard, ShiftSectionLabel } from "./dayGroup"

interface Props {
  token: string
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
  token, appointments, clientsById, creatingReportFor,
  onCreateReport, onComplete, onCancel,
}: Props) {
  const today = todayISO()

  // Ordem única da rota do dia (fonte: backend) — usada para ordenar o bucket "hoje".
  const [routeOrder, setRouteOrder] = useState<Map<string, number>>(new Map())
  useEffect(() => {
    let alive = true
    routeService.get(token, today)
      .then(p => { if (alive) setRouteOrder(new Map(p.orderedStops.map((s, i) => [s.appointmentId, i]))) })
      .catch(() => { if (alive) setRouteOrder(new Map()) })
    return () => { alive = false }
  }, [token, today])

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

  type ScheduledItem = typeof scheduled[number]
  interface ShiftGroup { shift: Shift; items: ScheduledItem[] }
  interface DayGroup { date: string; items: ScheduledItem[]; shiftGroups: ShiftGroup[] }
  interface BucketGroup {
    bucket: FutureBucket
    items: ScheduledItem[]
    // Todos os buckets renderizam por subgrupo de dia (mesma apresentação — feedback do
    // Tiago 16/07: sem o cabeçalho, "Hoje" com 1 turno só parecia não estar agrupado).
    // "Hoje" sempre tem um único DayGroup (dia único); a diferença fica só na ORDENAÇÃO
    // interna (rota, não bairro+nome).
    dayGroups: DayGroup[]
  }

  const sortByNeighborhoodName = (a: ScheduledItem, b: ScheduledItem) =>
    a.neighborhood.localeCompare(b.neighborhood, "pt-BR") ||
    a.row.client.name.localeCompare(b.row.client.name, "pt-BR")

  // Agrupamento visual estilo DaySheet: TODOS os buckets de topo (Pendente/Hoje/Esta
  // semana/Depois) renderizam por subgrupo de dia (cabeçalho compacto) e, dentro do
  // dia, por turno. "Hoje" é sempre um único dia — só a ORDENAÇÃO interna muda (rota,
  // fonte única, em vez de bairro+nome).
  const groups: BucketGroup[] = (["pending", "today", "week", "later"] as FutureBucket[]).map(bucket => {
    const items = scheduled.filter(e => e.bucket === bucket)

    if (bucket === "today") {
      // Dia único — 1 DayGroup só, mas com a MESMA apresentação dos demais buckets
      // (renderDayGroup). Só a ordenação interna difere: rota (fonte única), com
      // fallback bairro+nome enquanto ela não carrega.
      const shiftGroups: ShiftGroup[] = SHIFT_ORDER
        .map(shift => ({
          shift,
          items: items
            .filter(e => e.row.appointment.shift === shift)
            .sort((a, b) => {
              if (routeOrder.size > 0) {
                const oa = routeOrder.has(a.row.appointment.id) ? routeOrder.get(a.row.appointment.id)! : Infinity
                const ob = routeOrder.has(b.row.appointment.id) ? routeOrder.get(b.row.appointment.id)! : Infinity
                if (oa !== ob) return oa - ob
              }
              return sortByNeighborhoodName(a, b)
            }),
        }))
        .filter(g => g.items.length > 0)
      const dayGroups: DayGroup[] = items.length > 0 ? [{ date: today, items, shiftGroups }] : []
      return { bucket, items, dayGroups }
    }

    // pendente: dia mais vencido primeiro; semana/depois: dia mais próximo primeiro.
    const byDate = new Map<string, ScheduledItem[]>()
    for (const e of items) {
      const arr = byDate.get(e.row.appointment.scheduledDate) ?? []
      arr.push(e)
      byDate.set(e.row.appointment.scheduledDate, arr)
    }
    const dayGroups: DayGroup[] = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayItems]) => ({
        date,
        items: dayItems,
        shiftGroups: SHIFT_ORDER
          .map(shift => ({
            shift,
            items: dayItems.filter(e => e.row.appointment.shift === shift).sort(sortByNeighborhoodName),
          }))
          .filter(g => g.items.length > 0),
      }))
    return { bucket, items, dayGroups }
  })

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

  // Entrada compacta de UMA visita (linha empilhada dentro do card do dia, estilo
  // DaySheet — SEM tile de data repetido: o dia já está no header do card, e SEM ser um
  // Card próprio). O `data-testid` migra p/ este container: a suíte E2E clica os botões
  // ("Concluir visita", "Ver laudo", "Cancelar") DENTRO dele. Accent fino à esquerda na
  // cor do tipo (D5/D8) mantém a continuidade visual com o calendário.
  const renderEntry = (item: ScheduledItem, isPending: boolean) => {
    const { row, client } = item
    const appt = row.appointment
    return (
      <div
        key={appt.id}
        data-testid={`appt-card-${appt.id}`}
        className="pl-3 pr-1 py-2.5 first:pt-0.5 last:pb-0.5 space-y-2"
        style={{ borderLeftColor: VISIT_TYPE_META[appt.visitType].hex, borderLeftWidth: 3 }}
      >
        {/* Linha principal: cliente + tipo (o turno já é o cabeçalho da seção) */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {row.client.name}
            </p>
            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {client?.neighborhood || "Sem bairro"}
                {client?.city && `, ${client.city}`}
              </span>
            </p>
          </div>
          <VisitTypePill visitType={appt.visitType} />
        </div>

        {isPending && (
          <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Data já passou — conclua ou cancele
          </p>
        )}
        {appt.notes && (
          <p className="text-[11px] text-gray-400 truncate">{appt.notes}</p>
        )}

        {/* Equipamentos + status do laudo + Ver/Criar laudo + Concluir/Cancelar */}
        <AppointmentActions
          row={row}
          compact
          creatingReportFor={creatingReportFor}
          onCreateReport={onCreateReport}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      </div>
    )
  }

  // Seção de turno DENTRO do card do dia: rótulo do turno UMA vez (chip estilo DaySheet)
  // + as visitas empilhadas com divisor entre elas.
  const renderShiftGroup = (sg: ShiftGroup, isPending: boolean) => (
    <div key={sg.shift} className="space-y-1.5">
      <ShiftSectionLabel shift={sg.shift} count={sg.items.length} />
      <div className="divide-y divide-gray-100">
        {sg.items.map(item => renderEntry(item, isPending))}
      </div>
    </div>
  )

  // UM Card POR DIA (frame 5): header = dia por extenso ("Sexta, 17 de julho") + "N
  // visitas", e dentro uma seção por turno com as visitas empilhadas. Dia agendado no
  // passado herda o realce âmbar de pendência no card inteiro.
  const renderDayGroup = (dg: DayGroup, isPending: boolean) => (
    <DayGroupCard key={dg.date} date={dg.date} count={dg.items.length} accent={isPending}>
      {dg.shiftGroups.map(sg => renderShiftGroup(sg, isPending))}
    </DayGroupCard>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Agrupadas por dia e turno dentro de cada período</span>
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
          <div
            key={g.bucket}
            // Âncora do banner de pendências (H5/T5.1) — o CTA rola até aqui.
            id={isPending ? "agenda-pending-section" : undefined}
            className="space-y-2 scroll-mt-4"
          >
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

            {g.dayGroups.map(dg => renderDayGroup(dg, isPending))}
          </div>
        )
      })}
    </div>
  )
}
