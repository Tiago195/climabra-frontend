import type { Shift } from "@/services/enums"
import type { IShiftSlot } from "@/services/availability"
import type { IAppointmentDetailResponse } from "@/services/appointment"
import type { IClientResponse } from "@/services/client"

/**
 * Adaptação do canvas "Nova Solicitação B - Timeline".
 *
 * Ranqueia turnos disponíveis por *proximidade geográfica* entre o cliente novo
 * e os clientes já agendados no mesmo dia+turno. Agora que a API persiste
 * lat/lng dos clientes (Fase 2 — geocoding por CEP), a proximidade é medida em
 * **km via Haversine** ao cluster de visitas já marcadas naquele turno:
 *
 *   - visita a 0 km do novo cliente → peso máximo (~20)
 *   - peso decai linearmente até zerar em `NEAR_KM` (cluster considerado próximo)
 *
 * **Fallback por slot:** quando o cliente novo *ou* todas as visitas daquele
 * turno estão sem coordenadas (geocoding desligado / CEP não resolvido), aquele
 * slot cai no critério textual antigo (mesmo bairro = 20, mesma cidade = 5),
 * sem quebrar o ranking. Os dois sinais têm magnitude comparável, então o
 * ranking permanece coerente mesmo misturando slots com e sem coords.
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
  /** Critério textual (fallback) — visitas no mesmo bairro/cidade. */
  sameNeighborhoodCount: number
  sameCityCount: number
  /** Critério por coordenadas — quando este slot usou Haversine. */
  usesCoords: boolean
  /** Visitas com coords dentro de `NEAR_KM` no mesmo turno. */
  nearbyCount: number
  /** Distância (km) até a visita mais próxima do turno; null se não houver coords. */
  nearestKm: number | null
  score: number
}

interface SlotsByDate {
  /** YYYY-MM-DD → lista de turnos retornados por GET /providers/{token}/availability/slots */
  [date: string]: IShiftSlot[]
}

const SAME_NEIGHBORHOOD_WEIGHT = 20
const SAME_CITY_WEIGHT = 5
const DAY_PENALTY = 0.5
/** Raio (km) em que um cluster de visitas é considerado "próximo". */
const NEAR_KM = 8
/** Peso de uma visita a ~0 km (equivalente a "mesmo bairro"). */
const PROXIMITY_WEIGHT = 20

function normalize(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase()
}

function hasCoords(c: { lat?: number | null; lng?: number | null }): boolean {
  return typeof c.lat === "number" && typeof c.lng === "number"
}

/** ISO local (YYYY-MM-DD) de uma data. */
function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** "HH:mm[:ss]" → minutos desde meia-noite (para comparar horários). */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

/**
 * Um turno é "passado" quando é hoje e sua janela (endTime) já terminou — não
 * faz sentido agendar uma visita para um horário que já passou.
 */
export function isSlotInPast(
  date: string,
  endTime: string,
  now: Date = new Date()
): boolean {
  if (date !== toIsoDate(now)) return false
  return timeToMinutes(endTime) <= now.getHours() * 60 + now.getMinutes()
}

/** Distância em km entre duas coordenadas (Haversine). */
function haversineKm(
  aLat: number, aLng: number, bLat: number, bLng: number
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function buildSlotSuggestions(
  client: IClientResponse,
  clients: IClientResponse[],
  appointments: IAppointmentDetailResponse[],
  slotsByDate: SlotsByDate,
  now: Date = new Date()
): ScoredSlot[] {
  const clientById = new Map(clients.map(c => [c.id, c]))
  const targetNeighborhood = normalize(client.neighborhood)
  const targetCity = normalize(client.city)
  const targetState = normalize(client.state)
  const targetHasCoords = hasCoords(client)

  const result: ScoredSlot[] = []
  const sortedDates = Object.keys(slotsByDate).sort()

  for (let dayIdx = 0; dayIdx < sortedDates.length; dayIdx++) {
    const date = sortedDates[dayIdx]
    const slots = slotsByDate[date]
    for (const s of slots) {
      if (s.blocked || s.available <= 0) continue
      // Turno de hoje cuja janela já encerrou → horário no passado, não sugerir.
      if (isSlotInPast(date, s.endTime, now)) continue

      const sameSlotClients = appointments
        .filter(a =>
          a.appointment.scheduledDate === date &&
          a.appointment.shift === s.shift &&
          a.appointment.status === "scheduled" &&
          a.client.id !== client.id
        )
        .map(a => clientById.get(a.client.id))
        .filter((c): c is IClientResponse => !!c)

      // ── Critério por coordenadas (preferido quando há lat/lng) ───────────
      let coordWeight = 0
      let nearbyCount = 0
      let nearestKm: number | null = null
      let usedCoords = false
      if (targetHasCoords) {
        for (const c of sameSlotClients) {
          if (!hasCoords(c)) continue
          usedCoords = true
          const km = haversineKm(client.lat!, client.lng!, c.lat!, c.lng!)
          if (nearestKm === null || km < nearestKm) nearestKm = km
          if (km <= NEAR_KM) {
            nearbyCount++
            coordWeight += ((NEAR_KM - km) / NEAR_KM) * PROXIMITY_WEIGHT
          }
        }
      }

      let score: number
      let sameNeighborhood = 0
      let sameCity = 0
      if (usedCoords) {
        score = coordWeight - dayIdx * DAY_PENALTY
      } else {
        // ── Fallback textual (geocoding off / CEP não resolvido) ───────────
        for (const c of sameSlotClients) {
          const otherCity = normalize(c.city)
          const otherState = normalize(c.state)
          if (otherCity !== targetCity || otherState !== targetState) continue
          if (normalize(c.neighborhood) === targetNeighborhood) sameNeighborhood++
          else sameCity++
        }
        score =
          sameNeighborhood * SAME_NEIGHBORHOOD_WEIGHT +
          sameCity * SAME_CITY_WEIGHT -
          dayIdx * DAY_PENALTY
      }

      result.push({
        date,
        shift: s.shift,
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: s.capacity,
        available: s.available,
        sameNeighborhoodCount: sameNeighborhood,
        sameCityCount: sameCity,
        usesCoords: usedCoords,
        nearbyCount,
        nearestKm,
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
