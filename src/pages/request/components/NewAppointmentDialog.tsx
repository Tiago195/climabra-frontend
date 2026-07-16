import { useState, useEffect, useMemo } from "react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  AirVent, MapPin, Navigation, Users, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import type { Shift, VisitType } from "@/services/enums"
import {
  availabilityService,
  type IShiftSlot,
} from "@/services/availability"
import {
  appointmentService,
  type IAppointmentDetailResponse,
  type ICreateAppointmentRequest,
} from "@/services/appointment"
import {
  clientService,
  type IClientResponse,
  type IEquipmentResponse,
} from "@/services/client"
import { reportService, type IOpenReport } from "@/services/report"
import { getApiErrorMessage } from "@/services/apiError"
import {
  SHIFT_LABELS, SHIFT_COLORS, SHIFT_ICONS, SHIFT_ORDER,
  DAY_NAMES_SHORT, MONTH_NAMES_SHORT, trimTime,
} from "@/lib/shifts"
import { EQUIPMENT_TYPE_LABELS } from "@/lib/equipment"
import {
  buildSlotSuggestions,
  nextBusinessDays,
  isSlotInPast,
  type ScoredSlot,
} from "@/lib/slotSuggestions"

interface Props {
  open: boolean
  onClose: () => void
  token: string
  publicToken: string
  clients: IClientResponse[]
  appointments: IAppointmentDetailResponse[]
  onCreated: (appt: IAppointmentDetailResponse) => void
  /** Pré-seleção de data/turno (vinda do sheet do dia — H4/T4.2). */
  initialDate?: string
  initialShift?: Shift
}

const DAYS_TO_LOAD = 14

// Tipos de visita oferecidos no agendamento. "execution" vincula a visita a um
// laudo já avaliado (não cria laudo novo) — ver bloco "Vincular a um laudo".
const VISIT_TYPE_OPTIONS: { value: VisitType; label: string }[] = [
  { value: "standard", label: "Padrão" },
  { value: "assessment", label: "Avaliação" },
  { value: "execution", label: "Execução" },
]

// Cores/rótulos dos status que um laudo em aberto pode ter (F2).
const OPEN_REPORT_STATUS: Record<"approved" | "awaiting_execution", { label: string; color: string }> = {
  approved: { label: "Aprovado", color: "bg-green-100 text-green-700" },
  awaiting_execution: { label: "Aguardando execução", color: "bg-amber-100 text-amber-700" },
}

export function NewAppointmentDialog({
  open, onClose, token, publicToken, clients, appointments, onCreated,
  initialDate, initialShift,
}: Props) {
  const [clientId, setClientId] = useState("")
  const [visitType, setVisitType] = useState<VisitType>("standard")
  const [equipments, setEquipments] = useState<IEquipmentResponse[]>([])
  const [selectedEqs, setSelectedEqs] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [picked, setPicked] = useState<{ date: string; shift: Shift } | null>(null)
  // Modo "data travada" (H4/T4.2 → melhoria de UX): quando o dialog chega com `initialDate`
  // (veio do "+ Nova visita neste dia" do sheet), o default é mostrar só a data escolhida +
  // turnos daquele dia, em vez da lista completa de sugestões multi-data. "Ver outras datas"
  // é o escape explícito para o modo de sempre (lista completa); nada de funcionalidade some,
  // só a apresentação default muda.
  const [showAllDates, setShowAllDates] = useState(false)
  const [slotsByDate, setSlotsByDate] = useState<Record<string, IShiftSlot[]>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // F2 — vincular a um laudo em aberto (visita de execução)
  const [openReports, setOpenReports] = useState<IOpenReport[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [loadingOpenReports, setLoadingOpenReports] = useState(false)

  const client = clientId ? clients.find(c => c.id === clientId) ?? null : null

  // Reset ao abrir
  useEffect(() => {
    if (!open) return
    setClientId("")
    setVisitType("standard")
    setEquipments([])
    setSelectedEqs([])
    setNotes("")
    // Pré-seleção vinda do sheet do dia (H4/T4.2): já chega com data (+ turno com vaga).
    setPicked(initialDate ? { date: initialDate, shift: initialShift ?? "morning" } : null)
    setShowAllDates(false)
    setOpenReports([])
    setSelectedReportId(null)
  }, [open, initialDate, initialShift])

  // Laudos em aberto do cliente (só no modo execução) p/ vincular a visita (F2)
  useEffect(() => {
    setSelectedReportId(null)
    if (visitType !== "execution" || !clientId) {
      setOpenReports([])
      return
    }
    setLoadingOpenReports(true)
    reportService.listOpenReports(token, clientId)
      .then(setOpenReports)
      .catch(() => setOpenReports([]))
      .finally(() => setLoadingOpenReports(false))
  }, [token, clientId, visitType])

  // Equipamentos do cliente selecionado
  useEffect(() => {
    if (!clientId) {
      setEquipments([])
      setSelectedEqs([])
      return
    }
    clientService.findById(token, clientId)
      .then(d => {
        setEquipments(d.equipments)
        setSelectedEqs(d.equipments.length > 0 ? [d.equipments[0].id] : [])
      })
      .catch(() => setEquipments([]))
  }, [token, clientId])

  // Pré-carrega slots dos próximos 14 dias úteis (+ a `initialDate` travada, se vier de
  // fora dessa janela — ex.: sheet do dia num mês futuro do calendário).
  useEffect(() => {
    if (!open) return
    const dates = nextBusinessDays(DAYS_TO_LOAD)
    if (initialDate && !dates.includes(initialDate)) dates.push(initialDate)
    setLoadingSlots(true)
    Promise.all(
      dates.map(date =>
        availabilityService.getSignUpSlots(publicToken, date)
          .then(res => [date, res.shifts ?? []] as const)
          .catch(() => [date, [] as IShiftSlot[]] as const)
      )
    )
      .then(results => {
        const map: Record<string, IShiftSlot[]> = {}
        for (const [date, shifts] of results) map[date] = shifts
        setSlotsByDate(map)
      })
      .finally(() => setLoadingSlots(false))
  }, [open, publicToken, initialDate])

  const suggestions: ScoredSlot[] = useMemo(() => {
    if (!client || Object.keys(slotsByDate).length === 0) return []
    return buildSlotSuggestions(client, clients, appointments, slotsByDate)
  }, [client, clients, appointments, slotsByDate])

  const best = suggestions.slice(0, 4)
  const others = suggestions.slice(4, 10)

  // Modo "data travada": só ativo quando o dialog chegou com `initialDate` (do sheet do
  // dia) e o usuário não pediu "Ver outras datas". Sem `initialDate` (botão "+ Nova visita"
  // do header) este bloco fica sempre `false` e nada muda no fluxo de hoje.
  const lockedMode = !!initialDate && !showAllDates

  type LockedShiftStatus = "available" | "full" | "blocked" | "noWork" | "past"
  interface LockedShiftInfo {
    shift: Shift
    slot: IShiftSlot | null
    scored: ScoredSlot | null
    status: LockedShiftStatus
  }

  // Estado de cada turno (Manhã/Tarde/Noite) do dia travado — mesma fonte (slotsByDate) e
  // mesmo critério de ocupação/proximidade das sugestões, só que recortado para 1 dia.
  const lockedShiftInfo: LockedShiftInfo[] = useMemo(() => {
    if (!initialDate) return []
    const daySlots = slotsByDate[initialDate] ?? []
    return SHIFT_ORDER.map(shift => {
      const slot = daySlots.find(s => s.shift === shift) ?? null
      const scored = suggestions.find(s => s.date === initialDate && s.shift === shift) ?? null
      let status: LockedShiftStatus = "available"
      if (!slot) status = "noWork"
      else if (slot.blocked) status = "blocked"
      else if (isSlotInPast(initialDate, slot.endTime)) status = "past"
      else if (slot.available <= 0) status = "full"
      return { shift, slot, scored, status }
    })
  }, [initialDate, slotsByDate, suggestions])

  const lockedShiftsLoaded = !initialDate || Object.prototype.hasOwnProperty.call(slotsByDate, initialDate)
  const noShiftAvailableForLockedDate =
    lockedShiftsLoaded && lockedShiftInfo.length > 0 && lockedShiftInfo.every(i => i.status !== "available")

  const toggleEquipment = (id: string) => {
    setSelectedEqs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSubmit = async () => {
    if (!client || !picked) return
    setSubmitting(true)
    try {
      const isExecution = visitType === "execution"
      const payload: ICreateAppointmentRequest = {
        clientId: client.id,
        // Execução não seleciona equipamentos (o laudo vinculado já carrega o equipamento).
        equipmentIds: !isExecution && selectedEqs.length > 0 ? selectedEqs : undefined,
        scheduledDate: picked.date,
        shift: picked.shift,
        notes: notes || undefined,
        visitType,
        reportId: isExecution ? selectedReportId ?? undefined : undefined,
      }
      const created = await appointmentService.create(token, payload)
      onCreated(created)
      onClose()
      toast.success("Solicitação criada!")
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao criar solicitação"))
    } finally {
      setSubmitting(false)
    }
  }

  // Defensivo: se `picked` aponta pro dia travado, o turno escolhido precisa constar como
  // disponível em `lockedShiftInfo` (protege contra o initialShift chegar desatualizado —
  // ex. vaga ocupada entre o sheet e a abertura do dialog).
  const pickedLockedShiftValid =
    !picked || !initialDate || picked.date !== initialDate || !lockedShiftsLoaded ||
    lockedShiftInfo.some(i => i.shift === picked.shift && i.status === "available")

  // Execução exige um laudo selecionado; os demais tipos exigem ≥1 equipamento.
  const canSubmit = !!client && !!picked && !submitting && pickedLockedShiftValid && (
    visitType === "execution" ? !!selectedReportId : selectedEqs.length > 0
  )

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={isOpen => { if (!isOpen) onClose() }}
      size="lg"
      title="Nova solicitação"
      description="Sugestões otimizadas por proximidade"
    >
        <div className="space-y-4 pt-1">
          {/* Tipo de visita (Fase F1) */}
          <Card>
            <CardContent className="py-4 space-y-2">
              <Label className="text-xs">Tipo de visita</Label>
              <div className="grid grid-cols-3 gap-2">
                {VISIT_TYPE_OPTIONS.map(opt => {
                  const active = visitType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisitType(opt.value)}
                      className={`min-h-11 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              {visitType === "assessment" && (
                <p className="text-[11px] text-gray-500">
                  Avaliação: você diagnostica e envia o orçamento agora; a execução do serviço é
                  agendada em uma visita de retorno.
                </p>
              )}
              {visitType === "execution" && !client && (
                <p className="text-[11px] text-gray-500">
                  Execução: selecione o cliente para escolher o laudo em aberto a vincular.
                  Nenhum laudo novo será criado.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cliente + equipamentos */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente</Label>
                <select
                  value={clientId}
                  // Trocar de cliente reseta a sugestão escolhida — exceto quando o dia
                  // veio pré-selecionado do sheet (H4), aí o dia escolhido é preservado.
                  onChange={e => { setClientId(e.target.value); if (!initialDate) setPicked(null) }}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecionar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {client && (
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {client.street}, {client.streetNumber} — {client.neighborhood}, {client.city}/{client.state}
                    </span>
                  </p>
                )}
              </div>

              {client && visitType !== "execution" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Equipamentos ({selectedEqs.length})</Label>
                  {equipments.length === 0 ? (
                    <p className="text-xs text-gray-400">Cliente sem equipamentos cadastrados.</p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {equipments.map(eq => {
                        const on = selectedEqs.includes(eq.id)
                        return (
                          <label
                            key={eq.id}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors text-sm ${
                              on ? "border-blue-500 bg-blue-50" : "border-gray-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleEquipment(eq.id)}
                              className="accent-blue-600"
                            />
                            <AirVent className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-medium text-gray-800">
                              {eq.label || EQUIPMENT_TYPE_LABELS[eq.type] || "Equipamento"}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              — {EQUIPMENT_TYPE_LABELS[eq.type]}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vincular a um laudo em aberto (Fase F2) */}
          {visitType === "execution" && client && (
            <Card>
              <CardContent className="py-4 space-y-2">
                <Label className="text-xs">Vincular a um laudo em aberto</Label>
                {loadingOpenReports ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Buscando laudos...
                  </div>
                ) : openReports.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">
                    Este cliente não tem laudos aguardando execução.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      {openReports.map(r => {
                        const on = selectedReportId === r.id
                        const badge = OPEN_REPORT_STATUS[r.status as "approved" | "awaiting_execution"]
                        return (
                          <label
                            key={r.id}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                              on ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="openReport"
                              checked={on}
                              onChange={() => setSelectedReportId(r.id)}
                              className="accent-blue-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{r.displayCode ?? "Laudo"}</p>
                              <p className="text-[11px] text-gray-500 truncate">{r.equipmentLabel ?? "Equipamento"}</p>
                            </div>
                            {badge && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                    <p className="text-[11px] text-gray-500 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      A visita será vinculada a este laudo. Nenhum laudo novo será criado.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sugestões */}
          {client && (
            <>
              {lockedMode ? (
                <>
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">
                      Data selecionada
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowAllDates(true)}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Ver outras datas
                    </button>
                  </div>

                  {!lockedShiftsLoaded ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Carregando turnos...
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg w-12 py-1 shrink-0">
                          <span className="text-[9px] uppercase font-bold text-gray-400">
                            {DAY_NAMES_SHORT[new Date(`${initialDate}T00:00:00`).getDay()]}
                          </span>
                          <span className="text-base font-bold text-gray-900 leading-none">
                            {new Date(`${initialDate}T00:00:00`).getDate()}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {MONTH_NAMES_SHORT[new Date(`${initialDate}T00:00:00`).getMonth()]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 capitalize">
                            {new Date(`${initialDate}T00:00:00`).toLocaleDateString("pt-BR", {
                              weekday: "long", day: "2-digit", month: "long",
                            })}
                          </p>
                          <p className="text-[11px] text-gray-500">Escolha o turno</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {lockedShiftInfo.map(info => {
                          const c = SHIFT_COLORS[info.shift]
                          const Icon = SHIFT_ICONS[info.shift]
                          const enabled = info.status === "available"
                          const isPicked = enabled && picked?.date === initialDate && picked?.shift === info.shift
                          const reason: Record<string, string> = {
                            full: "Lotado",
                            blocked: "Bloqueado",
                            noWork: "Sem expediente",
                            past: "Horário encerrado",
                          }
                          const hasProximity = info.scored != null && (
                            info.scored.usesCoords ? info.scored.nearbyCount > 0 : info.scored.sameNeighborhoodCount > 0
                          )
                          return (
                            <button
                              key={info.shift}
                              type="button"
                              data-testid="locked-shift-option"
                              disabled={!enabled}
                              onClick={() => enabled && initialDate && setPicked({ date: initialDate, shift: info.shift })}
                              className={`rounded-lg border-2 p-2 flex flex-col items-center text-center gap-0.5 transition-colors ${
                                !enabled
                                  ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                  : isPicked
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white hover:border-blue-300"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center ${enabled ? `${c.bg} ${c.text}` : "bg-gray-100 text-gray-400"}`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className={`text-xs font-semibold ${enabled ? "text-gray-800" : "text-gray-500"}`}>
                                {SHIFT_LABELS[info.shift]}
                              </span>
                              {info.slot && (
                                <span className="text-[10px] text-gray-400">
                                  {trimTime(info.slot.startTime)}–{trimTime(info.slot.endTime)}
                                </span>
                              )}
                              {enabled && info.slot ? (
                                <>
                                  <span className="text-[11px] font-semibold text-green-700">
                                    {info.slot.available} vaga{info.slot.available > 1 ? "s" : ""}
                                  </span>
                                  {hasProximity && (
                                    <span className="text-[10px] text-green-700 flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5 shrink-0" /> próx.
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-400">
                                  {reason[info.status] ?? ""}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {noShiftAvailableForLockedDate && (
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-amber-700 bg-amber-50 rounded-md px-2 py-1.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Nenhum turno disponível neste dia.</span>
                          <button
                            type="button"
                            onClick={() => setShowAllDates(true)}
                            className="underline font-semibold"
                          >
                            Ver outras datas
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
              <>
              <div className="flex items-center justify-between px-1">
                <Label className="text-xs uppercase tracking-wide text-gray-500">
                  Melhores horários para esta rota
                </Label>
                {initialDate ? (
                  <button
                    type="button"
                    onClick={() => setShowAllDates(false)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Voltar à data escolhida
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> Otimizado
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Buscando sugestões...
                </div>
              ) : best.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-6 bg-gray-50 rounded-md">
                  Nenhum turno disponível nos próximos {DAYS_TO_LOAD} dias úteis.
                </div>
              ) : (
                <div className="space-y-2">
                  {best.map((s, idx) => {
                    const c = SHIFT_COLORS[s.shift]
                    const Icon = SHIFT_ICONS[s.shift]
                    const d = new Date(`${s.date}T00:00:00`)
                    const isPicked = picked?.date === s.date && picked?.shift === s.shift
                    const isTopPick = idx === 0
                    return (
                      <button
                        key={`${s.date}-${s.shift}`}
                        type="button"
                        data-testid="slot-suggestion"
                        onClick={() => setPicked({ date: s.date, shift: s.shift })}
                        className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                          isPicked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
                        }`}
                      >
                        {isTopPick && (
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-700 mb-1">
                            <CheckCircle2 className="w-3 h-3" /> Recomendado
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg w-12 py-1 shrink-0">
                            <span className="text-[9px] uppercase font-bold text-gray-400">
                              {DAY_NAMES_SHORT[d.getDay()]}
                            </span>
                            <span className="text-base font-bold text-gray-900 leading-none">{d.getDate()}</span>
                            <span className="text-[9px] text-gray-400">
                              {MONTH_NAMES_SHORT[d.getMonth()]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <div className={`w-5 h-5 rounded flex items-center justify-center ${c.bg} ${c.text}`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="text-sm font-semibold text-gray-800">{SHIFT_LABELS[s.shift]}</span>
                              <span className="text-[11px] text-gray-500">
                                {trimTime(s.startTime)}–{trimTime(s.endTime)}
                              </span>
                            </div>
                            {s.usesCoords && s.nearbyCount > 0 ? (
                              <p className="text-[11px] text-green-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="font-semibold">
                                  {s.nearbyCount} visita{s.nearbyCount > 1 ? "s" : ""}
                                </span>
                                <span>
                                  {s.nearestKm != null && s.nearestKm < 1
                                    ? " a menos de 1 km"
                                    : ` a ~${Math.round(s.nearestKm ?? 0)} km`}
                                </span>
                              </p>
                            ) : s.usesCoords && s.nearestKm != null ? (
                              <p className="text-[11px] text-blue-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>Visita mais próxima a ~{Math.round(s.nearestKm)} km</span>
                              </p>
                            ) : s.sameNeighborhoodCount > 0 ? (
                              <p className="text-[11px] text-green-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="font-semibold">
                                  {s.sameNeighborhoodCount} visita{s.sameNeighborhoodCount > 1 ? "s" : ""}
                                </span>
                                <span> no mesmo bairro</span>
                              </p>
                            ) : s.sameCityCount > 0 ? (
                              <p className="text-[11px] text-blue-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="font-semibold">
                                  {s.sameCityCount} visita{s.sameCityCount > 1 ? "s" : ""}
                                </span>
                                <span> na mesma cidade</span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" /> Sem visitas próximas neste turno
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs flex items-center gap-1 justify-end">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className="font-semibold text-gray-700">
                                {s.available}/{s.capacity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {others.length > 0 && (
                <details className="px-1">
                  <summary className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700">
                    Ver mais opções ({others.length})
                  </summary>
                  <div className="space-y-1.5 mt-2">
                    {others.map(s => {
                      const d = new Date(`${s.date}T00:00:00`)
                      const isPicked = picked?.date === s.date && picked?.shift === s.shift
                      return (
                        <button
                          key={`${s.date}-${s.shift}`}
                          type="button"
                          onClick={() => setPicked({ date: s.date, shift: s.shift })}
                          className={`w-full flex items-center justify-between text-left text-xs px-3 py-2 rounded-md border transition-colors ${
                            isPicked
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-blue-300"
                          }`}
                        >
                          <span>
                            <span className="font-semibold">{d.getDate()}/{d.getMonth() + 1}</span>
                            <span className="text-gray-500 ml-1">
                              {DAY_NAMES_SHORT[d.getDay()]} · {SHIFT_LABELS[s.shift]}
                            </span>
                          </span>
                          <span className="text-gray-500">{s.available}/{s.capacity} vagas</span>
                        </button>
                      )
                    })}
                  </div>
                </details>
              )}
              </>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Observações</Label>
                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: cliente prefere manhã cedo..."
                  className="text-sm"
                />
              </div>

              {picked && (
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardContent className="py-3">
                    <p className="text-[11px] uppercase font-bold text-blue-700 tracking-wider mb-1">
                      Selecionado
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(`${picked.date}T00:00:00`).toLocaleDateString("pt-BR", {
                        weekday: "long", day: "2-digit", month: "long",
                      })}
                    </p>
                    <p className="text-xs text-gray-600">
                      Turno da {SHIFT_LABELS[picked.shift].toLowerCase()}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedEqs.length === 0 && equipments.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded-md px-2 py-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" /> Selecione pelo menos um equipamento
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 sticky bottom-0 bg-white pt-3 mt-1 border-t -mx-4 px-4 pb-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Agendar
          </Button>
        </div>
    </ResponsiveModal>
  )
}
