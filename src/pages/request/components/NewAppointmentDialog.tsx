import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  AirVent, MapPin, Navigation, Users, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import type { Shift } from "@/services/enums"
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
import {
  SHIFT_LABELS, SHIFT_COLORS, SHIFT_ICONS,
  DAY_NAMES_SHORT, MONTH_NAMES_SHORT, trimTime,
} from "@/lib/shifts"
import { EQUIPMENT_TYPE_LABELS } from "@/lib/equipment"
import {
  buildSlotSuggestions,
  nextBusinessDays,
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
}

const DAYS_TO_LOAD = 14

export function NewAppointmentDialog({
  open, onClose, token, publicToken, clients, appointments, onCreated,
}: Props) {
  const [clientId, setClientId] = useState("")
  const [equipments, setEquipments] = useState<IEquipmentResponse[]>([])
  const [selectedEqs, setSelectedEqs] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [picked, setPicked] = useState<{ date: string; shift: Shift } | null>(null)
  const [slotsByDate, setSlotsByDate] = useState<Record<string, IShiftSlot[]>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const client = clientId ? clients.find(c => c.id === clientId) ?? null : null

  // Reset ao abrir
  useEffect(() => {
    if (!open) return
    setClientId("")
    setEquipments([])
    setSelectedEqs([])
    setNotes("")
    setPicked(null)
  }, [open])

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

  // Pré-carrega slots dos próximos 14 dias úteis
  useEffect(() => {
    if (!open) return
    const dates = nextBusinessDays(DAYS_TO_LOAD)
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
  }, [open, publicToken])

  const suggestions: ScoredSlot[] = useMemo(() => {
    if (!client || Object.keys(slotsByDate).length === 0) return []
    return buildSlotSuggestions(client, clients, appointments, slotsByDate)
  }, [client, clients, appointments, slotsByDate])

  const best = suggestions.slice(0, 4)
  const others = suggestions.slice(4, 10)

  const toggleEquipment = (id: string) => {
    setSelectedEqs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSubmit = async () => {
    if (!client || !picked) return
    setSubmitting(true)
    try {
      const payload: ICreateAppointmentRequest = {
        clientId: client.id,
        equipmentIds: selectedEqs.length > 0 ? selectedEqs : undefined,
        scheduledDate: picked.date,
        shift: picked.shift,
        notes: notes || undefined,
      }
      const created = await appointmentService.create(token, payload)
      onCreated(created)
      onClose()
      toast.success("Solicitação criada!")
    } catch {
      toast.error("Erro ao criar solicitação")
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = !!client && !!picked && selectedEqs.length > 0 && !submitting

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92dvh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle>Nova solicitação</DialogTitle>
          <p className="text-xs text-gray-500">Sugestões otimizadas por proximidade</p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Cliente + equipamentos */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente</Label>
                <select
                  value={clientId}
                  onChange={e => { setClientId(e.target.value); setPicked(null) }}
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

              {client && (
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

          {/* Sugestões */}
          {client && (
            <>
              <div className="flex items-center justify-between px-1">
                <Label className="text-xs uppercase tracking-wide text-gray-500">
                  Melhores horários para esta rota
                </Label>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Otimizado
                </span>
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
                            {s.sameNeighborhoodCount > 0 ? (
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

        {/* Footer sticky */}
        <div className="flex gap-2 sticky bottom-0 bg-white px-5 py-3 border-t">
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
      </DialogContent>
    </Dialog>
  )
}
