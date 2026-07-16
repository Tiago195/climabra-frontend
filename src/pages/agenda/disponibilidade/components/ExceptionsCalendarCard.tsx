import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ban, Plus } from "lucide-react"
import { MonthCalendar } from "@/components/MonthCalendar"

interface ExceptionsCalendarCardProps {
  token: string
  /** Dia selecionado no calendário (destaque visual) — controlado pelo pai. */
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
  /** Abre o `AddExceptionDialog`; `date` pré-seleciona a data quando informada. */
  onAddClick: (date?: string) => void
  /** Incrementa para forçar o `MonthCalendar` a refetchar após criar/excluir bloqueio. */
  refreshToken?: number
}

const MONTH_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
]

/** Formata "YYYY-MM-DD" em "DD de mmm de YYYY" (sem timezone shift). */
function formatSelected(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} de ${MONTH_SHORT[m - 1]} de ${y}`
}

/**
 * Card "Bloqueios e folgas" da sub-tela Disponibilidade (AGENDA-UNI · D4/H2).
 *
 * Reusa o `MonthCalendar` (mesmo componente de Próximas) para que o prestador veja
 * onde já tem visita marcada, feriados e sem-expediente ANTES de bloquear um dia —
 * em vez do calendário simples de antes (só marcava vermelho/roxo por exceção).
 *
 * O clique no dia apenas seleciona/realça (visual); o fluxo de bloquear continua
 * 100% via `AddExceptionDialog` (botão do header ou o atalho "Bloquear este dia"
 * que aparece quando há um dia selecionado).
 */
export function ExceptionsCalendarCard({
  token, selectedDate, onSelectDate, onAddClick, refreshToken,
}: ExceptionsCalendarCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">Bloqueios e folgas</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Veja onde já tem visita marcada antes de bloquear um feriado, folga ou período de férias.
            </p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => onAddClick()}>
            <Plus className="w-4 h-4 mr-1" />
            Bloquear data
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <MonthCalendar
          token={token}
          selectedDate={selectedDate}
          onDayClick={date => onSelectDate(selectedDate === date ? null : date)}
          refreshToken={refreshToken}
          collapsible={false}
        />

        {selectedDate && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <span className="text-sm text-blue-800 truncate">
              Dia selecionado: {formatSelected(selectedDate)}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => onAddClick(selectedDate)}
            >
              <Ban className="w-4 h-4 mr-1" />
              Bloquear este dia
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
