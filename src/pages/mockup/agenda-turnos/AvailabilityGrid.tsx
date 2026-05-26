import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, X, Ban, Clock } from "lucide-react";
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

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SHIFTS: Shift[] = ["morning", "afternoon", "night"];

const DAY_FULL = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

export default function AvailabilityGrid() {
  const [data, setData] = useState(AVAILABILITY);
  const [selectedDow, setSelectedDow] = useState<number>(1);

  function get(dow: number, shift: Shift) {
    return data.find(a => a.dayOfWeek === dow && a.shift === shift);
  }

  function toggle(dow: number, shift: Shift) {
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

  function setCap(dow: number, shift: Shift, cap: number) {
    setData(data.map(a => a.dayOfWeek === dow && a.shift === shift ? { ...a, capacity: cap } : a));
  }

  const totalWeekCap = data.filter(a => a.isActive).reduce((s, a) => s + a.capacity, 0);
  const activeDays = new Set(data.filter(a => a.isActive).map(a => a.dayOfWeek)).size;

  return (
    <MockupShell title="Configurar Agenda" subtitle="Variante A — Grade semanal">
      <Card>
        <CardContent className="py-3 flex items-center justify-around text-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">Dias ativos</p>
            <p className="text-lg font-bold text-gray-800">{activeDays}/7</p>
          </div>
          <div className="border-l h-8" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">Capac. semanal</p>
            <p className="text-lg font-bold text-blue-700">{totalWeekCap} visitas</p>
          </div>
        </CardContent>
      </Card>

      {/* Grade: 1 linha por turno × 7 colunas */}
      <Card>
        <CardContent className="py-3 space-y-3">
          <p className="text-xs font-semibold text-gray-600">Turnos por dia da semana</p>

          {/* Header dos dias */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
            <div />
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-gray-500">{d}</div>
            ))}
          </div>

          {SHIFTS.map(shift => {
            const c = SHIFT_COLORS[shift];
            const Icon = SHIFT_ICONS[shift];
            return (
              <div key={shift} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 items-center">
                <div className="flex items-center gap-1">
                  <div className={`w-6 h-6 rounded ${c.bg} ${c.text} flex items-center justify-center`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700">{SHIFT_LABELS[shift]}</span>
                </div>
                {[0,1,2,3,4,5,6].map(dow => {
                  const slot = get(dow, shift);
                  const active = slot?.isActive;
                  const isSelDow = dow === selectedDow;
                  return (
                    <button
                      key={dow}
                      onClick={() => { setSelectedDow(dow); toggle(dow, shift); }}
                      className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
                        active ? `${c.bg} ${c.text} ring-1 ${c.ring}` :
                        "bg-gray-100 text-gray-300 hover:bg-gray-200"
                      } ${isSelDow ? "ring-2 ring-blue-500" : ""}`}
                    >
                      {active ? slot.capacity : "—"}
                    </button>
                  );
                })}
              </div>
            );
          })}

          <p className="text-[10px] text-gray-400 text-center pt-1">Toque numa célula para ativar/desativar · número = capacidade</p>
        </CardContent>
      </Card>

      {/* Detalhes do dia selecionado */}
      <Card>
        <CardContent className="py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600">Detalhes — {DAY_FULL[selectedDow]}</p>
            <div className="flex gap-0.5">
              {[1,2,3,4,5,6,0].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDow(d)}
                  className={`w-6 h-6 text-[10px] rounded font-semibold ${
                    d === selectedDow ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {["D","S","T","Q","Q","S","S"][d]}
                </button>
              ))}
            </div>
          </div>
          {SHIFTS.map(shift => {
            const slot = get(selectedDow, shift);
            const c = SHIFT_COLORS[shift];
            const Icon = SHIFT_ICONS[shift];
            const active = !!slot?.isActive;
            return (
              <div key={shift} className={`flex items-center gap-2 p-2 rounded-md border ${active ? "border-gray-200" : "border-gray-100 bg-gray-50 opacity-70"}`}>
                <div className={`w-7 h-7 rounded ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800">{SHIFT_LABELS[shift]}</p>
                    {slot && <span className="text-[11px] text-gray-500">{slot.startTime} – {slot.endTime}</span>}
                  </div>
                  {slot && active && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Users className="w-3 h-3 text-gray-400" />
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={slot.capacity}
                        onChange={e => setCap(selectedDow, shift, parseInt(e.target.value) || 1)}
                        className="w-12 text-xs border border-gray-200 rounded px-1.5 py-0.5"
                      />
                      <span className="text-[11px] text-gray-500">vagas</span>
                    </div>
                  )}
                </div>
                <Switch checked={active} onCheckedChange={() => toggle(selectedDow, shift)} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Exceções */}
      <Card>
        <CardContent className="py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600">Exceções</p>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
              <Plus className="w-3 h-3" /> Adicionar
            </Button>
          </div>
          {EXCEPTIONS.map(e => {
            const fullDay = e.shifts.length === 0;
            return (
              <div key={e.id} className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1.5">
                <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${fullDay ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"}`}>
                  {fullDay ? <Ban className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{e.reason}</p>
                  <p className="text-[10px] text-gray-500">
                    {e.startDate === e.endDate ? formatDateBR(e.startDate) : `${formatDateBR(e.startDate)} – ${formatDateBR(e.endDate)}`}
                    {fullDay ? " · dia inteiro" : ` · ${e.shifts.map(s => SHIFT_LABELS[s]).join(", ")}`}
                  </p>
                </div>
                <button className="text-gray-400 hover:text-rose-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </MockupShell>
  );
}
