import { useEffect, useMemo, useState } from "react"
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  GripVertical, Play, Lock, Route, Clock, MapPin, Navigation, Send, Loader2,
  Wand2, ArrowRightLeft, CheckCircle2, AlertTriangle, ChevronUp, ChevronDown,
  ExternalLink, Info,
} from "lucide-react"
import { toast } from "sonner"
import type {
  IAppointmentDetailResponse, IAppointmentInfo, IAppointmentReportInfo,
} from "@/services/appointment"
import { appointmentService } from "@/services/appointment"
import type { IClientResponse } from "@/services/client"
import { routeService, type IRoutePlanResponse, type IRouteSection, type RunStatus } from "@/services/route"
import type { Shift } from "@/services/enums"
import { SHIFT_LABELS, SHIFT_ICONS, SHIFT_ORDER } from "@/lib/shifts"
import { formatFullAddress, googleMapsRouteUrl, wazeUrl } from "@/lib/maps"
import { getApiErrorMessage } from "@/services/apiError"
import { useLocationBeacon } from "@/hooks/useLocationBeacon"
import { AppointmentActions } from "./AppointmentActions"
import { LocationBeaconCard } from "./LocationBeaconCard"
import { RouteMap } from "./RouteMap"

interface Props {
  token: string
  appointments: IAppointmentDetailResponse[]
  clientsById: Map<string, IClientResponse>
  creatingReportFor: string | null
  onCreateReport: (appt: IAppointmentInfo, equipmentId: string) => Promise<void> | void
  onComplete: (appt: IAppointmentInfo, reports: IAppointmentReportInfo[]) => Promise<void> | void
  onCancel: (id: string) => Promise<void> | void
  /** Avisa o pai que uma visita mudou de turno (para as outras telas refletirem). */
  onApptMoved?: (updated: IAppointmentDetailResponse) => void
}

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const fmtMin = (min: number) => {
  const m = Math.round(min)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`
}

const STATUS_META: Record<RunStatus, { label: string; cls: string }> = {
  draft: { label: "A planejar", cls: "bg-gray-100 text-gray-600" },
  started: { label: "Em rota", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Concluída", cls: "bg-green-100 text-green-700" },
}

/**
 * Rota do dia com controle do provider (PLANO_ROTAS_TEMPO_REAL, Fase 1). Seções por turno com
 * status, drag & drop para reordenar em draft, mover visitas entre turnos, "Iniciar rota" por
 * turno (congela a ordem) e "Estou indo" por visita. A ordem vem toda do backend. Mobile-first.
 */
export function RouteDayView({
  token, appointments, clientsById, creatingReportFor,
  onCreateReport, onComplete, onCancel, onApptMoved,
}: Props) {
  const today = useMemo(() => todayISO(), [])
  const [plan, setPlan] = useState<IRoutePlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyShift, setBusyShift] = useState<Shift | null>(null)
  const [confirm, setConfirm] = useState<null | { kind: "start" | "optimize"; shift: Shift }>(null)
  const [notifying, setNotifying] = useState<string | null>(null)
  const [mapOpen, setMapOpen] = useState(true)

  const reload = () => routeService.get(token, today).then(setPlan).catch(() => setPlan(null))

  useEffect(() => {
    let alive = true
    routeService.get(token, today)
      .then(p => { if (alive) setPlan(p) })
      .catch(() => { if (alive) setPlan(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [token, today])

  const rowById = useMemo(() => {
    const m = new Map<string, IAppointmentDetailResponse>()
    for (const r of appointments) m.set(r.appointment.id, r)
    return m
  }, [appointments])

  const stopMeta = useMemo(
    () => new Map(plan?.orderedStops.map(s => [s.appointmentId, s]) ?? []),
    [plan],
  )

  const sectionByShift = useMemo(() => {
    const m = new Map<Shift, IRouteSection>()
    for (const s of plan?.sections ?? []) m.set(s.shift, s)
    return m
  }, [plan])

  // Visitas de hoje sem coordenadas (fora do plano) — agrupadas por turno.
  const uncoveredByShift = useMemo(() => {
    const inPlan = new Set(plan?.orderedStops.map(s => s.appointmentId) ?? [])
    const m: Record<Shift, IAppointmentDetailResponse[]> = { morning: [], afternoon: [], night: [] }
    for (const r of appointments) {
      if (r.appointment.status !== "scheduled" || r.appointment.scheduledDate !== today) continue
      if (inPlan.has(r.appointment.id)) continue
      m[r.appointment.shift]?.push(r)
    }
    return m
  }, [appointments, plan, today])

  const hasPlanStops = useMemo(() => (plan?.orderedStops.length ?? 0) > 0, [plan])
  // Geometria real: preenchida quando algum trecho veio do OSRM (Trip otimizado OU Route na ordem
  // manual/perna de volta) — não é a mesma coisa que "ordem otimizada" (plan.optimized).
  const geometryReal = useMemo(() => (plan?.geometry.length ?? 0) > 0, [plan])

  const stopsForUrl = useMemo(() => {
    if (!plan) return []
    return plan.orderedStops
      .map(s => clientsById.get(s.clientId))
      .filter((c): c is IClientResponse => !!c)
  }, [plan, clientsById])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  // Beacon (Fase 2): liga sozinho quando ALGUM turno de hoje está "em rota" — é o estado `started`
  // que define o contexto (task 2.2). Sem rota iniciada, o hook fica inerte (status "idle").
  const anyStarted = useMemo(
    () => (plan?.sections ?? []).some(s => s.status === "started"),
    [plan],
  )
  const beacon = useLocationBeacon({ token, active: anyStarted })

  const totalStops = plan?.orderedStops.length ?? 0
  const anyToday = SHIFT_ORDER.some(s => (sectionByShift.get(s)?.appointmentIds.length ?? 0) > 0
    || uncoveredByShift[s].length > 0)

  const handleDragEnd = async (shift: Shift, e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id || !plan) return
    const section = sectionByShift.get(shift)
    if (!section || section.status !== "draft") return
    const ids = section.appointmentIds
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    const next = arrayMove(ids, from, to)
    // Otimista: aplica a nova ordem já na UI.
    setPlan(p => p ? { ...p, sections: p.sections.map(s => s.shift === shift ? { ...s, appointmentIds: next } : s) } : p)
    try {
      const updated = await routeService.reorder(token, today, shift, next)
      setPlan(updated)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível reordenar"))
      reload()
    }
  }

  const runAction = async (kind: "start" | "optimize", shift: Shift) => {
    setBusyShift(shift)
    try {
      const updated = kind === "start"
        ? await routeService.start(token, today, shift)
        : await routeService.optimize(token, today, shift)
      setPlan(updated)
      toast.success(kind === "start" ? "Rota iniciada — 1º cliente avisado!" : "Rota re-otimizada.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, kind === "start" ? "Não foi possível iniciar a rota" : "Não foi possível re-otimizar"))
    } finally {
      setBusyShift(null)
      setConfirm(null)
    }
  }

  const move = async (id: string, dest: Shift) => {
    try {
      const updated = await appointmentService.moveShift(token, id, dest)
      onApptMoved?.(updated)
      await reload()
      toast.success(`Visita movida para ${SHIFT_LABELS[dest].toLowerCase()}. Combine a mudança com o cliente.`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível mover a visita"))
    }
  }

  const notify = async (shift: Shift, id: string) => {
    setNotifying(id)
    try {
      const { status } = await routeService.notify(token, today, shift, id)
      if (status === "sent") toast.success("Cliente avisado que você está a caminho!")
      else if (status === "skipped") toast.warning("Cliente não recebe avisos automáticos (opt-out ou sem WhatsApp).")
      else toast.error("Não foi possível enviar o aviso agora.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível avisar o cliente"))
    } finally {
      setNotifying(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 bg-gray-50 rounded-md">
        <Loader2 className="w-4 h-4 animate-spin" /> Montando a rota do dia...
      </div>
    )
  }

  if (!anyToday) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-gray-500">
          <Route className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          Nenhuma visita para hoje
        </CardContent>
      </Card>
    )
  }

  const shiftsWithBlocked = new Set(
    SHIFT_ORDER.filter(s => sectionByShift.get(s)?.status && sectionByShift.get(s)!.status !== "draft"),
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Rota de hoje — {totalStops} parada{totalStops === 1 ? "" : "s"}</span>
          </div>
          {totalStops > 0 && (
            <p className="text-[11px] text-gray-500">
              {plan!.optimized
                ? "Ordem ótima (OSRM)"
                : geometryReal
                  ? "Ordem manual · rota real (OSRM)"
                  : "Estimativa por proximidade"}
              {" · "}~{Math.round(plan!.totalKm)} km · ~{fmtMin(plan!.totalMin)}
            </p>
          )}
          <p className="text-[11px] text-gray-400">
            Arraste para reordenar. Ao iniciar a rota, a ordem trava e o 1º cliente é avisado.
          </p>
          {stopsForUrl.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <a href={googleMapsRouteUrl(stopsForUrl)} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="sm" className="w-full h-8 bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" /> Google Maps
                </Button>
              </a>
              <a href={wazeUrl(stopsForUrl[0])} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="sm" variant="outline" className="w-full h-8 gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" /> Waze (1ª)
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beacon: só aparece com rota iniciada (o hook devolve "idle" fora disso). */}
      <LocationBeaconCard beacon={beacon} />

      {/* Mobile: mapa no topo, depois o plano. Desktop: plano à esquerda, mapa maior à direita
          (via order-*, sem mudar a ordem do DOM que o mobile usa). */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1.1fr_1.5fr] lg:gap-4 lg:items-start">
        <div className="order-2 lg:order-1 space-y-4">
          {SHIFT_ORDER.map(shift => {
        const section = sectionByShift.get(shift)
        const uncovered = uncoveredByShift[shift]
        const ids = section?.appointmentIds ?? []
        if (ids.length === 0 && uncovered.length === 0) return null
        const status: RunStatus = section?.status ?? "draft"
        const Icon = SHIFT_ICONS[shift]
        const isDraft = status === "draft"
        const firstPending = ids.find(id => rowById.get(id)?.appointment.status === "scheduled")

        return (
          <div key={shift} className="space-y-2">
            <div className="flex items-center gap-2 pt-1">
              <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <p className="text-[13px] font-bold text-gray-800">{SHIFT_LABELS[shift]}</p>
              <Badge className={`${STATUS_META[status].cls} text-[10px] px-1.5 py-0 gap-1`}>
                {status === "started" && <Navigation className="w-2.5 h-2.5" />}
                {status === "completed" && <CheckCircle2 className="w-2.5 h-2.5" />}
                {STATUS_META[status].label}
              </Badge>
              <span className="text-[10px] text-gray-400">
                · {ids.length + uncovered.length} visita{ids.length + uncovered.length > 1 ? "s" : ""}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {isDraft && ids.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="h-8 flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs"
                  disabled={busyShift === shift}
                  onClick={() => setConfirm({ kind: "start", shift })}
                >
                  {busyShift === shift ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Iniciar rota
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  disabled={busyShift === shift || ids.length < 2}
                  onClick={() => setConfirm({ kind: "optimize", shift })}
                >
                  <Wand2 className="w-3.5 h-3.5" /> Otimizar
                </Button>
              </div>
            )}

            {status === "started" && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md p-2.5 text-[11px] text-blue-800">
                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p className="leading-snug">Rota iniciada — a ordem está travada. Use "Estou indo" para avisar cada cliente.</p>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={e => handleDragEnd(shift, e)}
            >
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {ids.map((id, idx) => {
                    const row = rowById.get(id)
                    if (!row) return null
                    const client = clientsById.get(row.client.id)
                    const meta = stopMeta.get(id)
                    return (
                      <RouteStopCard
                        key={id}
                        id={id}
                        index={idx + 1}
                        row={row}
                        client={client}
                        etaMin={meta?.cumulativeMin}
                        draggable={isDraft}
                        started={status === "started"}
                        isNextInLine={status === "started" && id === firstPending}
                        notifying={notifying === id}
                        blockedShifts={shiftsWithBlocked}
                        currentShift={shift}
                        onNotify={() => notify(shift, id)}
                        onMove={dest => move(id, dest)}
                        creatingReportFor={creatingReportFor}
                        onCreateReport={onCreateReport}
                        onComplete={onComplete}
                        onCancel={onCancel}
                      />
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>

            {uncovered.map(row => {
              const client = clientsById.get(row.client.id)
              return (
                <RouteStopCard
                  key={row.appointment.id}
                  id={row.appointment.id}
                  row={row}
                  client={client}
                  draggable={false}
                  started={status === "started"}
                  noCoords
                  blockedShifts={shiftsWithBlocked}
                  currentShift={shift}
                  onMove={dest => move(row.appointment.id, dest)}
                  creatingReportFor={creatingReportFor}
                  onCreateReport={onCreateReport}
                  onComplete={onComplete}
                  onCancel={onCancel}
                />
              )
            })}
          </div>
        )
          })}
        </div>

        <div className="order-1 lg:order-2 space-y-2 lg:sticky lg:top-4">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[11px] font-semibold text-gray-600">Mapa da rota</p>
            <button
              type="button"
              onClick={() => setMapOpen(o => !o)}
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
            >
              {mapOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {mapOpen ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {mapOpen && (
            hasPlanStops ? (
              <div className="space-y-2">
                <RouteMap plan={plan!} heightClassName="h-[40dvh] lg:h-[520px]" />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5">
                  {geometryReal ? (
                    <span className="text-[11px] text-green-700 flex items-center gap-1">
                      <Route className="w-3 h-3" /> Rota real via OSRM
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-700 flex items-center gap-1">
                      <Route className="w-3 h-3" /> Estimativa (linha reta) — rota real quando o OSRM estiver ativo
                    </span>
                  )}
                </div>
              </div>
            ) : totalStops === 0 && anyToday ? (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 text-[11px] text-amber-800">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p className="leading-snug">
                  As visitas de hoje ainda não têm coordenadas geográficas (geocoding por CEP), então
                  o mapa não aparece. Use o Google Maps/Waze acima ou nos cards de cada visita.
                </p>
              </div>
            ) : null
          )}
        </div>
      </div>

      <ResponsiveModal
        open={!!confirm}
        onOpenChange={o => !o && setConfirm(null)}
        title={confirm?.kind === "start" ? "Iniciar rota do turno?" : "Re-otimizar a rota?"}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {confirm?.kind === "start"
              ? "A ordem das visitas será travada e o 1º cliente da fila receberá um WhatsApp avisando que você está a caminho."
              : "A ordem manual atual será substituída pela ordem otimizada por proximidade. Esta ação não pode ser desfeita."}
          </p>
          {confirm?.kind === "optimize" && (
            <p className="text-[11px] text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Sua reordenação manual será perdida.
            </p>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)} className="w-full sm:w-auto">Cancelar</Button>
            <Button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              disabled={!!busyShift}
              onClick={() => confirm && runAction(confirm.kind, confirm.shift)}
            >
              {busyShift ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {confirm?.kind === "start" ? "Iniciar rota" : "Re-otimizar"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  )
}

// ── Card de uma parada da rota ──────────────────────────────────────────────

function RouteStopCard({
  id, index, row, client, etaMin, draggable, started, isNextInLine, noCoords,
  notifying, blockedShifts, currentShift, onNotify, onMove,
  creatingReportFor, onCreateReport, onComplete, onCancel,
}: {
  id: string
  index?: number
  row: IAppointmentDetailResponse
  client?: IClientResponse
  etaMin?: number
  draggable: boolean
  started: boolean
  isNextInLine?: boolean
  noCoords?: boolean
  notifying?: boolean
  blockedShifts: Set<Shift>
  currentShift: Shift
  onNotify?: () => void
  onMove: (dest: Shift) => void
  creatingReportFor: string | null
  onCreateReport: (appt: IAppointmentInfo, equipmentId: string) => Promise<void> | void
  onComplete: (appt: IAppointmentInfo, reports: IAppointmentReportInfo[]) => Promise<void> | void
  onCancel: (id: string) => Promise<void> | void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !draggable })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }
  const [moveOpen, setMoveOpen] = useState(false)
  const appt = row.appointment
  const done = appt.status !== "scheduled"

  return (
    <Card ref={setNodeRef} style={style} className={isNextInLine ? "border-blue-300 ring-1 ring-blue-200" : undefined}>
      <CardContent className="py-3 space-y-2.5">
        <div className="flex items-start gap-2">
          {draggable ? (
            <button
              type="button"
              className="touch-none mt-0.5 -ml-1 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
              aria-label="Arrastar para reordenar"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          ) : (
            <div className={`flex items-center justify-center rounded-full w-7 h-7 shrink-0 text-xs font-bold ${
              noCoords ? "bg-gray-200 text-gray-500" : "bg-blue-600 text-white"
            }`}>
              {index ?? "–"}
            </div>
          )}
          {draggable && (
            <div className="flex items-center justify-center bg-blue-600 text-white rounded-full w-7 h-7 shrink-0 text-xs font-bold">
              {index}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 truncate">{row.client.name}</p>
              {isNextInLine && (
                <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 shrink-0">Próximo</Badge>
              )}
            </div>
            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{client ? formatFullAddress(client) : "Endereço indisponível"}</span>
            </p>
            {noCoords ? (
              <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3 shrink-0" /> Sem coordenadas — fora do mapa
              </p>
            ) : etaMin != null && (
              <p className="text-[11px] text-blue-700 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 shrink-0" /> chega em ~{fmtMin(etaMin)} de rota
              </p>
            )}
          </div>
        </div>

        {started && !done && onNotify && (
          <Button
            size="sm"
            variant={isNextInLine ? "default" : "outline"}
            className={`w-full h-8 gap-1.5 text-xs ${isNextInLine ? "bg-blue-600 hover:bg-blue-700" : ""}`}
            disabled={notifying}
            onClick={onNotify}
          >
            {notifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Estou indo — avisar cliente
          </Button>
        )}

        {!started && !done && (
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 gap-1.5 text-[11px]"
              onClick={() => setMoveOpen(o => !o)}
            >
              <ArrowRightLeft className="w-3 h-3" /> Mover para outro turno
            </Button>
            {moveOpen && (
              <div className="mt-1.5 flex items-center gap-1.5">
                {SHIFT_ORDER.filter(s => s !== currentShift).map(dest => {
                  const blocked = blockedShifts.has(dest)
                  return (
                    <Button
                      key={dest}
                      size="sm"
                      variant="outline"
                      disabled={blocked}
                      title={blocked ? "Rota deste turno já iniciada" : undefined}
                      className={`flex-1 h-7 text-[11px] ${blocked ? "opacity-40" : ""}`}
                      onClick={() => { setMoveOpen(false); onMove(dest) }}
                    >
                      {SHIFT_LABELS[dest]}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        )}

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
}
