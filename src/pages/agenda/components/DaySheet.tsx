import { useMemo } from "react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { Plus, Ban, ChevronRight, AlertTriangle } from "lucide-react"
import { SHIFT_ORDER, SHIFT_LABELS, SHIFT_ICONS, SHIFT_COLORS } from "@/lib/shifts"
import { VISIT_TYPE_META } from "@/lib/visitTypes"
import type { Shift } from "@/services/enums"
import type { ICalendarDay, ICalendarShiftSlot } from "@/services/agenda"
import type { IAppointmentDetailResponse } from "@/services/appointment"

/**
 * Sheet do dia (AGENDA-UNI · H4 · T4.1) — abre ao tocar num dia do calendário.
 *
 * Mostra, para o dia tocado: vagas por turno (cards Manhã/Tarde/Noite com
 * ocupação/estado), visitas do dia agrupadas por turno (cards compactos que
 * levam à lista filtrada), e os atalhos "+ Nova visita neste dia" (pré-seleciona
 * data + 1º turno com vaga) e "⛔ Bloquear este dia" (D6/D7).
 *
 * Mobile-first via `ResponsiveModal` → bottom-sheet no mobile, Dialog no desktop.
 * NÃO busca dados: reusa o `ICalendarDay` (turnos/ocupação) que o calendário já
 * carregou + as `appointments` já em memória na Agenda.
 */
interface DaySheetProps {
  open: boolean
  /** Dia exibido ("YYYY-MM-DD"). `null` quando fechado. */
  date: string | null
  /** Hoje ("YYYY-MM-DD") — usado só para esconder as ações em dias já passados. */
  today: string
  /** Read-model do dia (turnos/ocupação/estado). Pode faltar em dias fora do mês carregado. */
  day: ICalendarDay | null
  /** Todas as visitas (a sheet filtra pela `date` e status "scheduled"). */
  appointments: IAppointmentDetailResponse[]
  onClose: () => void
  /** "+ Nova visita neste dia" — pré-seleciona data + turno (1º com vaga). */
  onNewVisit: (date: string, shift?: Shift) => void
  /** "⛔ Bloquear este dia" — abre o fluxo de bloqueio com a data pré-preenchida. */
  onBlockDay: (date: string) => void
  /** Clique numa visita / "ver na lista" — fecha a sheet, filtra a lista pelo dia e rola até ela. */
  onOpenInList: (date: string) => void
}

const formatDayTitle = (iso: string) => {
  const [y, m, dd] = iso.split("-").map(Number)
  const d = new Date(y, m - 1, dd)
  return d
    .toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
    .replace(/^\w/, c => c.toUpperCase())
}

/** 1º turno agendável (ativo, não bloqueado e com vaga) — usado no "+ Nova visita". */
function firstShiftWithVacancy(shifts: ICalendarShiftSlot[]): Shift | undefined {
  for (const s of SHIFT_ORDER) {
    const slot = shifts.find(x => x.shift === s)
    if (slot && slot.active && !slot.blocked && slot.capacity - slot.booked > 0) return s
  }
  return undefined
}

export function DaySheet({
  open, date, today, day, appointments, onClose, onNewVisit, onBlockDay, onOpenInList,
}: DaySheetProps) {
  // Visitas em aberto do dia, agrupadas por turno.
  const byShift = useMemo(() => {
    const map = new Map<Shift, IAppointmentDetailResponse[]>()
    if (!date) return map
    for (const row of appointments) {
      if (row.appointment.scheduledDate !== date) continue
      if (row.appointment.status !== "scheduled") continue
      const arr = map.get(row.appointment.shift) ?? []
      arr.push(row)
      map.set(row.appointment.shift, arr)
    }
    return map
  }, [appointments, date])

  const scheduledCount = useMemo(
    () => [...byShift.values()].reduce((n, arr) => n + arr.length, 0),
    [byShift],
  )

  const shifts = day?.shifts ?? []
  const suggestedShift = firstShiftWithVacancy(shifts)
  const canAddVisit = !day?.blocked && (day?.noWork ? false : true)
  // Dia já passado: nem "+ Nova visita" nem "Bloquear este dia" fazem sentido — o resto
  // do sheet (vagas/visitas, inclusive pendências) continua útil.
  const isPast = !!date && date < today

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={isOpen => { if (!isOpen) onClose() }}
      size="md"
      title={
        <span className="flex items-center gap-2 flex-wrap">
          {date ? formatDayTitle(date) : "Dia"}
          {day?.holiday && (
            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 rounded px-1.5 py-0.5">
              {day.holiday.name}
            </span>
          )}
          {day?.blocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 rounded px-1.5 py-0.5">
              <Ban className="w-3 h-3" /> Bloqueado
            </span>
          )}
          {!day?.blocked && day?.noWork && (
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
              Sem expediente
            </span>
          )}
        </span>
      }
      description="Vagas por turno, visitas do dia e ações rápidas"
    >
      <div className="space-y-4 pt-1">
        {/* Cards de turno — ocupação/vagas + estado */}
        <div className="grid grid-cols-3 gap-2">
          {SHIFT_ORDER.map(shift => {
            const slot = shifts.find(s => s.shift === shift) ?? null
            const Icon = SHIFT_ICONS[shift]
            const c = SHIFT_COLORS[shift]
            const inactive = !slot || !slot.active
            const blocked = !!slot?.blocked
            const capacity = slot?.capacity ?? 0
            const booked = slot?.booked ?? 0
            const free = Math.max(0, capacity - booked)
            const off = inactive || blocked
            return (
              <div
                key={shift}
                className={`rounded-lg border p-2 flex flex-col items-center text-center gap-0.5 ${
                  off ? "border-gray-200 bg-gray-50 opacity-70" : `${c.ring} ring-1 ${c.bg} border-transparent`
                }`}
              >
                <Icon className={`w-4 h-4 ${off ? "text-gray-400" : c.text}`} />
                <span className={`text-xs font-semibold ${off ? "text-gray-500" : c.text}`}>
                  {SHIFT_LABELS[shift]}
                </span>
                {blocked ? (
                  <span className="text-[10px] font-medium text-rose-600">Bloqueado</span>
                ) : inactive ? (
                  <span className="text-[10px] text-gray-400">Desligado</span>
                ) : (
                  <>
                    <span className="text-sm font-bold text-gray-900 leading-none">
                      {booked}/{capacity}
                    </span>
                    <span className={`text-[10px] font-medium ${free > 0 ? "text-green-600" : "text-gray-400"}`}>
                      {free > 0 ? `${free} vaga${free > 1 ? "s" : ""}` : "Lotado"}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Visitas do dia agrupadas por turno */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            {scheduledCount > 0
              ? `${scheduledCount} visita${scheduledCount > 1 ? "s" : ""} neste dia`
              : "Nenhuma visita agendada"}
          </p>

          {SHIFT_ORDER.map(shift => {
            const rows = byShift.get(shift)
            if (!rows || rows.length === 0) return null
            return (
              <div key={shift} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${SHIFT_COLORS[shift].chip}`}>
                    {SHIFT_LABELS[shift]}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {rows.length} visita{rows.length > 1 ? "s" : ""}
                  </span>
                </div>
                {rows.map(row => {
                  const meta = VISIT_TYPE_META[row.appointment.visitType]
                  return (
                    <button
                      key={row.appointment.id}
                      type="button"
                      onClick={() => date && onOpenInList(date)}
                      className="w-full flex items-center gap-2 text-left rounded-lg border border-gray-200 bg-white pl-2 pr-1.5 py-2 hover:bg-gray-50 transition"
                      style={{ borderLeftColor: meta.hex, borderLeftWidth: 4 }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {row.client.name}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </button>
                  )
                })}
              </div>
            )
          })}

          {scheduledCount > 0 && (
            <button
              type="button"
              onClick={() => date && onOpenInList(date)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todas na lista →
            </button>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2 sticky bottom-0 bg-white pt-3 border-t -mx-4 px-4 pb-1">
          {isPast ? (
            <p className="text-[11px] text-gray-400 text-center py-1">Dia já passou</p>
          ) : (
            <>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 gap-1.5"
                disabled={!date || !canAddVisit}
                onClick={() => date && onNewVisit(date, suggestedShift)}
              >
                <Plus className="w-4 h-4" /> Nova visita neste dia
              </Button>
              {!canAddVisit && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1 -mt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {day?.blocked ? "Dia bloqueado" : "Sem expediente neste dia"} — desbloqueie para agendar.
                </p>
              )}
              {!day?.blocked && (
                <Button
                  variant="outline"
                  className="w-full gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  disabled={!date}
                  onClick={() => date && onBlockDay(date)}
                >
                  <Ban className="w-4 h-4" /> Bloquear este dia
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </ResponsiveModal>
  )
}
