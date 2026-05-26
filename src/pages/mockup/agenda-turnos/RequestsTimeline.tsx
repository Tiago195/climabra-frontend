import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AirVent, MapPin, Navigation, FileText, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import {
  APPOINTMENTS,
  PROVIDER,
  TODAY,
  MockupShell,
  ShiftBadge,
  clientById,
  equipmentById,
  distanceKm,
  slotsForDate,
  SHIFT_LABELS,
  SHIFT_COLORS,
  SHIFT_ICONS,
  type Shift,
} from "./_shared";

export default function RequestsTimeline() {
  const [date, setDate] = useState(TODAY);
  const [sortMode, setSortMode] = useState<"proximity" | "shift">("proximity");

  const dates = ["2026-05-26", "2026-05-27", "2026-05-28", "2026-05-29"];

  const dayAppts = APPOINTMENTS
    .filter(a => a.scheduledDate === date && a.status === "scheduled")
    .map(a => {
      const cli = clientById(a.clientId);
      const dist = distanceKm(PROVIDER, cli);
      return { ...a, client: cli, distance: dist };
    });

  // Quando rota por proximidade: ordena por distância acumulada (greedy a partir da base)
  const sorted = sortMode === "proximity"
    ? [...dayAppts].sort((a, b) => a.distance - b.distance)
    : [...dayAppts].sort((a, b) => {
        const order: Shift[] = ["morning", "afternoon", "night"];
        const so = order.indexOf(a.shift) - order.indexOf(b.shift);
        if (so !== 0) return so;
        return a.distance - b.distance;
      });

  const totalKm = sorted.reduce((s, a, i) => {
    if (i === 0) return a.distance;
    return s + distanceKm(sorted[i - 1].client, a.client);
  }, 0);

  return (
    <MockupShell title="Solicitações" subtitle="Variante B — Timeline por proximidade">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{APPOINTMENTS.length} no total</p>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-8" size="sm">
          <Plus className="w-3.5 h-3.5" /> Nova
        </Button>
      </div>

      {/* Date scroller */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {dates.map(d => {
          const dt = new Date(`${d}T00:00:00`);
          const count = APPOINTMENTS.filter(a => a.scheduledDate === d && a.status === "scheduled").length;
          const isSel = d === date;
          return (
            <button
              key={d}
              onClick={() => setDate(d)}
              className={`shrink-0 px-3 py-2 rounded-lg border text-left min-w-[72px] transition-all ${
                isSel ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <p className={`text-[10px] uppercase font-semibold ${isSel ? "text-blue-100" : "text-gray-400"}`}>
                {dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
              </p>
              <p className="text-base font-bold leading-tight">{dt.getDate()}</p>
              <p className={`text-[10px] ${isSel ? "text-blue-100" : "text-gray-500"}`}>{count} visitas</p>
            </button>
          );
        })}
      </div>

      {/* Capacidade por turno no dia selecionado */}
      <div className="grid grid-cols-3 gap-2">
        {(["morning", "afternoon", "night"] as Shift[]).map(shift => {
          const slot = slotsForDate(date).find(s => s.shift === shift);
          const c = SHIFT_COLORS[shift];
          const Icon = SHIFT_ICONS[shift];
          if (!slot) {
            return (
              <div key={shift} className="rounded-lg border border-dashed border-gray-200 p-2 text-center opacity-60">
                <Icon className="w-3.5 h-3.5 text-gray-300 mx-auto mb-0.5" />
                <p className="text-[10px] text-gray-400">Sem agenda</p>
              </div>
            );
          }
          const used = slot.capacity - slot.available;
          const pct = (used / slot.capacity) * 100;
          return (
            <div key={shift} className={`rounded-lg border p-2 ${c.bg} ${slot.blocked ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-1 mb-1">
                <Icon className={`w-3 h-3 ${c.text}`} />
                <span className={`text-[10px] font-semibold ${c.text}`}>{SHIFT_LABELS[shift]}</span>
              </div>
              <p className={`text-sm font-bold ${c.text}`}>{used}/{slot.capacity}</p>
              <div className="w-full h-1 bg-white/60 rounded-full mt-1 overflow-hidden">
                <div className={`h-full ${slot.blocked ? "bg-rose-500" : pct >= 100 ? "bg-red-500" : pct >= 60 ? "bg-orange-500" : "bg-blue-500"}`} style={{ width: `${slot.blocked ? 100 : pct}%` }} />
              </div>
              <p className="text-[9px] text-gray-600 mt-0.5">{slot.blocked ? "bloqueado" : pct >= 100 ? "lotado" : `${slot.available} vagas`}</p>
            </div>
          );
        })}
      </div>

      {/* Sort toggle */}
      <Card>
        <CardContent className="py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Navigation className="w-3.5 h-3.5 text-blue-600" /> Otimizar rota
            </div>
            <div className="flex bg-gray-100 rounded-md p-0.5">
              <button
                onClick={() => setSortMode("proximity")}
                className={`text-[11px] px-2 py-1 rounded font-medium ${sortMode === "proximity" ? "bg-white shadow text-blue-700" : "text-gray-500"}`}
              >
                Por proximidade
              </button>
              <button
                onClick={() => setSortMode("shift")}
                className={`text-[11px] px-2 py-1 rounded font-medium ${sortMode === "shift" ? "bg-white shadow text-blue-700" : "text-gray-500"}`}
              >
                Por turno
              </button>
            </div>
          </div>
          {sortMode === "proximity" && sorted.length > 0 && (
            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Saindo de <span className="font-medium text-gray-700">{PROVIDER.baseAddress.split("—")[0].trim()}</span>
              <span className="ml-auto font-semibold text-blue-700">~ {totalKm.toFixed(1)} km no total</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      {sorted.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-gray-500">Nenhuma visita neste dia</CardContent></Card>
      ) : (
        <div className="relative pl-7">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
          <div className="space-y-3">
            {sorted.map((a, i) => {
              const eqs = a.equipmentIds.map(equipmentById);
              const reportsDone = a.reports.filter(r => r.status === "completed").length;
              const prevDist = i === 0 ? a.distance : distanceKm(sorted[i - 1].client, a.client);
              return (
                <div key={a.id} className="relative">
                  <div className="absolute -left-7 top-3 w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  {sortMode === "proximity" && (
                    <p className="text-[10px] text-gray-400 mb-1 ml-1">
                      <Navigation className="w-2.5 h-2.5 inline mr-0.5" />
                      {i === 0 ? `${prevDist.toFixed(1)} km da base` : `+${prevDist.toFixed(1)} km do anterior`}
                    </p>
                  )}
                  <Card>
                    <CardContent className="py-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{a.client.name}</p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {a.client.street}, {a.client.number} — {a.client.neighborhood}
                          </p>
                        </div>
                        <ShiftBadge shift={a.shift} size="xs" />
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {eqs.map(eq => (
                          <span key={eq.id} className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            <AirVent className="w-2.5 h-2.5" />{eq.label}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t">
                        <span className="flex items-center gap-1">
                          {reportsDone === eqs.length && eqs.length > 0 ? (
                            <><CheckCircle2 className="w-3 h-3 text-green-600" /> Laudos prontos</>
                          ) : (
                            <><FileText className="w-3 h-3" /> {reportsDone}/{eqs.length} laudos</>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {SHIFT_LABELS[a.shift]}
                        </span>
                        <button className="text-blue-600 font-semibold flex items-center gap-0.5">
                          Abrir <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </MockupShell>
  );
}
