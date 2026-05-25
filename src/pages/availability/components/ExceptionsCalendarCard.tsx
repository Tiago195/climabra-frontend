import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import type { IExceptionResponse } from "@/services/availability"

interface ExceptionsCalendarCardProps {
  exceptions: IExceptionResponse[]
  onAddClick: (date?: string) => void
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

/** Retorna o status de bloqueio de uma data YYYY-MM-DD baseado nas exceções. */
function getDateStatus(date: string, exceptions: IExceptionResponse[]): "full" | "partial" | "none" {
  let hasPartial = false
  for (const e of exceptions) {
    if (date >= e.startDate && date <= e.endDate) {
      if (e.startTime === null) return "full"
      hasPartial = true
    }
  }
  return hasPartial ? "partial" : "none"
}

function isoDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

export function ExceptionsCalendarCard({ exceptions, onAddClick }: ExceptionsCalendarCardProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const grid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()  // 0 = Domingo
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: ({ day: number; date: string } | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: isoDate(viewYear, viewMonth, d) })
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewYear, viewMonth])

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Exceções e dias bloqueados</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Bloqueie feriados, férias ou faixas pontuais para evitar agendamentos.
            </p>
          </div>
          <Button size="sm" onClick={() => onAddClick()}>
            <Plus className="w-4 h-4 mr-1" />
            Nova exceção
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goPrev} aria-label="Mês anterior">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            {MONTH_NAMES[viewMonth]} de {viewYear}
          </span>
          <Button variant="ghost" size="icon" onClick={goNext} aria-label="Próximo mês">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
          {WEEKDAYS.map(w => (
            <div key={w} className="py-1 font-medium">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            if (!cell) return <div key={i} className="aspect-square" />
            const status = getDateStatus(cell.date, exceptions)
            const isToday = cell.date === todayIso

            const baseClasses =
              "aspect-square flex items-center justify-center rounded-md text-sm transition-colors relative cursor-pointer hover:bg-gray-100"
            const statusClasses =
              status === "full"
                ? "bg-red-100 text-red-700 hover:bg-red-200 font-medium"
                : status === "partial"
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  : ""
            const todayClasses = isToday ? "ring-2 ring-blue-500" : ""

            return (
              <button
                key={i}
                type="button"
                onClick={() => onAddClick(cell.date)}
                className={`${baseClasses} ${statusClasses} ${todayClasses}`}
              >
                <span>{cell.day}</span>
                {status === "partial" && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500" />
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-red-200" />
            Dia inteiro bloqueado
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-purple-200" />
            Faixa horária bloqueada
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
