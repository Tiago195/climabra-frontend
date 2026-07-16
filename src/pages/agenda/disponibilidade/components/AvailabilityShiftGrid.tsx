import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Shift } from "@/services/enums"
import type { ShiftConfig } from "./DayCard"
import { SHIFT_COLORS, SHIFT_ICONS, SHIFT_LABELS, SHIFT_ORDER } from "@/lib/shifts"

const DAY_LABELS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface Props {
  /** Função que devolve a configuração efetiva (local override → existing → default). */
  getConfig: (dayOfWeek: number, shift: Shift) => ShiftConfig
  /** Dirty flag por turno (mostra ● se foi alterado localmente). */
  isDirty: (dayOfWeek: number, shift: Shift) => boolean
  /** Dia da semana atualmente selecionado (0–6). */
  selectedDow: number
  onSelectDow: (dayOfWeek: number) => void
  /** Alterna ativo/inativo de um turno (também seleciona o dia). */
  onToggle: (dayOfWeek: number, shift: Shift) => void
}

/**
 * Grade compacta 3 turnos × 7 dias. Cada célula mostra a capacidade (ou "—"
 * quando inativo). Clicar alterna o turno e seleciona o dia.
 */
export function AvailabilityShiftGrid({
  getConfig,
  isDirty,
  selectedDow,
  onSelectDow,
  onToggle,
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Turnos por dia da semana</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Header dos dias */}
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-1.5 items-center">
          <div />
          {DAY_LABELS_SHORT.map((label, dow) => (
            <button
              key={dow}
              type="button"
              onClick={() => onSelectDow(dow)}
              className={`text-[11px] font-medium py-1 rounded transition-colors ${
                dow === selectedDow
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Linhas de turnos */}
        {SHIFT_ORDER.map(shift => {
          const c = SHIFT_COLORS[shift]
          const Icon = SHIFT_ICONS[shift]
          return (
            <div
              key={shift}
              className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-1.5 items-center"
            >
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${c.text}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{SHIFT_LABELS[shift]}</span>
              </div>
              {[0, 1, 2, 3, 4, 5, 6].map(dow => {
                const config = getConfig(dow, shift)
                const active = config.isActive
                const isSelDow = dow === selectedDow
                const dirty = isDirty(dow, shift)
                return (
                  <button
                    key={dow}
                    type="button"
                    onClick={() => {
                      onSelectDow(dow)
                      onToggle(dow, shift)
                    }}
                    className={`relative aspect-square rounded-md flex items-center justify-center text-[11px] font-bold transition-all ${
                      active
                        ? `${c.bg} ${c.text} ring-1 ${c.ring}`
                        : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                    } ${isSelDow ? "ring-2 ring-blue-500" : ""}`}
                  >
                    {active ? config.capacity : "—"}
                    {dirty && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}

        <p className="text-[11px] text-gray-400 pt-1">
          Toque numa célula para ativar/desativar · número = capacidade
        </p>
      </CardContent>
    </Card>
  )
}
