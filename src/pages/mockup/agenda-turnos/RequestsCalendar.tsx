import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Users, AlertCircle, ChevronDown } from "lucide-react";
import {
  APPOINTMENTS,
  AVAILABILITY,
  EXCEPTIONS,
  MONTH_NAMES_LONG,
  DAY_NAMES_SHORT,
  SHIFT_COLORS,
  SHIFT_LABELS,
  SHIFT_ICONS,
  TODAY,
  MockupShell,
  clientById,
  type Shift,
} from "./_shared";
import { EquipmentReportActions } from "./_actions";

export default function RequestsCalendar() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4); // maio
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [expandedId, setExpandedId] = useState<string | null>("a2");

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prev = () => (month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1));
  const next = () => (month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1));

  const dateKey = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  function dayInfoForKey(key: string) {
    const appts = APPOINTMENTS.filter(a => a.scheduledDate === key && a.status === "scheduled");
    const dow = new Date(`${key}T00:00:00`).getDay();
    const dayAvails = AVAILABILITY.filter(a => a.dayOfWeek === dow && a.isActive);
    const totalCap = dayAvails.reduce((s, a) => s + a.capacity, 0);
    const ex = EXCEPTIONS.find(e => key >= e.startDate && key <= e.endDate);
    const fullBlocked = ex && ex.shifts.length === 0;
    return { key, appts, totalCap, dayAvails, ex, fullBlocked };
  }

  function dayInfo(d: number) {
    return dayInfoForKey(dateKey(d));
  }

  const selected = dayInfoForKey(selectedDate);
  const todayApptsByShift: Record<Shift, typeof APPOINTMENTS> = {
    morning: selected.appts.filter(a => a.shift === "morning"),
    afternoon: selected.appts.filter(a => a.shift === "afternoon"),
    night: selected.appts.filter(a => a.shift === "night"),
  };

  return (
    <MockupShell title="Solicitações" subtitle="Variante A — Calendário">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{APPOINTMENTS.length} agendamentos no total</p>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-8" size="sm">
          <Plus className="w-3.5 h-3.5" /> Nova
        </Button>
      </div>

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={prev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-sm font-semibold text-gray-700">{MONTH_NAMES_LONG[month]} {year}</p>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={next}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES_SHORT.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
            ))}
            {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const info = dayInfo(day);
              const used = info.appts.length;
              const isSelected = selectedDate === info.key;
              const isToday = info.key === TODAY;
              const heat =
                info.fullBlocked ? "bg-rose-100 text-rose-700" :
                used === 0 ? "text-gray-700 hover:bg-gray-100" :
                used >= info.totalCap ? "bg-red-100 text-red-700" :
                used >= info.totalCap * 0.6 ? "bg-orange-100 text-orange-700" :
                "bg-blue-50 text-blue-700";
              const ring = isSelected ? "ring-2 ring-blue-500 ring-offset-1" :
                            isToday ? "ring-1 ring-blue-300" : "";
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(info.key)}
                  className={`aspect-square rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${heat} ${ring}`}
                >
                  <span>{day}</span>
                  {used > 0 && !info.fullBlocked && (
                    <span className="text-[9px] opacity-75">{used}/{info.totalCap}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-50 border border-blue-200" /> Disponível
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-orange-100" /> Quase cheio
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-100" /> Lotado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-100" /> Bloqueado
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>

        {selected.dayAvails.length === 0 && (
          <Card><CardContent className="py-6 text-center text-sm text-gray-500">Sem agenda configurada para este dia</CardContent></Card>
        )}

        {(["morning", "afternoon", "night"] as Shift[]).map(shift => {
          const av = selected.dayAvails.find(a => a.shift === shift);
          if (!av) return null;
          const appts = todayApptsByShift[shift];
          const c = SHIFT_COLORS[shift];
          const Icon = SHIFT_ICONS[shift];
          const isBlocked = selected.ex && (selected.ex.shifts.length === 0 || selected.ex.shifts.includes(shift));
          return (
            <Card key={shift} className={isBlocked ? "opacity-60" : ""}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg} ${c.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{SHIFT_LABELS[shift]}</p>
                      <p className="text-[11px] text-gray-500">{av.startTime} – {av.endTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="font-semibold text-gray-700">{appts.length}/{av.capacity}</span>
                  </div>
                </div>

                {isBlocked && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-700 bg-rose-50 rounded-md px-2 py-1">
                    <AlertCircle className="w-3 h-3" /> Bloqueado: {selected.ex?.reason}
                  </div>
                )}

                {appts.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic pl-10">Nenhuma visita</p>
                ) : (
                  <div className="space-y-1.5">
                    {appts.map(a => {
                      const cli = clientById(a.clientId);
                      const reportsDone = a.reports.filter(r => r.status === "completed").length;
                      const isOpen = expandedId === a.id;
                      return (
                        <div key={a.id} className="border border-gray-200 rounded-md overflow-hidden">
                          <button
                            onClick={() => setExpandedId(isOpen ? null : a.id)}
                            className="w-full px-2.5 py-2 text-left hover:bg-gray-50"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-800">{cli.name}</p>
                              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </div>
                            <p className="text-[10px] text-gray-500">
                              {a.equipmentIds.length} equipamento{a.equipmentIds.length > 1 ? "s" : ""} · {reportsDone}/{a.equipmentIds.length} laudos prontos
                            </p>
                          </button>
                          {isOpen && (
                            <div className="px-2.5 pb-2.5 pt-1 border-t bg-gray-50/50">
                              <EquipmentReportActions appt={a} compact />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MockupShell>
  );
}
