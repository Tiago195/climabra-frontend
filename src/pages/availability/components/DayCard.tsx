import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Clock } from "lucide-react"

export type DayConfig = {
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
  isActive: boolean
}

interface DayCardProps {
  label: string
  config: DayConfig
  isDirty: boolean
  onToggle: (checked: boolean) => void
  onUpdate: (updates: Partial<DayConfig>) => void
}

export function DayCard({ label, config, isDirty, onToggle, onUpdate }: DayCardProps) {
  return (
    <Card className={config.isActive ? "border-blue-200" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{label}</CardTitle>
            {isDirty && <span className="text-xs text-amber-600 font-medium">● alterado</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{config.isActive ? "Ativo" : "Inativo"}</span>
            <Switch checked={config.isActive} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardHeader>

      {config.isActive && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Início</Label>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <Input
                  type="time"
                  value={config.startTime}
                  onChange={e => onUpdate({ startTime: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fim</Label>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <Input
                  type="time"
                  value={config.endTime}
                  onChange={e => onUpdate({ endTime: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Duração (min)</Label>
              <Input
                type="number"
                min={15}
                max={480}
                step={15}
                value={config.slotDurationMinutes}
                onChange={e => onUpdate({ slotDurationMinutes: parseInt(e.target.value) || 60 })}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
