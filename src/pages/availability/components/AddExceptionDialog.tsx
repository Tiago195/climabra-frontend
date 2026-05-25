import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar, Info } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import {
  availabilityService,
  type IExceptionPayload,
  type IExceptionResponse,
} from "@/services/availability"

interface AddExceptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: string
  onCreated: (exception: IExceptionResponse) => void
}

export function AddExceptionDialog({ open, onOpenChange, initialDate, onCreated }: AddExceptionDialogProps) {
  const { token } = useAuth()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState("14:00")
  const [endTime, setEndTime] = useState("16:00")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const today = new Date().toISOString().slice(0, 10)
    const base = initialDate || today
    setStartDate(base)
    setEndDate(base)
    setAllDay(true)
    setStartTime("14:00")
    setEndTime("16:00")
    setReason("")
  }, [open, initialDate])

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
    if (!allDay && startTime >= endTime) {
      toast.error("O horário de início deve ser anterior ao horário de fim")
      return
    }

    const payload: IExceptionPayload = {
      startDate,
      endDate,
      reason: reason.trim() || undefined,
    }
    if (!allDay) {
      payload.startTime = startTime
      payload.endTime = endTime
    }

    setSaving(true)
    try {
      const created = await availabilityService.createException(token, payload)
      onCreated(created)
      toast.success("Bloqueio salvo!")
      onOpenChange(false)
    } catch {
      toast.error("Erro ao salvar bloqueio")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full border-0 shadow-2xl p-0 gap-0 bg-white">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">
                Bloquear data na agenda
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Defina o período e o tipo de bloqueio
              </p>
            </div>
          </div>
          {/* Botão X nativo do DialogContent fica no topo direito automaticamente */}
        </div>

        {/* Corpo */}
        <div className="px-5 py-5 space-y-5">
          {/* 2. Datas início/fim */}
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
              />
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
              />
            </div>
          </div>

          {/* 2b. Helper das datas */}
          <p className="text-[11px] text-gray-400 -mt-3">
            Para bloquear um único dia, deixe igual à data de início.
          </p>

          {/* 3. Switch dia inteiro */}
          <div className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3">
            <div>
              <Label className="text-sm font-medium text-gray-800">
                Bloquear o dia inteiro
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">
                {allDay ? "Nenhum horário disponível" : "Definir faixa de horário"}
              </p>
            </div>
            <Switch checked={allDay} onCheckedChange={setAllDay} />
          </div>

          {/* 4. Inputs de horário — só quando switch OFF */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="exc-start-time" className="text-xs font-medium text-gray-700">
                  Início
                </Label>
                <Input
                  id="exc-start-time"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exc-end-time" className="text-xs font-medium text-gray-700">
                  Fim
                </Label>
                <Input
                  id="exc-end-time"
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}

          {/* 5. Motivo */}
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

          {/* 6. Aviso */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Bloqueios novos passam a valer imediatamente para clientes que tentarem agendar.
            </p>
          </div>

          {/* 7. Rodapé */}
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
      </DialogContent>
    </Dialog>
  )
}
