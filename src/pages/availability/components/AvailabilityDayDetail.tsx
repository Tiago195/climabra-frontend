import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Users, Clock } from "lucide-react"
import type { Shift } from "@/services/enums"
import type { ShiftConfig } from "./DayCard"
import { SHIFT_COLORS, SHIFT_ICONS, SHIFT_LABELS, SHIFT_ORDER, trimTime } from "@/lib/shifts"

const DAY_FULL = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
]
const DAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"]

interface Props {
  selectedDow: number
  onSelectDow: (dayOfWeek: number) => void
  getConfig: (dayOfWeek: number, shift: Shift) => ShiftConfig
  isDirty: (dayOfWeek: number, shift: Shift) => boolean
  onToggle: (dayOfWeek: number, shift: Shift) => void
  onUpdate: (dayOfWeek: number, shift: Shift, updates: Partial<ShiftConfig>) => void
}

/**
 * Card "Detalhes — {dia}" com seletor rápido dos 7 dias e 3 sub-blocos de
 * turno (horário, vagas, switch).
 */
export function AvailabilityDayDetail({
  selectedDow,
  onSelectDow,
  getConfig,
  isDirty,
  onToggle,
  onUpdate,
}: Props) {
  // Ordem visual: seg a sex, depois sáb, depois dom
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Detalhes — {DAY_FULL[selectedDow]}</CardTitle>
          <div className="flex items-center gap-1">
            {dayOrder.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => onSelectDow(d)}
                className={`w-6 h-6 text-[10px] rounded font-semibold transition-colors ${
                  d === selectedDow
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {DAY_INITIALS[d]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {SHIFT_ORDER.map(shift => {
          const config = getConfig(selectedDow, shift)
          const c = SHIFT_COLORS[shift]
          const Icon = SHIFT_ICONS[shift]
          const dirty = isDirty(selectedDow, shift)
          return (
            <div
              key={shift}
              className={`rounded-lg border px-3 py-3 transition-colors ${
                config.isActive ? `${c.bg} border-transparent ring-1 ${c.ring}` : "border-gray-200 bg-gray-50/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${c.text}`} />
                  <span className={`text-sm font-semibold ${config.isActive ? c.text : "text-gray-600"}`}>
                    {SHIFT_LABELS[shift]}
                  </span>
                  {dirty && (
                    <span className="text-[10px] text-amber-600 font-medium">●</span>
                  )}
                </div>
                <Switch
                  checked={config.isActive}
                  onCheckedChange={() => onToggle(selectedDow, shift)}
                />
              </div>

              {config.isActive && (
                <div className="grid grid-cols-[1fr_1fr_88px] gap-3 mt-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <Input
                      type="time"
                      value={trimTime(config.startTime)}
                      onChange={e => onUpdate(selectedDow, shift, { startTime: e.target.value })}
                      className="text-sm h-9"
                      aria-label="Início"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <Input
                      type="time"
                      value={trimTime(config.endTime)}
                      onChange={e => onUpdate(selectedDow, shift, { endTime: e.target.value })}
                      className="text-sm h-9"
                      aria-label="Fim"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      step={1}
                      value={config.capacity}
                      onChange={e => onUpdate(selectedDow, shift, {
                        capacity: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)),
                      })}
                      className="text-sm h-9 w-14"
                      aria-label="Vagas"
                    />
                    <span className="text-[11px] text-gray-500">vagas</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
