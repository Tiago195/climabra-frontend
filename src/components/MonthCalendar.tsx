import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  CalendarDays, AlertTriangle, Ban, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/useIsMobile"
import { MONTH_NAMES_LONG } from "@/lib/shifts"
import { VISIT_TYPE_META, VISIT_TYPE_ORDER } from "@/lib/visitTypes"
import { agendaService, type ICalendarDay, type ICalendarResponse } from "@/services/agenda"
import { getApiErrorMessage } from "@/services/apiError"

/**
 * Calendário do mês — a "ponte" da Agenda Unificada (AGENDA-UNI · H3 · T3.3–T3.5).
 *
 * Componente **reutilizável e autossuficiente**: busca seu próprio read-model
 * (`GET /agenda/calendar`) e gerencia mês/semana/colapso internamente — NÃO depende
 * do estado da Agenda (vai ser reusado na Disponibilidade). O pai só informa qual dia
 * está selecionado (`selectedDate`) e decide o que fazer no clique (`onDayClick`), no
 * navegar de mês (`onMonthChange`) e ao carregar os dados (`onData`).
 *
 * Cada célula (frame 8 do wireframe): barra segmentada por tipo de trabalho
 * (1 tracinho = 1 visita, cores de `visitTypes.ts`) + trilho cinza de vagas restantes,
 * ⚠ pendência, hachura sem-expediente, ⛔ bloqueado, "F" feriado (title com o nome) e
 * anel azul no dia de hoje.
 */
interface MonthCalendarProps {
  token: string
  /** Dia selecionado ("YYYY-MM-DD") — controlado pelo pai; realça a célula. */
  selectedDate?: string | null
  /** Clique num dia: `day` é `null` para dias fora do mês carregado. */
  onDayClick?: (date: string, day: ICalendarDay | null) => void
  /**
   * Segurar o dia (~500ms) — atalho mobile (H4/T4.4). Quando disparado, o clique
   * subsequente é suprimido. `day` é `null` para dias fora do mês carregado.
   */
  onDayLongPress?: (date: string, day: ICalendarDay | null) => void
  /** Disparado quando o mês exibido muda (navegação ‹ › / Hoje) — o pai pode limpar o filtro. */
  onMonthChange?: (month: string) => void
  /** Entrega o read-model recém-carregado ao pai (ex.: para reaproveitar `days`/`summary`). */
  onData?: (data: ICalendarResponse) => void
  /** Mês inicial "YYYY-MM"; default = mês corrente. */
  initialMonth?: string
  collapsible?: boolean
  className?: string
  /**
   * Incremente este valor (ex.: contador) para forçar um refetch do mês atual sem
   * remontar o componente — útil quando o pai muda algo que afeta o calendário
   * (ex.: criar/excluir um bloqueio) fora do fluxo normal de navegação de mês.
   */
  refreshToken?: number
}

const pad = (n: number) => String(n).padStart(2, "0")
const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const currentMonth = () => todayISO().slice(0, 7)
const ymd = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return { y, m, d }
}
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
const daysInMonth = (month: string) => {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m, 0).getDate()
}
const firstWeekday = (month: string) => {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m - 1, 1).getDay() // 0=Domingo
}
const addMonths = (month: string, delta: number) => {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
const addDays = (iso: string, delta: number) => {
  const { y, m, d } = ymd(iso)
  const dt = new Date(y, m - 1, d + delta)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}
const weekStart = (iso: string) => {
  const { y, m, d } = ymd(iso)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() - dt.getDay()) // volta pro domingo
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}
const monthLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number)
  return `${MONTH_NAMES_LONG[m - 1]} ${y}`
}
const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"]
const MAX_TICKS = 8

/** Tracinhos da barra: colorido por visita agendada (ordem canônica) + trilho cinza de vagas. */
function buildTicks(day: ICalendarDay): { key: string; className: string }[] {
  const ticks: { key: string; className: string }[] = []
  for (const vt of VISIT_TYPE_ORDER) {
    const count = day.visits.find(v => v.visitType === vt)?.count ?? 0
    for (let i = 0; i < count; i++) ticks.push({ key: `${vt}-${i}`, className: VISIT_TYPE_META[vt].bar })
  }
  // Tipos fora da ordem canônica (defensivo) — cinza-escuro para não sumirem.
  for (const v of day.visits) {
    if (VISIT_TYPE_ORDER.includes(v.visitType)) continue
    for (let i = 0; i < v.count; i++) ticks.push({ key: `x-${v.visitType}-${i}`, className: "bg-gray-400" })
  }
  const free = Math.max(0, day.capacity - day.booked)
  for (let i = 0; i < free; i++) ticks.push({ key: `free-${i}`, className: "bg-gray-200" })
  return ticks.slice(0, MAX_TICKS)
}

/** Fundo hachurado (dias sem expediente). */
const HATCH_STYLE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgb(243 244 246) 0, rgb(243 244 246) 4px, transparent 4px, transparent 8px)",
}

export function MonthCalendar({
  token, selectedDate, onDayClick, onDayLongPress, onMonthChange, onData,
  initialMonth, collapsible = true, className = "", refreshToken,
}: MonthCalendarProps) {
  const isMobile = useIsMobile()
  const [month, setMonth] = useState(() => initialMonth ?? currentMonth())
  const [view, setView] = useState<"month" | "week">("month")
  const [anchor, setAnchor] = useState(() => todayISO()) // dia de referência da semana
  const [collapsed, setCollapsed] = useState(() => collapsible && isMobile)
  const [data, setData] = useState<ICalendarResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const today = useMemo(() => todayISO(), [])

  // Long-press (~500ms) = atalho mobile p/ bloquear o dia (H4/T4.4). O timer arma
  // no pointerdown; se disparar, marca `suppressClick` p/ o onClick não abrir a sheet.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClick = useRef(false)
  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }
  const startLongPress = (iso: string, day: ICalendarDay | null) => {
    if (!onDayLongPress || !day) return
    suppressClick.current = false
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      suppressClick.current = true
      onDayLongPress(iso, day)
    }, 500)
  }
  useEffect(() => () => clearLongPress(), [])

  // Segue a seleção do pai: mantém a semana exibida sobre o dia selecionado.
  useEffect(() => {
    if (selectedDate) setAnchor(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    let alive = true
    setLoading(true)
    agendaService.getCalendar(token, month)
      .then(res => {
        if (!alive) return
        setData(res)
        onData?.(res)
      })
      .catch(e => { if (alive) toast.error(getApiErrorMessage(e, "Erro ao carregar o calendário")) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // onData é estável o suficiente na prática; evita refetch por identidade de callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, month, refreshToken])

  const daysMap = useMemo(
    () => new Map((data?.days ?? []).map(d => [d.date, d])),
    [data],
  )

  const changeMonth = (next: string) => {
    if (next === month) return
    setMonth(next)
    onMonthChange?.(next)
  }

  const goPrev = () => {
    if (view === "week") {
      const a = addDays(anchor, -7)
      setAnchor(a)
      if (a.slice(0, 7) !== month) changeMonth(a.slice(0, 7))
    } else {
      changeMonth(addMonths(month, -1))
    }
  }
  const goNext = () => {
    if (view === "week") {
      const a = addDays(anchor, 7)
      setAnchor(a)
      if (a.slice(0, 7) !== month) changeMonth(a.slice(0, 7))
    } else {
      changeMonth(addMonths(month, 1))
    }
  }
  const goToday = () => {
    setAnchor(today)
    changeMonth(currentMonth())
  }

  // Células exibidas (null = vazio no grid do mês).
  const cells: (string | null)[] = useMemo(() => {
    if (view === "week") {
      const start = weekStart(anchor.slice(0, 7) === month ? anchor : `${month}-01`)
      return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }
    const offset = firstWeekday(month)
    const total = daysInMonth(month)
    const [y, m] = month.split("-").map(Number)
    const out: (string | null)[] = []
    for (let i = 0; i < offset; i++) out.push(null)
    for (let d = 1; d <= total; d++) out.push(isoOf(y, m, d))
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [view, month, anchor])

  const summary = data?.summary
  const summaryParts: string[] = []
  if (summary) {
    summaryParts.push(`${summary.totalVisits} visita${summary.totalVisits === 1 ? "" : "s"}`)
    if (summary.occupancyPercent != null) summaryParts.push(`${summary.occupancyPercent}% ocupação`)
    if (summary.blockedDays > 0) summaryParts.push(`${summary.blockedDays} bloqueio${summary.blockedDays === 1 ? "" : "s"}`)
    if (summary.holidays > 0) summaryParts.push(`${summary.holidays} feriado${summary.holidays === 1 ? "" : "s"}`)
    if (summary.pendingDays > 0) summaryParts.push(`${summary.pendingDays} pendência${summary.pendingDays === 1 ? "" : "s"}`)
  }

  return (
    <div
      data-testid="month-calendar"
      className={`rounded-xl border border-gray-200 bg-white ${className}`}
    >
      {/* Cabeçalho: navegação + mês + resumo + ações */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <button
          type="button"
          onClick={goPrev}
          aria-label={view === "week" ? "Semana anterior" : "Mês anterior"}
          className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0 text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-900 capitalize">
            <CalendarDays className="w-4 h-4 text-blue-600 shrink-0 hidden sm:inline-block" />
            <span className="truncate">{monthLabel(month)}</span>
            {loading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" />}
          </div>
          {summaryParts.length > 0 && (
            <p className="text-[11px] text-gray-500 truncate">{summaryParts.join(" · ")}</p>
          )}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label={view === "week" ? "Próxima semana" : "Próximo mês"}
          className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? "Expandir calendário" : "Recolher calendário"}
            aria-expanded={!collapsed}
            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Ações: Hoje + toggle Mês/Semana */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goToday}
              className="h-8 px-3 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Hoje
            </button>
            <div className="inline-flex rounded-md bg-gray-100 p-0.5">
              {(["month", "week"] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`h-7 px-3 rounded text-xs font-medium transition ${
                    view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {v === "month" ? "Mês" : "Semana"}
                </button>
              ))}
            </div>
          </div>

          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_INITIALS.map((w, i) => (
              <div key={i} className="text-center text-[10px] font-bold uppercase text-gray-400">
                {w}
              </div>
            ))}
          </div>

          {/* Grade */}
          <div className={`grid grid-cols-7 gap-1 ${loading ? "opacity-50" : ""}`}>
            {cells.map((iso, i) => {
              if (!iso) return <div key={`e-${i}`} className="min-h-[2.75rem] sm:min-h-[3.5rem]" />
              const day = daysMap.get(iso) ?? null
              const { d } = ymd(iso)
              const isToday = iso === today
              const isSelected = selectedDate === iso
              const outOfMonth = iso.slice(0, 7) !== month
              const clickable = !!day
              const ticks = day ? buildTicks(day) : []

              return (
                <button
                  key={iso}
                  type="button"
                  data-testid={`cal-day-${iso}`}
                  disabled={!clickable}
                  onClick={() => {
                    if (suppressClick.current) { suppressClick.current = false; return }
                    onDayClick?.(iso, day)
                  }}
                  onPointerDown={() => startLongPress(iso, day)}
                  onPointerUp={clearLongPress}
                  onPointerLeave={clearLongPress}
                  onPointerCancel={clearLongPress}
                  onContextMenu={e => { if (onDayLongPress) e.preventDefault() }}
                  title={day?.holiday ? day.holiday.name : undefined}
                  style={day?.noWork ? HATCH_STYLE : undefined}
                  className={[
                    "relative min-h-[2.75rem] sm:min-h-[3.5rem] rounded-lg border p-1 flex flex-col text-left transition",
                    isSelected
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : isToday
                        ? "border-transparent ring-2 ring-blue-500"
                        : "border-gray-100",
                    day?.blocked ? "bg-rose-50" : "",
                    outOfMonth ? "opacity-40" : "",
                    clickable ? "hover:bg-gray-50 cursor-pointer" : "cursor-default",
                  ].join(" ")}
                >
                  {/* Nº do dia + indicadores de estado */}
                  <div className="flex items-start justify-between gap-0.5">
                    <span
                      className={[
                        "text-xs leading-none font-semibold",
                        isToday ? "text-blue-700" : day?.noWork ? "text-gray-400" : "text-gray-700",
                      ].join(" ")}
                    >
                      {d}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {day?.holiday && (
                        <span
                          className="text-[9px] leading-none font-bold text-purple-700 bg-purple-100 rounded px-0.5"
                          title={day.holiday.name}
                        >
                          F
                        </span>
                      )}
                      {day?.hasPending && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      {day?.blocked && <Ban className="w-3 h-3 text-rose-500" />}
                    </span>
                  </div>

                  <div className="flex-1" />

                  {/* Barra segmentada (tipo de trabalho + vagas) */}
                  {ticks.length > 0 && (
                    <div className="flex items-center gap-[2px] h-1 mt-1">
                      {ticks.map(t => (
                        <span key={t.key} className={`flex-1 h-full rounded-full ${t.className}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legenda: 2 grupos */}
          <div className="pt-1 border-t border-gray-100 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Trabalho</span>
              {VISIT_TYPE_ORDER.map(vt => (
                <span key={vt} className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                  <span className={`w-2.5 h-1.5 rounded-full ${VISIT_TYPE_META[vt].dot}`} />
                  {VISIT_TYPE_META[vt].label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                <span className="w-2.5 h-1.5 rounded-full bg-gray-200" />
                Vaga livre
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Dia</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Pendência
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                <span className="w-3 h-3 rounded-sm border border-gray-200" style={HATCH_STYLE} /> Sem expediente
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                <Ban className="w-3 h-3 text-rose-500" /> Bloqueado
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                <span className="text-[9px] font-bold text-purple-700 bg-purple-100 rounded px-0.5 leading-none">F</span> Feriado
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                <span className="w-3 h-3 rounded ring-2 ring-blue-500" /> Hoje
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
