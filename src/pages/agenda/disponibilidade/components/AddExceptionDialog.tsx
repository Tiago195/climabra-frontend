import { useEffect, useState } from "react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar, Info, Sunrise, Sun, Moon, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import {
  availabilityService,
  type IExceptionPayload,
  type IExceptionResponse,
} from "@/services/availability"
import type { Shift } from "@/services/enums"
import { SHIFT_LABELS, SHIFT_ORDER, DEFAULT_SHIFT_HOURS } from "@/lib/shifts"
import { getApiErrorMessage, getFieldErrors } from "@/services/apiError"
import { FieldError } from "@/components/ui/field-error"

interface AddExceptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: string
  /**
   * Nº de visitas ainda `scheduled` no dia `initialDate` (D6). Quando > 0, mostra
   * aviso de conflito antes de confirmar o bloqueio ("exigirá remarcar N visitas").
   * Só vem do sheet do dia (H4); na Disponibilidade fica indefinido (sem aviso).
   */
  conflictCount?: number
  onCreated: (exception: IExceptionResponse) => void
}

const SHIFT_ICONS: Record<Shift, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
}

export function AddExceptionDialog({ open, onOpenChange, initialDate, conflictCount, onCreated }: AddExceptionDialogProps) {
  const { token } = useAuth()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [allDay, setAllDay] = useState(true)
  const [selectedShifts, setSelectedShifts] = useState<Set<Shift>>(new Set())
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    if (!open) return
    const today = new Date().toISOString().slice(0, 10)
    const base = initialDate || today
    setStartDate(base)
    setEndDate(base)
    setAllDay(true)
    setSelectedShifts(new Set())
    setReason("")
  }, [open, initialDate])

  const toggleShift = (shift: Shift) => {
    setSelectedShifts(prev => {
      const next = new Set(prev)
      if (next.has(shift)) next.delete(shift)
      else next.add(shift)
      return next
    })
  }

  const handleSave = async () => {
    if (!token) return

    if (!startDate || !endDate) {
      toast.error("Informe as datas de início e fim")
      return
    }
    if (startDate > endDate) {
      toast.error("A data de início deve ser anterior ou igual à data de fim")
      return
    }
    if (!allDay && selectedShifts.size === 0) {
      toast.error("Selecione ao menos um turno para bloquear")
      return
    }

    const payload: IExceptionPayload = {
      startDate,
      endDate,
      reason: reason.trim() || undefined,
    }
    if (!allDay) {
      // Preserva a ordem morning → afternoon → night
      payload.shifts = SHIFT_ORDER.filter(s => selectedShifts.has(s))
    }

    setFieldErrors(null)
    setSaving(true)
    try {
      const created = await availabilityService.createException(token, payload)
      onCreated(created)
      toast.success("Bloqueio salvo!")
      onOpenChange(false)
    } catch (e) {
      const fields = getFieldErrors(e)
      if (fields) {
        setFieldErrors(fields)
      } else {
        toast.error(getApiErrorMessage(e, "Erro ao salvar bloqueio"))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </span>
          Bloquear data na agenda
        </span>
      }
      description="Defina o período e os turnos bloqueados"
    >
        {/* Corpo */}
        <div className="space-y-5 pt-2">
          {/* Datas início/fim */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exc-start-date" className="text-xs font-medium text-gray-700">
                Data de início
              </Label>
              <Input
                id="exc-start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-9 text-sm"
                aria-invalid={!!fieldErrors?.startDate}
              />
              <FieldError message={fieldErrors?.startDate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exc-end-date" className="text-xs font-medium text-gray-700">
                Data de fim
              </Label>
              <Input
                id="exc-end-date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-9 text-sm"
                aria-invalid={!!fieldErrors?.endDate}
              />
              <FieldError message={fieldErrors?.endDate} />
            </div>
          </div>

          <p className="text-[11px] text-gray-400 -mt-3">
            Para bloquear um único dia, deixe igual à data de início.
          </p>

          {/* Switch dia inteiro */}
          <div className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3">
            <div>
              <Label className="text-sm font-medium text-gray-800">
                Bloquear o dia inteiro
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">
                {allDay ? "Todos os turnos ficam bloqueados" : "Selecione abaixo quais turnos bloquear"}
              </p>
            </div>
            <Switch checked={allDay} onCheckedChange={setAllDay} />
          </div>

          {/* Turnos — só quando switch OFF */}
          {!allDay && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">
                Turnos a bloquear
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {SHIFT_ORDER.map(shift => {
                  const Icon = SHIFT_ICONS[shift]
                  const checked = selectedShifts.has(shift)
                  const hours = DEFAULT_SHIFT_HOURS[shift]
                  return (
                    <button
                      key={shift}
                      type="button"
                      onClick={() => toggleShift(shift)}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 transition-colors text-center ${
                        checked
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-blue-300 text-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{SHIFT_LABELS[shift]}</span>
                      <span className="text-[10px] text-gray-400">
                        {hours.startTime}–{hours.endTime}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-400">
                Os turnos só consideram a configuração ativa de cada dia. Turnos desligados continuam desligados.
              </p>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-1.5">
            <Label htmlFor="exc-reason" className="text-xs font-medium text-gray-700">
              Motivo <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="exc-reason"
              type="text"
              placeholder="Ex: Férias, feriado, consulta médica…"
              maxLength={255}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Aviso de conflito (D6) — dia pré-selecionado com visitas ainda agendadas. */}
          {conflictCount != null && conflictCount > 0 && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Este dia tem <strong>{conflictCount} visita{conflictCount > 1 ? "s" : ""} agendada{conflictCount > 1 ? "s" : ""}</strong>.
                Bloquear exigirá remarcar {conflictCount > 1 ? "essas visitas" : "essa visita"}.
              </p>
            </div>
          )}

          {/* Aviso */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Bloqueios novos passam a valer imediatamente para clientes que tentarem agendar.
            </p>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 text-sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Salvando…" : "Salvar bloqueio"}
            </Button>
          </div>
        </div>
    </ResponsiveModal>
  )
}
