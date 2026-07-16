import { createApi } from "."
import type { Shift, VisitType } from "./enums"

// Read-model agregado do calendário do mês (AGENDA-UNI · H3 · T3.1/T3.2).
// GET /agenda/calendar?month=YYYY-MM (autenticado). `month` opcional → mês corrente.
const api = createApi("/agenda")

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

/** Resumo do mês para o cabeçalho do calendário. Espelha `MonthSummaryDTO`. */
export interface ICalendarMonthSummary {
  totalVisits: number
  totalCapacity: number
  totalBooked: number
  /** Ocupação = booked / capacity em %; `null` quando não há capacidade no mês. */
  occupancyPercent: number | null
  blockedDays: number
  holidays: number
  pendingDays: number
}

/** Contagem de visitas por tipo de trabalho num dia. Espelha `VisitTypeCountDTO`. */
export interface ICalendarVisitTypeCount {
  visitType: VisitType
  count: number
}

/** Detalhe de um turno no dia (alimenta o sheet do dia — H4). Espelha `ShiftSlotDTO`. */
export interface ICalendarShiftSlot {
  shift: Shift
  active: boolean
  blocked: boolean
  capacity: number
  booked: number
}

/** Feriado do dia. `scope`: "NATIONAL" | "STATE_SP". Espelha `HolidayDTO`. */
export interface ICalendarHoliday {
  name: string
  scope: string
}

/**
 * Um dia do mês. Espelha `DayDTO`.
 *  - `capacity`: soma das vagas dos turnos ativos e não bloqueados;
 *  - `noWork`: sem expediente nesse dia da semana;
 *  - `blocked`: dia totalmente bloqueado (bloqueio parcial aparece só em `shifts`);
 *  - `hasPending`: dia vencido com visita ainda `scheduled` (⚠);
 *  - `holiday`: feriado do dia, ou `null`.
 */
export interface ICalendarDay {
  date: string                       // "YYYY-MM-DD"
  visits: ICalendarVisitTypeCount[]
  totalVisits: number
  capacity: number
  booked: number
  noWork: boolean
  blocked: boolean
  hasPending: boolean
  holiday: ICalendarHoliday | null
  shifts: ICalendarShiftSlot[]
}

export interface ICalendarResponse {
  month: string                      // "YYYY-MM"
  summary: ICalendarMonthSummary
  days: ICalendarDay[]
}

export const agendaService = {
  /** Calendário agregado do mês (`YYYY-MM`); sem `month` o backend usa o mês corrente. */
  async getCalendar(token: string, month?: string): Promise<ICalendarResponse> {
    const { data } = await api.get("/calendar", {
      ...authHeader(token),
      params: month ? { month } : undefined,
    })
    return data
  },
}
