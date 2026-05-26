import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AirVent, MapPin, Navigation, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  CLIENTS,
  EQUIPMENTS,
  PROVIDER,
  MockupShell,
  slotsForDate,
  distanceKm,
  EQUIPMENT_TYPE_LABELS,
  SHIFT_COLORS,
  SHIFT_LABELS,
  SHIFT_ICONS,
  DAY_NAMES_SHORT,
  MONTH_NAMES_SHORT,
  APPOINTMENTS,
  type Shift,
} from "./_shared";

interface ScoredSlot {
  date: string;
  shift: Shift;
  startTime: string;
  endTime: string;
  capacity: number;
  available: number;
  blocked: boolean;
  score: number;
  nearestKm: number | null;
  sharedRoute: number;
}

function buildSlotSuggestions(clientLat: number, clientLng: number): ScoredSlot[] {
  // Próximos 14 dias
  const today = new Date("2026-05-26T00:00:00");
  const out: ScoredSlot[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const slots = slotsForDate(iso);
    for (const s of slots) {
      if (s.blocked || s.available === 0) continue;
      // visitas já agendadas no mesmo dia+turno
      const sameSlotAppts = APPOINTMENTS.filter(a =>
        a.scheduledDate === iso && a.shift === s.shift && a.status === "scheduled"
      );
      const distances = sameSlotAppts.map(a => {
        const c = CLIENTS.find(c => c.id === a.clientId)!;
        return distanceKm({ lat: clientLat, lng: clientLng }, c);
      });
      const nearest = distances.length ? Math.min(...distances) : null;
      const shared = distances.filter(d => d < 3).length; // <3km = mesma rota
      // score: menor distância e mais visitas próximas = melhor
      const proximityScore = nearest === null ? 0 : Math.max(0, 30 - nearest * 5);
      const score = proximityScore + shared * 15 + i * -0.5;
      out.push({
        date: iso,
        shift: s.shift,
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: s.capacity,
        available: s.available,
        blocked: false,
        score,
        nearestKm: nearest,
        sharedRoute: shared,
      });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

export default function NewRequestTimeline() {
  const [clientId, setClientId] = useState("c4");
  const [selectedEqs, setSelectedEqs] = useState<string[]>(["e7"]);
  const [picked, setPicked] = useState<{ date: string; shift: Shift } | null>({ date: "2026-05-26", shift: "morning" });

  const client = CLIENTS.find(c => c.id === clientId)!;
  const clientEqs = EQUIPMENTS.filter(e => e.clientId === clientId);
  const suggestions = buildSlotSuggestions(client.lat, client.lng);
  const distFromBase = distanceKm(PROVIDER, client);

  const best = suggestions.slice(0, 4);
  const others = suggestions.slice(4, 10);

  return (
    <MockupShell title="Nova Solicitação" subtitle="Variante B — Sugestões por proximidade">
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Cliente</Label>
            <select
              value={clientId}
              onChange={e => { setClientId(e.target.value); setSelectedEqs([]); setPicked(null); }}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {client.street}, {client.number} — {client.neighborhood}
              <span className="ml-auto font-semibold text-blue-700">{distFromBase.toFixed(1)} km da base</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Equipamentos ({selectedEqs.length})</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {clientEqs.map(eq => {
                const on = selectedEqs.includes(eq.id);
                return (
                  <label key={eq.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors text-sm ${
                    on ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}>
                    <input type="checkbox" checked={on} onChange={() => setSelectedEqs(p => p.includes(eq.id) ? p.filter(x => x !== eq.id) : [...p, eq.id])} className="accent-blue-600" />
                    <AirVent className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium text-gray-800">{eq.label}</span>
                    <span className="text-[11px] text-gray-400">— {EQUIPMENT_TYPE_LABELS[eq.type]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <Label className="text-xs uppercase tracking-wide text-gray-500">Melhores horários para esta rota</Label>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Navigation className="w-3 h-3" /> Otimizado
          </span>
        </div>

        {best.map(s => {
          const c = SHIFT_COLORS[s.shift];
          const Icon = SHIFT_ICONS[s.shift];
          const d = new Date(`${s.date}T00:00:00`);
          const isPicked = picked?.date === s.date && picked?.shift === s.shift;
          const isTopPick = s === best[0];
          return (
            <button
              key={`${s.date}-${s.shift}`}
              onClick={() => setPicked({ date: s.date, shift: s.shift })}
              className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                isPicked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              {isTopPick && (
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-700 mb-1">
                  <CheckCircle2 className="w-3 h-3" /> Recomendado
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg w-12 py-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400">{DAY_NAMES_SHORT[d.getDay()]}</span>
                  <span className="text-base font-bold text-gray-900 leading-none">{d.getDate()}</span>
                  <span className="text-[9px] text-gray-400">{MONTH_NAMES_SHORT[d.getMonth()]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${c.bg} ${c.text}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{SHIFT_LABELS[s.shift]}</span>
                    <span className="text-[11px] text-gray-500">{s.startTime}–{s.endTime}</span>
                  </div>
                  {s.sharedRoute > 0 ? (
                    <p className="text-[11px] text-green-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="font-semibold">{s.sharedRoute} visita{s.sharedRoute > 1 ? "s" : ""}</span> na mesma região
                      {s.nearestKm !== null && <span className="text-gray-500"> · {s.nearestKm.toFixed(1)} km</span>}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Sem visitas próximas neste turno
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs flex items-center gap-1 justify-end">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="font-semibold text-gray-700">{s.available}/{s.capacity}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <details className="px-1">
        <summary className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700">
          Ver mais opções ({others.length})
        </summary>
        <div className="space-y-1.5 mt-2">
          {others.map(s => {
            const d = new Date(`${s.date}T00:00:00`);
            return (
              <button
                key={`${s.date}-${s.shift}`}
                onClick={() => setPicked({ date: s.date, shift: s.shift })}
                className="w-full flex items-center justify-between text-left text-xs px-3 py-2 rounded-md border border-gray-200 bg-white hover:border-blue-300"
              >
                <span>
                  <span className="font-semibold">{d.getDate()}/{d.getMonth() + 1}</span>
                  <span className="text-gray-500 ml-1">{DAY_NAMES_SHORT[d.getDay()]} · {SHIFT_LABELS[s.shift]}</span>
                </span>
                {s.nearestKm !== null && (
                  <span className="text-gray-500">{s.nearestKm.toFixed(1)} km</span>
                )}
              </button>
            );
          })}
        </div>
      </details>

      {picked && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="py-3">
            <p className="text-[11px] uppercase font-bold text-blue-700 tracking-wider mb-1">Selecionado</p>
            <p className="text-sm font-semibold text-gray-800">
              {new Date(`${picked.date}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
            <p className="text-xs text-gray-600">Turno da {SHIFT_LABELS[picked.shift].toLowerCase()}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 pt-2 sticky bottom-0 bg-gray-50 -mx-4 px-4 pb-2">
        <Button variant="outline" className="flex-1">Cancelar</Button>
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5"
          disabled={!picked || selectedEqs.length === 0}
        >
          <CheckCircle2 className="w-4 h-4" /> Agendar
        </Button>
      </div>

      {!picked && selectedEqs.length === 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded-md px-2 py-1.5">
          <AlertCircle className="w-3 h-3" /> Selecione equipamentos e um horário
        </div>
      )}
    </MockupShell>
  );
}
