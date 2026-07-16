import type { VisitType } from "@/services/enums"

/**
 * Fonte única do mapeamento **tipo de visita → cor/rótulo** usado pela ponte visual
 * do épico Agenda Unificada (AGENDA-UNI · decisões D5/D8):
 *
 *   - Padrão    → azul
 *   - Avaliação → verde
 *   - Execução  → laranja
 *
 * Reutilizado pelo calendário do mês (`MonthCalendar` — barra segmentada + legenda) e
 * pela borda esquerda dos cards de visita (`AppointmentTimelineView`), garantindo que o
 * mesmo trabalho tenha a mesma cor nos dois lugares. Vai ser reusado também na
 * Disponibilidade (próxima onda).
 *
 * OBS.: é intencionalmente distinto do `VisitTypePill` (que usa a paleta antiga
 * azul/teal e não pinta "standard"). Aqui todo tipo tem cor, inclusive o Padrão.
 */
export interface VisitTypeMeta {
  label: string
  /** Classe de fundo sólido para os tracinhos da barra do calendário. */
  bar: string
  /** Classe de fundo do "dot" da legenda. */
  dot: string
  /** Cor hex — para a borda inline dos cards (onde a ordem das classes Tailwind não é confiável). */
  hex: string
}

export const VISIT_TYPE_META: Record<VisitType, VisitTypeMeta> = {
  standard:   { label: "Padrão",    bar: "bg-blue-500",   dot: "bg-blue-500",   hex: "#3b82f6" },
  assessment: { label: "Avaliação", bar: "bg-green-500",  dot: "bg-green-500",  hex: "#22c55e" },
  execution:  { label: "Execução",  bar: "bg-orange-500", dot: "bg-orange-500", hex: "#f97316" },
}

/** Ordem canônica de exibição (legenda + montagem da barra segmentada). */
export const VISIT_TYPE_ORDER: VisitType[] = ["standard", "assessment", "execution"]
