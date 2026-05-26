import { Sun, Sunset, Moon } from "lucide-react"
import type { Shift } from "@/services/enums"

export const SHIFT_LABELS: Record<Shift, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
}

export const SHIFT_ORDER: Shift[] = ["morning", "afternoon", "night"]

export const DEFAULT_SHIFT_HOURS: Record<Shift, { startTime: string; endTime: string; capacity: number }> = {
  morning: { startTime: "08:00", endTime: "12:00", capacity: 3 },
  afternoon: { startTime: "13:00", endTime: "18:00", capacity: 5 },
  night: { startTime: "18:00", endTime: "22:00", capacity: 3 },
}

/** Paleta visual por turno (do canvas Agenda A - Grade). */
export const SHIFT_COLORS: Record<Shift, { bg: string; text: string; ring: string; chip: string }> = {
  morning:   { bg: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200",  chip: "bg-amber-100 text-amber-800" },
  afternoon: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", chip: "bg-orange-100 text-orange-800" },
  night:     { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", chip: "bg-indigo-100 text-indigo-800" },
}

export const SHIFT_ICONS: Record<Shift, typeof Sun> = {
  morning: Sun,
  afternoon: Sunset,
  night: Moon,
}

export const DAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
export const MONTH_NAMES_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
export const MONTH_NAMES_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

/**
 * Bucket para visitas **futuras / em aberto**.
 *
 * A regra de negócio é: enquanto a visita estiver com `status="scheduled"`,
 * ela continua na aba "Próximas". Se a data já passou e ainda não foi concluída
 * ou cancelada, ela vai para o bucket "pending" (precisa de ação).
 */
export type FutureBucket = "pending" | "today" | "week" | "later"

/** Mantido como alias para compat de imports antigos. */
export type Bucket = FutureBucket

export function futureBucketFor(dateISO: string, todayISO?: string): FutureBucket {
  const today = todayISO ?? new Date().toISOString().slice(0, 10)
  if (dateISO === today) return "today"
  const t = new Date(`${today}T00:00:00`).getTime()
  const d = new Date(`${dateISO}T00:00:00`).getTime()
  const diffDays = (d - t) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return "pending"
  if (diffDays > 0 && diffDays < 7) return "week"
  return "later"
}

/** Alias mantido para compat. */
export const bucketFor = futureBucketFor

export const FUTURE_BUCKET_LABELS: Record<FutureBucket, string> = {
  pending: "Pendente",
  today: "Hoje",
  week: "Esta semana",
  later: "Depois",
}

export const FUTURE_BUCKET_BARS: Record<FutureBucket, string> = {
  pending: "bg-amber-500",
  today: "bg-blue-600",
  week: "bg-blue-400",
  later: "bg-gray-300",
}

/** Alias mantidos para compat com código que importava BUCKET_LABELS / BUCKET_BARS. */
export const BUCKET_LABELS = FUTURE_BUCKET_LABELS
export const BUCKET_BARS = FUTURE_BUCKET_BARS

/** Bucket para visitas **passadas** (concluídas, canceladas, no_show). */
export type PastBucket = "thisWeek" | "thisMonth" | "older"

export function pastBucketFor(dateISO: string, todayISO?: string): PastBucket {
  const today = todayISO ?? new Date().toISOString().slice(0, 10)
  const t = new Date(`${today}T00:00:00`).getTime()
  const d = new Date(`${dateISO}T00:00:00`).getTime()
  const daysAgo = (t - d) / (1000 * 60 * 60 * 24)
  if (daysAgo < 7) return "thisWeek"
  if (daysAgo < 30) return "thisMonth"
  return "older"
}

export const PAST_BUCKET_LABELS: Record<PastBucket, string> = {
  thisWeek: "Esta semana",
  thisMonth: "Este mês",
  older: "Mais antigas",
}

export const PAST_BUCKET_BARS: Record<PastBucket, string> = {
  thisWeek: "bg-gray-500",
  thisMonth: "bg-gray-400",
  older: "bg-gray-300",
}

/** Rótulo relativo amigável (Hoje, Ontem, 3 dias atrás, em 5 dias, etc.). */
export function relativeDateLabel(dateISO: string, now: Date = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const [y, m, d] = dateISO.split("-").map(Number)
  const target = new Date(y, (m ?? 1) - 1, d ?? 1)
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Hoje"
  if (diffDays === 1) return "Ontem"
  if (diffDays === -1) return "Amanhã"
  if (diffDays > 0 && diffDays < 7) return `${diffDays} dias atrás`
  if (diffDays < 0 && diffDays > -7) return `em ${-diffDays} dias`
  if (diffDays >= 7 && diffDays < 30) {
    const w = Math.floor(diffDays / 7)
    return `${w} semana${w > 1 ? "s" : ""} atrás`
  }
  if (diffDays >= 30 && diffDays < 365) {
    const mo = Math.floor(diffDays / 30)
    return `${mo} ${mo === 1 ? "mês" : "meses"} atrás`
  }
  if (diffDays >= 365) {
    const yr = Math.floor(diffDays / 365)
    return `${yr} ano${yr > 1 ? "s" : ""} atrás`
  }
  return formatDateBr(dateISO)
}

/** Converte "HH:mm" ou "HH:mm:ss" para "HH:mm". */
export function trimTime(value: string): string {
  return value.length > 5 ? value.slice(0, 5) : value
}

/** Formata uma data ISO YYYY-MM-DD em texto local sem timezone shift. */
export function formatDateBr(iso: string, opts: { withWeekday?: boolean } = {}): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1)
  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(opts.withWeekday ? { weekday: "long" } : {}),
  })
}

/** "01/06/2026 • Manhã (08:00–12:00)" */
export function formatScheduledShift(
  scheduledDate: string,
  shift: Shift,
  shiftHours?: { startTime: string; endTime: string }
): string {
  const datePart = formatDateBr(scheduledDate)
  const hours = shiftHours
    ? ` (${trimTime(shiftHours.startTime)}–${trimTime(shiftHours.endTime)})`
    : ""
  return `${datePart} • ${SHIFT_LABELS[shift]}${hours}`
}

/** Compara dois (date, shift) — retorna negativo se A é antes de B. */
export function compareScheduledShift(
  a: { scheduledDate: string; shift: Shift },
  b: { scheduledDate: string; shift: Shift }
): number {
  if (a.scheduledDate !== b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate)
  return SHIFT_ORDER.indexOf(a.shift) - SHIFT_ORDER.indexOf(b.shift)
}

/** Diz se o turno em uma data ainda não acabou (usa fim do turno como horizonte). */
export function isFutureScheduled(scheduledDate: string, shift: Shift, now: Date = new Date()): boolean {
  const [y, m, d] = scheduledDate.split("-").map(Number)
  const { endTime } = DEFAULT_SHIFT_HOURS[shift]
  const [hh, mm] = endTime.split(":").map(Number)
  const end = new Date(y, (m ?? 1) - 1, d ?? 1, hh, mm)
  return end.getTime() >= now.getTime()
}
