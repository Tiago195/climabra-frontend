import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2, Sunrise, Sun, Moon, MapPin, AlertTriangle } from "lucide-react";
import type { Shift } from "@/services/enums";
import type { IShiftSlot } from "@/services/availability";
import { SHIFT_LABELS, SHIFT_ORDER, trimTime } from "@/lib/shifts";

interface Props {
  date: Date;
  shifts: IShiftSlot[];
  loading: boolean;
  selectedShift: Shift | null;
  onSelectShift: (shift: Shift) => void;
  /** Turnos recomendados por proximidade (Fase 6) — o profissional já atende a região nesse dia. */
  recommended?: Set<Shift>;
  /** Turnos não recomendados — o profissional só tem visitas longe nesse turno (provável recusa). */
  discouraged?: Set<Shift>;
}

const SHIFT_ICONS: Record<Shift, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
};

export function SignUpTimeSlotsCard({ date, shifts, loading, selectedShift, onSelectShift, recommended, discouraged }: Props) {
  // Garante ordem morning → afternoon → night
  const sortedShifts = [...shifts].sort(
    (a, b) => SHIFT_ORDER.indexOf(a.shift) - SHIFT_ORDER.indexOf(b.shift)
  );
  const bookable = (s: IShiftSlot) => !s.blocked && s.available > 0;
  const hasRecommended = sortedShifts.some(s => recommended?.has(s.shift) && bookable(s));
  const hasDiscouraged = sortedShifts.some(
    s => discouraged?.has(s.shift) && !recommended?.has(s.shift) && bookable(s)
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Turnos em {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : sortedShifts.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            Nenhum turno configurado para essa data.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {sortedShifts.map(slot => {
              const Icon = SHIFT_ICONS[slot.shift];
              const isSelected = selectedShift === slot.shift;
              const isFull = !slot.blocked && slot.available === 0;
              const isBlocked = slot.blocked;
              const isDisabled = isBlocked || isFull;
              const isRecommended = !!recommended?.has(slot.shift) && !isDisabled;
              const isDiscouraged = !!discouraged?.has(slot.shift) && !isDisabled && !isRecommended;
              return (
                <button
                  key={slot.shift}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelectShift(slot.shift)}
                  title={isDiscouraged
                    ? "O profissional só tem visitas longe da sua região nesse turno — pode recusar"
                    : undefined}
                  className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-lg border text-sm font-medium transition-all ${
                    isDisabled
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : isRecommended
                          ? "border-emerald-400 ring-1 ring-emerald-300 text-gray-700 hover:bg-emerald-50"
                          : isDiscouraged
                            ? "border-dashed border-orange-400 text-orange-700 hover:bg-orange-50"
                            : "border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {isRecommended && (
                    <span
                      className={`absolute -top-2 -right-1 flex items-center justify-center rounded-full p-0.5 ${
                        isSelected ? "bg-white text-emerald-600" : "bg-emerald-500 text-white"
                      }`}
                      title="O profissional já atende a sua região nesse dia"
                    >
                      <MapPin className="w-3 h-3" />
                    </span>
                  )}
                  {isDiscouraged && (
                    <span
                      className="absolute -top-2 -right-1 flex items-center justify-center rounded-full p-0.5 bg-orange-500 text-white"
                      title="O profissional só tem visitas longe da sua região nesse turno — pode recusar"
                    >
                      <AlertTriangle className="w-3 h-3" />
                    </span>
                  )}
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{SHIFT_LABELS[slot.shift]}</span>
                  <span className={`text-[10px] ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
                    {trimTime(slot.startTime)}–{trimTime(slot.endTime)}
                  </span>
                  <span className={`text-[10px] font-medium ${
                    isBlocked
                      ? "text-red-500"
                      : isFull
                        ? "text-amber-600"
                        : isSelected
                          ? "text-blue-100"
                          : "text-emerald-600"
                  }`}>
                    {isBlocked
                      ? "Bloqueado"
                      : isFull
                        ? "Lotado"
                        : `${slot.available} vaga${slot.available > 1 ? "s" : ""}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {hasRecommended && !loading && (
          <p className="mt-3 text-[11px] text-emerald-700 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            O profissional já atende a sua região nesse dia — turno{" "}
            <span className="font-semibold">recomendado</span>.
          </p>
        )}
        {hasDiscouraged && !loading && (
          <p className="mt-2 text-[11px] text-orange-700 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>
              Nos turnos marcados em laranja o profissional só tem visitas longe da sua região —{" "}
              <span className="font-semibold">pode recusar</span> o atendimento.
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
