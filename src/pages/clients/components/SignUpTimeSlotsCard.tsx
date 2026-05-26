import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2, Sunrise, Sun, Moon } from "lucide-react";
import type { Shift } from "@/services/enums";
import type { IShiftSlot } from "@/services/availability";
import { SHIFT_LABELS, SHIFT_ORDER, trimTime } from "@/lib/shifts";

interface Props {
  date: Date;
  shifts: IShiftSlot[];
  loading: boolean;
  selectedShift: Shift | null;
  onSelectShift: (shift: Shift) => void;
}

const SHIFT_ICONS: Record<Shift, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
};

export function SignUpTimeSlotsCard({ date, shifts, loading, selectedShift, onSelectShift }: Props) {
  // Garante ordem morning → afternoon → night
  const sortedShifts = [...shifts].sort(
    (a, b) => SHIFT_ORDER.indexOf(a.shift) - SHIFT_ORDER.indexOf(b.shift)
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
              return (
                <button
                  key={slot.shift}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelectShift(slot.shift)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border text-sm font-medium transition-all ${
                    isDisabled
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
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
      </CardContent>
    </Card>
  );
}
