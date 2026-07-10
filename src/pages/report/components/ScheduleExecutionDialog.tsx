import { useState, useEffect } from "react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CalendarClock, Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import type { Shift } from "@/services/enums"
import { availabilityService, type IShiftSlot } from "@/services/availability"
import { appointmentService } from "@/services/appointment"
import {
  SHIFT_LABELS, SHIFT_COLORS, SHIFT_ICONS,
  DAY_NAMES_SHORT, MONTH_NAMES_SHORT, trimTime,
} from "@/lib/shifts"
import { nextBusinessDays, isSlotInPast } from "@/lib/slotSuggestions"

interface Props {
  open: boolean
  onClose: () => void
  token: string
  publicToken: string
  clientId: string
  reportId: string
  /** Chamado após criar a visita de execução — o editor recarrega o detalhe. */
  onScheduled: () => void
}

const DAYS_TO_LOAD = 14

/** Slot disponível achatado (data + turno) p/ o picker. */
interface FlatSlot {
  date: string
  slot: IShiftSlot
}

/**
 * Agendar uma visita de **execução** vinculada a um laudo já avaliado
 * (`reportId` conhecido). Diferente do `NewAppointmentDialog`, não escolhe
 * cliente/equipamento nem cria laudo: a visita entra na junção como execução.
 */
export function ScheduleExecutionDialog({
  open, onClose, token, publicToken, clientId, reportId, onScheduled,
}: Props) {
  const [slots, setSlots] = useState<FlatSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<{ date: string; shift: Shift } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setPicked(null)
    const dates = nextBusinessDays(DAYS_TO_LOAD)
    setLoading(true)
    Promise.all(
      dates.map(date =>
        availabilityService.getSignUpSlots(publicToken, date)
          .then(res => [date, res.shifts ?? []] as const)
          .catch(() => [date, [] as IShiftSlot[]] as const)
      )
    )
      .then(results => {
        const flat: FlatSlot[] = []
        for (const [date, shifts] of results) {
          for (const slot of shifts) {
            // Ignora turnos de hoje cujo horário já passou (janela encerrada).
            if (!slot.blocked && slot.available > 0 && !isSlotInPast(date, slot.endTime)) {
              flat.push({ date, slot })
            }
          }
        }
        setSlots(flat)
      })
      .finally(() => setLoading(false))
  }, [open, publicToken])

  const handleSubmit = async () => {
    if (!picked) return
    setSubmitting(true)
    try {
      await appointmentService.create(token, {
        clientId,
        scheduledDate: picked.date,
        shift: picked.shift,
        reportId,
      })
      toast.success("Visita de execução agendada!")
      onScheduled()
      onClose()
    } catch {
      toast.error("Erro ao agendar a visita de execução")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={isOpen => { if (!isOpen) onClose() }}
      size="lg"
      title="Agendar visita de execução"
      description="Escolha um turno disponível para executar o serviço deste laudo."
    >
      <div className="space-y-4 pt-1">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Buscando horários disponíveis...
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-10 bg-gray-50 rounded-md">
            Nenhum turno disponível nos próximos {DAYS_TO_LOAD} dias úteis.
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-gray-500">
              Turnos disponíveis
            </Label>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {slots.map(({ date, slot }) => {
                const c = SHIFT_COLORS[slot.shift]
                const Icon = SHIFT_ICONS[slot.shift]
                const d = new Date(`${date}T00:00:00`)
                const isPicked = picked?.date === date && picked?.shift === slot.shift
                return (
                  <button
                    key={`${date}-${slot.shift}`}
                    type="button"
                    onClick={() => setPicked({ date, shift: slot.shift })}
                    className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                      isPicked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg w-12 py-1 shrink-0">
                        <span className="text-[9px] uppercase font-bold text-gray-400">
                          {DAY_NAMES_SHORT[d.getDay()]}
                        </span>
                        <span className="text-base font-bold text-gray-900 leading-none">{d.getDate()}</span>
                        <span className="text-[9px] text-gray-400">{MONTH_NAMES_SHORT[d.getMonth()]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${c.bg} ${c.text}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{SHIFT_LABELS[slot.shift]}</span>
                          <span className="text-[11px] text-gray-500">
                            {trimTime(slot.startTime)}–{trimTime(slot.endTime)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs flex items-center gap-1 justify-end">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="font-semibold text-gray-700">
                            {slot.available}/{slot.capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 sticky bottom-0 bg-white pt-3 mt-1 border-t -mx-4 px-4 pb-1">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5"
          disabled={!picked || submitting}
          onClick={handleSubmit}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
          Agendar visita
        </Button>
      </div>
    </ResponsiveModal>
  )
}
