import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, ChevronDown, ChevronRight, Ban, Clock, X } from "lucide-react";
import {
  AVAILABILITY,
  EXCEPTIONS,
  SHIFT_COLORS,
  SHIFT_LABELS,
  SHIFT_ICONS,
  MockupShell,
  formatDateBR,
  type Shift,
} from "./_shared";

const DAY_FULL = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const DAY_ORDER = [1,2,3,4,5,6,0]; // seg primeiro
const SHIFTS: Shift[] = ["morning", "afternoon", "night"];

export default function AvailabilityTimeline() {
  const [data, setData] = useState(AVAILABILITY);
  const [open, setOpen] = useState<number | null>(1);

  function get(dow: number, shift: Shift) {
    return data.find(a => a.dayOfWeek === dow && a.shift === shift);
  }

  function setCap(dow: number, shift: Shift, cap: number) {
    setData(data.map(a => a.dayOfWeek === dow && a.shift === shift ? { ...a, capacity: Math.max(1, Math.min(50, cap)) } : a));
  }

  function toggleShift(dow: number, shift: Shift) {
    const existing = get(dow, shift);
    if (existing) {
      setData(data.map(a => a === existing ? { ...a, isActive: !a.isActive } : a));
    } else {
      const defaults: Record<Shift, { startTime: string; endTime: string; capacity: number }> = {
        morning:   { startTime: "08:00", endTime: "12:00", capacity: 3 },
        afternoon: { startTime: "13:00", endTime: "18:00", capacity: 5 },
        night:     { startTime: "18:00", endTime: "22:00", capacity: 2 },
      };
      setData([...data, { dayOfWeek: dow, shift, ...defaults[shift], isActive: true }]);
    }
  }

  function dayStats(dow: number) {
    const slots = SHIFTS.map(s => get(dow, s)).filter(s => s?.isActive);
    const totalCap = slots.reduce((sum, s) => sum + (s?.capacity || 0), 0);
    return { activeShifts: slots.length, totalCap };
  }

  return (
    <MockupShell title="Configurar Agenda" subtitle="Variante B — Dia a dia">
      {/* Hero stats */}
      <Card>
        <CardContent className="py-4 flex items-center justify-around">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Esta semana</p>
            <p className="text-2xl font-bold text-blue-700">
              {data.filter(a => a.isActive).reduce((s, a) => s + a.capacity, 0)}
            </p>
            <p className="text-[10px] text-gray-500">visitas no total</p>
          </div>
          <div className="border-l h-12" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Turnos ativos</p>
            <p className="text-2xl font-bold text-gray-800">
              {data.filter(a => a.isActive).length}
            </p>
            <p className="text-[10px] text-gray-500">de {7 * 3} possíveis</p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de dias */}
      <div className="space-y-2">
        {DAY_ORDER.map(dow => {
          const stats = dayStats(dow);
          const isOpen = open === dow;
          const isActive = stats.activeShifts > 0;
          return (
            <Card key={dow} className={isActive ? "" : "opacity-60"}>
              <CardContent className="py-0 px-0">
                <button
                  onClick={() => setOpen(isOpen ? null : dow)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{DAY_FULL[dow]}</p>
                    <p className="text-[11px] text-gray-500">
                      {isActive
                        ? `${stats.activeShifts} turno${stats.activeShifts > 1 ? "s" : ""} · até ${stats.totalCap} visita${stats.totalCap > 1 ? "s" : ""}`
                        : "Sem agenda"}
                    </p>
                  </div>
                  {/* Mini barras dos turnos */}
                  <div className="flex gap-0.5">
                    {SHIFTS.map(s => {
                      const slot = get(dow, s);
                      const on = slot?.isActive;
                      const c = SHIFT_COLORS[s];
                      return (
                        <div
                          key={s}
                          className={`w-2 h-6 rounded-sm ${on ? c.chip.split(" ")[0] : "bg-gray-200"}`}
                          title={SHIFT_LABELS[s]}
                        />
                      );
                    })}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-2 border-t pt-3">
                    {SHIFTS.map(shift => {
                      const slot = get(dow, shift);
                      const c = SHIFT_COLORS[shift];
                      const Icon = SHIFT_ICONS[shift];
                      const active = !!slot?.isActive;
                      return (
                        <div key={shift} className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{SHIFT_LABELS[shift]}</p>
                            {slot ? (
                              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                <span>{slot.startTime}–{slot.endTime}</span>
                                {active && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <input
                                      type="number"
                                      min={1}
                                      max={50}
                                      value={slot.capacity}
                                      onChange={e => setCap(dow, shift, parseInt(e.target.value) || 1)}
                                      className="w-12 text-[11px] border border-gray-200 rounded px-1 py-0.5"
                                    />
                                    <span>vagas</span>
                                  </span>
                                )}
                                {!active && <span>{slot.capacity} vagas</span>}
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-400">Não configurado</p>
                            )}
                          </div>
                          <Switch checked={active} onCheckedChange={() => toggleShift(dow, shift)} />
                        </div>
                      );
                    })}
                    <Button variant="outline" size="sm" className="w-full h-7 text-[11px] gap-1 mt-1">
                      Copiar para outros dias
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Exceções */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Exceções</p>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
            <Plus className="w-3 h-3" /> Adicionar
          </Button>
        </div>
        {EXCEPTIONS.map(e => {
          const fullDay = e.shifts.length === 0;
          return (
            <Card key={e.id}>
              <CardContent className="py-2.5 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${fullDay ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"}`}>
                  {fullDay ? <Ban className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{e.reason}</p>
                  <p className="text-[11px] text-gray-500">
                    {e.startDate === e.endDate ? formatDateBR(e.startDate) : `${formatDateBR(e.startDate)} – ${formatDateBR(e.endDate)}`}
                  </p>
                </div>
                {!fullDay && (
                  <div className="flex gap-0.5">
                    {e.shifts.map(s => {
                      const Icon = SHIFT_ICONS[s];
                      const c = SHIFT_COLORS[s];
                      return (
                        <span key={s} className={`w-5 h-5 rounded ${c.bg} ${c.text} flex items-center justify-center`}>
                          <Icon className="w-3 h-3" />
                        </span>
                      );
                    })}
                  </div>
                )}
                <button className="text-gray-400 hover:text-rose-500 p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MockupShell>
  );
}
