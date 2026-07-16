import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import { SHIFT_LABELS, SHIFT_COLORS, formatDayLong } from "@/lib/shifts"
import type { Shift } from "@/services/enums"

/**
 * Scaffolding compartilhado do agrupamento "card-por-dia" (aprovado pelo Tiago 16/07),
 * reusado pela Agenda (Próximas — `AppointmentTimelineView`) e pelo Histórico
 * (`AppointmentHistoryView`).
 *
 * Padrão: UM Card por dia com header "Sexta, 17 de julho" + "N visitas" (dia 1×), e
 * dentro dele uma seção por turno com o rótulo do turno UMA vez (`ShiftSectionLabel`).
 * As entradas compactas (linha da visita) são específicas de cada view e entram como
 * `children`.
 */

/** Card de um dia: header (dia por extenso + contagem) + conteúdo (seções de turno). */
export function DayGroupCard({
  date, count, accent = false, children,
}: {
  date: string
  count: number
  /** Realce âmbar (dia agendado no passado / pendência). */
  accent?: boolean
  children: ReactNode
}) {
  return (
    <Card className={accent ? "border-amber-300 bg-amber-50/30" : undefined}>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <CalendarDays className={`w-4 h-4 shrink-0 ${accent ? "text-amber-500" : "text-gray-400"}`} />
            <p className="text-sm font-semibold text-gray-900 truncate">
              {formatDayLong(date)}
            </p>
          </div>
          <span className="text-[11px] font-medium text-gray-400 shrink-0">
            {count} visita{count > 1 ? "s" : ""}
          </span>
        </div>
        <div className="space-y-3">{children}</div>
      </CardContent>
    </Card>
  )
}

/** Rótulo de uma seção de turno dentro do card do dia (chip do turno + contagem). */
export function ShiftSectionLabel({ shift, count }: { shift: Shift; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${SHIFT_COLORS[shift].chip}`}>
        {SHIFT_LABELS[shift]}
      </span>
      <span className="text-[10px] text-gray-400">
        {count} visita{count > 1 ? "s" : ""}
      </span>
    </div>
  )
}
