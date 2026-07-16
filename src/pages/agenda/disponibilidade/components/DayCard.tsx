import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Clock, Sunrise, Sun, Moon, Users } from "lucide-react"
import type { Shift } from "@/services/enums"
import { SHIFT_LABELS, SHIFT_ORDER } from "@/lib/shifts"

export type ShiftConfig = {
  dayOfWeek: number
  shift: Shift
  startTime: string
  endTime: string
  capacity: number
  isActive: boolean
}

interface DayCardProps {
  label: string
  shifts: Record<Shift, ShiftConfig>
  dirtyShifts: Set<Shift>
  onToggle: (shift: Shift, checked: boolean) => void
  onUpdate: (shift: Shift, updates: Partial<ShiftConfig>) => void
}

const SHIFT_ICONS: Record<Shift, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
}

const SHIFT_BADGE_COLORS: Record<Shift, string> = {
  morning: "text-amber-600",
  afternoon: "text-orange-600",
  night: "text-indigo-600",
}

export function DayCard({ label, shifts, dirtyShifts, onToggle, onUpdate }: DayCardProps) {
  const anyActive = SHIFT_ORDER.some(s => shifts[s].isActive)
  const anyDirty = dirtyShifts.size > 0

  return (
    <Card className={anyActive ? "border-blue-200" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          {anyDirty && (
            <span className="text-xs text-amber-600 font-medium">● alterado</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {SHIFT_ORDER.map(shiftKey => {
          const config = shifts[shiftKey]
          const Icon = SHIFT_ICONS[shiftKey]
          const isDirty = dirtyShifts.has(shiftKey)

          return (
            <div
              key={shiftKey}
              className={`rounded-lg border px-3 py-3 transition-colors ${
                config.isActive ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-gray-50/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${SHIFT_BADGE_COLORS[shiftKey]}`} />
                  <span className="text-sm font-medium text-gray-800">
                    {SHIFT_LABELS[shiftKey]}
                  </span>
                  {isDirty && (
                    <span className="text-[10px] text-amber-600 font-medium">●</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {config.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <Switch
                    checked={config.isActive}
                    onCheckedChange={(checked) => onToggle(shiftKey, checked)}
                  />
                </div>
              </div>

              {config.isActive && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-gray-500">Início</Label>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <Input
                        type="time"
                        value={config.startTime}
                        onChange={e => onUpdate(shiftKey, { startTime: e.target.value })}
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-gray-500">Fim</Label>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <Input
                        type="time"
                        value={config.endTime}
                        onChange={e => onUpdate(shiftKey, { endTime: e.target.value })}
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-gray-500">Vagas</Label>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        step={1}
                        value={config.capacity}
                        onChange={e =>
                          onUpdate(shiftKey, {
                            capacity: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)),
                          })
                        }
                        className="text-sm h-9"
                      />
                    </div>
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
