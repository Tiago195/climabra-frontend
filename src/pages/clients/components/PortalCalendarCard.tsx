import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { IPortalAppointment } from "@/services/client";
import { MONTH_NAMES_LONG, DAY_NAMES_SHORT } from "@/lib/shifts";

interface Props {
  appointments: IPortalAppointment[];
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Calendário mensal navegável que destaca os dias com visitas agendadas
 * (status="scheduled"). Adaptação do canvas Portal A - Calendário.
 */
export function PortalCalendarCard({ appointments }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const todayStr = todayISO();

  /** Datas YYYY-MM-DD que têm uma visita agendada no mês corrente. */
  const apptDays = useMemo(() => {
    const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-`;
    return new Set(
      appointments
        .filter(a => a.status === "scheduled" && a.scheduledDate.startsWith(monthPrefix))
        .map(a => parseInt(a.scheduledDate.split("-")[2], 10))
    );
  }, [appointments, viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7" aria-label="Mês anterior">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <p className="text-xs font-semibold text-gray-600">
            {MONTH_NAMES_LONG[viewMonth]} {viewYear}
          </p>
          <Button type="button" variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7" aria-label="Próximo mês">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES_SHORT.map(d => (
            <div key={d} className="text-center text-[10px] text-gray-400 py-0.5">{d}</div>
          ))}
          {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const has = apptDays.has(day);
            const isToday = key === todayStr;
            return (
              <div key={day} className="aspect-square flex flex-col items-center justify-center text-xs">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full font-medium ${
                  has
                    ? "bg-blue-600 text-white font-bold"
                    : isToday
                      ? "ring-2 ring-blue-300 text-blue-700"
                      : "text-gray-700"
                }`}>
                  {day}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-500 text-center">
          Dias destacados = visitas agendadas
        </p>
      </CardContent>
    </Card>
  );
}
