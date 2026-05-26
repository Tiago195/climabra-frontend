import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, AirVent, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  AVAILABILITY,
  CLIENTS,
  EQUIPMENTS,
  EXCEPTIONS,
  MONTH_NAMES_LONG,
  DAY_NAMES_SHORT,
  SHIFT_COLORS,
  SHIFT_LABELS,
  SHIFT_ICONS,
  TODAY,
  MockupShell,
  slotsForDate,
  EQUIPMENT_TYPE_LABELS,
  type Shift,
} from "./_shared";

export default function NewRequestCalendar() {
  const [clientId, setClientId] = useState("c3");
  const [selectedEqs, setSelectedEqs] = useState<string[]>(["e4", "e5"]);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);
  const [date, setDate] = useState<string | null>("2026-05-28");
  const [shift, setShift] = useState<Shift | null>("morning");

  const clientEqs = EQUIPMENTS.filter(e => e.clientId === clientId);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prev = () => (month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1));
  const next = () => (month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1));

  const dateKey = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  function dayState(d: number) {
    const key = dateKey(d);
    const dow = new Date(`${key}T00:00:00`).getDay();
    const has = AVAILABILITY.some(a => a.dayOfWeek === dow && a.isActive);
    const ex = EXCEPTIONS.find(e => key >= e.startDate && key <= e.endDate && e.shifts.length === 0);
    const isPast = key < TODAY;
    return { key, has, blocked: !!ex, isPast };
  }

  const slots = date ? slotsForDate(date) : [];

  return (
    <MockupShell title="Nova Solicitação" subtitle="Variante A — Calendário">
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Cliente</Label>
            <select
              value={clientId}
              onChange={e => { setClientId(e.target.value); setSelectedEqs([]); }}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Equipamentos ({selectedEqs.length} selecionados)</Label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {clientEqs.map(eq => {
                const on = selectedEqs.includes(eq.id);
                return (
                  <label key={eq.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors text-sm ${
                    on ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setSelectedEqs(prev => prev.includes(eq.id) ? prev.filter(x => x !== eq.id) : [...prev, eq.id])}
                      className="accent-blue-600"
                    />
                    <AirVent className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium text-gray-800">{eq.label}</span>
                    <span className="text-[11px] text-gray-400">— {EQUIPMENT_TYPE_LABELS[eq.type]} · {eq.brand}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 space-y-3">
          <Label className="text-xs">Data</Label>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
            <p className="text-sm font-semibold text-gray-700">{MONTH_NAMES_LONG[month]} {year}</p>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES_SHORT.map(d => <div key={d} className="text-center text-[10px] text-gray-400 py-0.5">{d}</div>)}
            {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const s = dayState(day);
              const isSelected = date === s.key;
              let cls = "text-gray-700 hover:bg-blue-50";
              if (!s.has || s.blocked) cls = "text-gray-300 bg-gray-50 cursor-not-allowed";
              if (s.isPast) cls = "text-gray-300 cursor-not-allowed";
              if (isSelected) cls = "bg-blue-600 text-white font-bold";
              return (
                <button
                  key={day}
                  disabled={!s.has || s.blocked || s.isPast}
                  onClick={() => { setDate(s.key); setShift(null); }}
                  className={`aspect-square rounded-md text-xs font-medium ${cls}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {date && (
        <Card>
          <CardContent className="py-4 space-y-2">
            <Label className="text-xs">Turno disponível</Label>
            {slots.length === 0 ? (
              <p className="text-xs text-gray-500">Sem turnos para este dia.</p>
            ) : (
              <div className="space-y-2">
                {slots.map(slot => {
                  const c = SHIFT_COLORS[slot.shift];
                  const Icon = SHIFT_ICONS[slot.shift];
                  const isSelected = shift === slot.shift;
                  const isFull = slot.available === 0;
                  const isDisabled = slot.blocked || isFull;
                  return (
                    <button
                      key={slot.shift}
                      disabled={isDisabled}
                      onClick={() => setShift(slot.shift)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        isDisabled ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed" :
                        isSelected ? "border-blue-500 bg-blue-50" :
                        "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg} ${c.text}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-800">{SHIFT_LABELS[slot.shift]}</p>
                          <p className="text-[11px] text-gray-500">{slot.startTime} – {slot.endTime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {slot.blocked ? (
                          <span className="text-[11px] text-rose-700 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Bloqueado
                          </span>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 text-xs justify-end">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className={`font-semibold ${isFull ? "text-red-600" : "text-gray-700"}`}>
                                {slot.available}/{slot.capacity}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400">
                              {isFull ? "lotado" : `${slot.available} vaga${slot.available > 1 ? "s" : ""}`}
                            </p>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 pt-2 sticky bottom-0 bg-gray-50 -mx-4 px-4 pb-2">
        <Button variant="outline" className="flex-1">Cancelar</Button>
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5"
          disabled={!clientId || !date || !shift || selectedEqs.length === 0}
        >
          <CheckCircle2 className="w-4 h-4" /> Agendar
        </Button>
      </div>
    </MockupShell>
  );
}
