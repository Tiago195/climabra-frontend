import type { Shift } from "@/services/enums"
import type { IShiftSlot } from "@/services/availability"
import type { IAppointmentDetailResponse } from "@/services/appointment"
import type { IClientResponse } from "@/services/client"

/**
 * Adaptação do canvas "Nova Solicitação B - Timeline".
 *
 * O canvas original ranqueia turnos disponíveis por *proximidade geográfica*
 * (km via Haversine) entre o cliente novo e os clientes já agendados no
 * mesmo dia+turno. A API real ainda não tem lat/lng dos clientes, então
 * aproximamos com:
 *
 *   - mesma cidade + mesmo bairro → "mesmo bairro" (peso 20)
 *   - mesma cidade, bairro diferente → "mesma cidade" (peso 5)
 *
 * Penalidade leve para datas distantes (-0.5 por dia útil no futuro)
 * mantém os recomendados na primeira semana quando há empates.
 */
export interface ScoredSlot {
  date: string
  shift: Shift
  startTime: string
  endTime: string
  capacity: number
  available: number
  sameNeighborhoodCount: number
  sameCityCount: number
  score: number
}

interface SlotsByDate {
  /** YYYY-MM-DD → lista de turnos retornados por GET /providers/{token}/availability/slots */
  [date: string]: IShiftSlot[]
}

const SAME_NEIGHBORHOOD_WEIGHT = 20
const SAME_CITY_WEIGHT = 5
const DAY_PENALTY = 0.5

function normalize(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase()
}

export function buildSlotSuggestions(
  client: IClientResponse,
  clients: IClientResponse[],
  appointments: IAppointmentDetailResponse[],
  slotsByDate: SlotsByDate
): ScoredSlot[] {
  const clientById = new Map(clients.map(c => [c.id, c]))
  const targetNeighborhood = normalize(client.neighborhood)
  const targetCity = normalize(client.city)
  const targetState = normalize(client.state)

  const result: ScoredSlot[] = []
  const sortedDates = Object.keys(slotsByDate).sort()

  for (let dayIdx = 0; dayIdx < sortedDates.length; dayIdx++) {
    const date = sortedDates[dayIdx]
    const slots = slotsByDate[date]
    for (const s of slots) {
      if (s.blocked || s.available <= 0) continue

      const sameSlotAppts = appointments.filter(a =>
        a.appointment.scheduledDate === date &&
        a.appointment.shift === s.shift &&
        a.appointment.status === "scheduled" &&
        a.client.id !== client.id
      )

      let sameNeighborhood = 0
      let sameCity = 0
      for (const row of sameSlotAppts) {
        const c = clientById.get(row.client.id)
        if (!c) continue
        const otherCity = normalize(c.city)
        const otherState = normalize(c.state)
        if (otherCity !== targetCity || otherState !== targetState) continue
        if (normalize(c.neighborhood) === targetNeighborhood) sameNeighborhood++
        else sameCity++
      }

      const score =
        sameNeighborhood * SAME_NEIGHBORHOOD_WEIGHT +
        sameCity * SAME_CITY_WEIGHT -
        dayIdx * DAY_PENALTY

      result.push({
        date,
        shift: s.shift,
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: s.capacity,
        available: s.available,
        sameNeighborhoodCount: sameNeighborhood,
        sameCityCount: sameCity,
        score,
      })
    }
  }

  return result.sort((a, b) => b.score - a.score)
}

/** Próximos N dias úteis (pula sáb/dom) a partir de uma data base. */
export function nextBusinessDays(count: number, from: Date = new Date()): string[] {
  const dates: string[] = []
  const base = new Date(from)
  base.setHours(0, 0, 0, 0)
  let added = 0
  for (let i = 0; added < count && i < count * 3; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    dates.push(iso)
    added++
  }
  return dates
}
