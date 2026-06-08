import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { IAppointmentDetailResponse } from "@/services/appointment";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** As 7 datas (ISO) da semana corrente, de segunda a domingo. */
function currentWeekDates(): string[] {
  const now = new Date();
  const offset = (now.getDay() + 6) % 7; // 0 = segunda
  const monday = new Date(now);
  monday.setDate(now.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISO(d);
  });
}

/**
 * "Visitas na semana" — barras Seg→Dom com o volume de visitas planejadas/feitas
 * (exclui canceladas). Hoje em destaque. Mesmo idioma visual do design.
 */
export function WeekVisitsChart({ appointments }: { appointments: IAppointmentDetailResponse[] }) {
  const { bars, total } = useMemo(() => {
    const week = currentWeekDates();
    const today = toISO(new Date());
    const counts = new Map(week.map(d => [d, 0]));
    for (const a of appointments) {
      if (a.appointment.status === "canceled") continue;
      if (counts.has(a.appointment.scheduledDate)) {
        counts.set(a.appointment.scheduledDate, counts.get(a.appointment.scheduledDate)! + 1);
      }
    }
    const bars = week.map((date, i) => ({
      label: DAY_LABELS[i],
      value: counts.get(date) ?? 0,
      today: date === today,
    }));
    return { bars, total: bars.reduce((s, b) => s + b.value, 0) };
  }, [appointments]);

  const max = Math.max(...bars.map(b => b.value), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Visitas na semana</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-900">{total}</span> {total === 1 ? "visita" : "visitas"}
          </p>
        </div>
        <TrendingUp className="w-4 h-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 h-24">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <span className={`text-[10px] tabular-nums ${b.today ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                {b.value}
              </span>
              <div
                className={`w-full rounded ${b.today ? "bg-blue-600" : "bg-blue-100"} transition-colors`}
                style={{ height: `${Math.max((b.value / max) * 100, 6)}%` }}
                aria-hidden
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-1.5">
          {bars.map((b, i) => (
            <span
              key={i}
              className={`flex-1 text-center text-[10px] uppercase tracking-wide ${b.today ? "text-blue-600 font-semibold" : "text-gray-400"}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
