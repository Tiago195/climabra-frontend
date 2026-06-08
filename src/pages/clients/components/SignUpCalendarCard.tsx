import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

interface Props {
  activeDays: number[];
  year: number;
  month: number;
  selectedDate: Date | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  /** Dias recomendados por proximidade (Fase 6), como "YYYY-MM-DD". */
  recommendedDates?: Set<string>;
  /** Dias não recomendados — provider tem visitas, mas só muito longe (provável recusa). */
  discouragedDates?: Set<string>;
  /** Vagas por dia ("YYYY-MM-DD" → {capacity, available}) p/ sinalizar lotado/poucas vagas. */
  dayStatus?: Map<string, { capacity: number; available: number }>;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "ok" | "few" | "full" a partir das vagas do dia (few = ≤ ~1/3 da capacidade). */
function vacancyLevel(s?: { capacity: number; available: number }): "ok" | "few" | "full" | null {
  if (!s || s.capacity <= 0) return null;
  if (s.available <= 0) return "full";
  if (s.available <= Math.ceil(s.capacity * 0.34)) return "few";
  return "ok";
}

export function SignUpCalendarCard({ activeDays, year, month, selectedDate, onPrevMonth, onNextMonth, onSelectDate, recommendedDates, discouragedDates, dayStatus }: Props) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isPast = (day: number) => {
    const d = new Date(year, month, day);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };
  const isUnavailable = (day: number) => !activeDays.includes(new Date(year, month, day).getDay());
  const isSelected = (day: number) =>
    selectedDate?.getFullYear() === year &&
    selectedDate?.getMonth() === month &&
    selectedDate?.getDate() === day;
  const dateKey = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const isRecommended = (day: number) => !!recommendedDates?.has(dateKey(day));
  const isDiscouraged = (day: number) => !!discouragedDates?.has(dateKey(day));
  const levelOf = (day: number) => vacancyLevel(dayStatus?.get(dateKey(day)));

  const bookable = (d: number) => !isPast(d) && !isUnavailable(d);
  const hasRecommended = days.some(d => isRecommended(d) && bookable(d));
  const hasDiscouraged = days.some(d => isDiscouraged(d) && bookable(d) && levelOf(d) !== "full");
  const hasFew = days.some(d => bookable(d) && levelOf(d) === "few");
  const hasFull = days.some(d => bookable(d) && levelOf(d) === "full");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onPrevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <CardTitle className="text-base">{MONTH_NAMES[month]} {year}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onNextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
          {days.map(day => {
            const past = isPast(day);
            const unavailable = isUnavailable(day);
            const selected = isSelected(day);
            const disabled = past || unavailable;
            const recommended = isRecommended(day) && !disabled && !selected;
            const discouraged = isDiscouraged(day) && !disabled && !selected && !recommended;
            const level = disabled ? null : levelOf(day);
            const titleParts = [
              recommended ? "O profissional já atende a sua região nesse dia" : null,
              discouraged ? "O profissional só tem visitas longe da sua região nesse dia — pode recusar" : null,
              level === "full" ? "Lotado" : level === "few" ? "Poucas vagas" : null,
            ].filter(Boolean);
            return (
              <button
                key={day}
                disabled={disabled}
                onClick={() => onSelectDate(new Date(year, month, day))}
                title={titleParts.length ? titleParts.join(" · ") : undefined}
                className={`relative w-full aspect-square rounded-full text-sm font-medium flex items-center justify-center transition-colors ${
                  selected ? "bg-blue-600 text-white"
                    : past ? "text-gray-300 cursor-not-allowed"
                    : unavailable ? "text-gray-300 bg-gray-50 cursor-not-allowed line-through"
                    : level === "full" ? "text-gray-400 hover:bg-gray-50"
                    : recommended ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-100"
                    : discouraged ? "border border-dashed border-orange-400 text-orange-700 hover:bg-orange-50"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
              >
                {day}
                {!selected && level && level !== "ok" && (
                  <span
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      level === "full" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white border border-gray-300" /> Disponível
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-100" /> Indisponível
          </span>
          {hasFew && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Poucas vagas
            </span>
          )}
          {hasFull && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Lotado
            </span>
          )}
          {hasRecommended && (
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-full bg-emerald-50 ring-1 ring-emerald-300" /> Sua região
            </span>
          )}
          {hasDiscouraged && (
            <span className="flex items-center gap-1.5 text-orange-700">
              <span className="w-3 h-3 rounded-full border border-dashed border-orange-400" /> Longe das visitas
            </span>
          )}
        </div>
        {hasRecommended && (
          <p className="mt-2 text-[11px] text-emerald-700">
            Os dias em verde já têm visitas do profissional na sua região.
          </p>
        )}
        {hasDiscouraged && (
          <p className="mt-1 text-[11px] text-orange-700">
            Nos dias tracejados em laranja o profissional só tem visitas longe da sua região — pode recusar o atendimento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
