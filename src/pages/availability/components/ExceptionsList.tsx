import { Button } from "@/components/ui/button"
import { Calendar, Clock, Trash2 } from "lucide-react"
import type { IExceptionResponse } from "@/services/availability"
import { SHIFT_LABELS, SHIFT_ORDER } from "@/lib/shifts"

interface ExceptionsListProps {
  exceptions: IExceptionResponse[]
  onDelete: (id: string) => void
  deletingId?: string | null
}

const MONTH_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
]

/** Formata uma data ISO YYYY-MM-DD em "DD de mmm de YYYY" (sem timezone shift). */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} de ${MONTH_SHORT[m - 1]} de ${y}`
}

/** Formata um intervalo. Se mesmo dia, mostra data simples; senão, "X a Y". */
function formatRange(start: string, end: string): string {
  if (start === end) return formatDate(start)

  const [ys, ms] = start.split("-").map(Number)
  const [ye, me] = end.split("-").map(Number)
  const startDay = Number(start.split("-")[2])
  const endDay = Number(end.split("-")[2])

  // Mesmo mês e ano: "20 a 27 de dez de 2026"
  if (ys === ye && ms === me) {
    return `${startDay} a ${endDay} de ${MONTH_SHORT[ms - 1]} de ${ys}`
  }
  return `${formatDate(start)} a ${formatDate(end)}`
}

function formatShifts(shifts: IExceptionResponse["shifts"]): string {
  if (!shifts || shifts.length === 0) return "Dia inteiro"
  return SHIFT_ORDER.filter(s => shifts.includes(s))
    .map(s => SHIFT_LABELS[s])
    .join(", ")
}

export function ExceptionsList({ exceptions, onDelete, deletingId }: ExceptionsListProps) {
  if (exceptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4">
        <Calendar className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-700">Nenhuma exceção cadastrada</p>
        <p className="text-xs text-gray-500 mt-1">
          Clique no calendário acima ou em "+ Nova exceção" para começar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Próximas exceções
          <span className="text-gray-400 font-normal ml-1">({exceptions.length})</span>
        </h3>
      </div>
      <ul className="divide-y rounded-md border">
        {exceptions.map(e => {
          const isFullDay = !e.shifts || e.shifts.length === 0
          const Icon = isFullDay ? Calendar : Clock
          const isDeleting = deletingId === e.id

          return (
            <li
              key={e.id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <Icon className={`w-4 h-4 shrink-0 ${isFullDay ? "text-red-500" : "text-purple-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {formatRange(e.startDate, e.endDate)}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {formatShifts(e.shifts)}
                  {e.reason && <span> • {e.reason}</span>}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(e.id)}
                disabled={isDeleting}
                aria-label="Remover exceção"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
