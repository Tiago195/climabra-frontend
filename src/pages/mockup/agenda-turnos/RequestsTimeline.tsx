import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Navigation, List, Map as MapIcon, Home } from "lucide-react";
import {
  APPOINTMENTS,
  PROVIDER,
  TODAY,
  MockupShell,
  ShiftBadge,
  clientById,
  distanceKm,
  MONTH_NAMES_SHORT,
  DAY_NAMES_SHORT,
} from "./_shared";
import { EquipmentReportActions } from "./_actions";

type Bucket = "today" | "week" | "later";
type ViewMode = "timeline" | "map";

function bucketFor(dateISO: string): Bucket {
  if (dateISO === TODAY) return "today";
  const today = new Date(`${TODAY}T00:00:00`);
  const d = new Date(`${dateISO}T00:00:00`);
  const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 7 && diff > 0) return "week";
  return "later";
}

const BUCKET_LABELS: Record<Bucket, string> = {
  today: "Hoje",
  week: "Esta semana",
  later: "Depois",
};

const BUCKET_BARS: Record<Bucket, string> = {
  today: "bg-blue-600",
  week: "bg-blue-400",
  later: "bg-gray-300",
};

export default function RequestsTimeline() {
  const [view, setView] = useState<ViewMode>("timeline");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // todas as visitas agendadas a partir de hoje, enriquecidas com distância da base
  const enriched = APPOINTMENTS
    .filter(a => a.status === "scheduled" && a.scheduledDate >= TODAY)
    .map(a => {
      const cli = clientById(a.clientId);
      return { ...a, client: cli, distance: distanceKm(PROVIDER, cli), bucket: bucketFor(a.scheduledDate) };
    });

  // agrupar por bucket, dentro do bucket ordenar por proximidade
  const groups: { bucket: Bucket; items: typeof enriched }[] = (["today","week","later"] as Bucket[]).map(b => ({
    bucket: b,
    items: enriched.filter(e => e.bucket === b).sort((a, b) => a.distance - b.distance),
  }));

  const todayItems = groups.find(g => g.bucket === "today")?.items ?? [];
  const totalKm = enriched.reduce((s, e) => s + e.distance, 0);

  // distância acumulada da rota do dia (base → 1 → 2 → ... → n)
  const todayRouteKm = useMemo(() => {
    if (todayItems.length === 0) return 0;
    let total = distanceKm(PROVIDER, todayItems[0].client);
    for (let i = 1; i < todayItems.length; i++) {
      total += distanceKm(todayItems[i - 1].client, todayItems[i].client);
    }
    return total;
  }, [todayItems]);

  function handlePinTap(id: string) {
    setSelectedId(id);
    // pequeno scroll para o card correspondente
    requestAnimationFrame(() => {
      cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <MockupShell title="Solicitações" subtitle="Variante B — Timeline por proximidade">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{enriched.length} visitas agendadas</p>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-8" size="sm">
          <Plus className="w-3.5 h-3.5" /> Nova
        </Button>
      </div>

      {/* Toggle Timeline / Mapa */}
      <div className="inline-flex rounded-lg bg-gray-100 p-0.5 w-full">
        <button
          onClick={() => setView("timeline")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 transition ${
            view === "timeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <List className="w-3.5 h-3.5" /> Timeline
        </button>
        <button
          onClick={() => setView("map")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 transition ${
            view === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" /> Mapa
        </button>
      </div>

      {view === "timeline" && (
        <>
          <Card>
            <CardContent className="py-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Ordenadas por proximidade dentro de cada período</span>
              </div>
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Saindo de <span className="font-medium text-gray-700">{PROVIDER.baseAddress.split("—")[0].trim()}</span>
                <span className="ml-auto font-semibold text-blue-700">Σ {totalKm.toFixed(1)} km</span>
              </p>
            </CardContent>
          </Card>

          {groups.map(g => {
            if (g.items.length === 0) return null;
            return (
              <div key={g.bucket} className="space-y-2">
                <div className="flex items-center gap-2 pt-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${BUCKET_BARS[g.bucket]}`} />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    {BUCKET_LABELS[g.bucket]}
                  </p>
                  <span className="text-[10px] text-gray-400">· {g.items.length} visita{g.items.length > 1 ? "s" : ""}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {g.items.map(a => {
                  const d = new Date(`${a.scheduledDate}T00:00:00`);
                  return (
                    <Card key={a.id}>
                      <CardContent className="py-3 space-y-2">
                        <div className="flex items-start gap-2.5">
                          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg w-11 py-1 shrink-0">
                            <span className="text-[9px] uppercase font-bold text-gray-400">{DAY_NAMES_SHORT[d.getDay()]}</span>
                            <span className="text-base font-bold text-gray-900 leading-none">{d.getDate()}</span>
                            <span className="text-[9px] text-gray-400">{MONTH_NAMES_SHORT[d.getMonth()]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">{a.client.name}</p>
                              <ShiftBadge shift={a.shift} size="xs" />
                            </div>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {a.client.neighborhood}
                              <span className="ml-auto inline-flex items-center gap-0.5 font-semibold text-blue-700">
                                <Navigation className="w-2.5 h-2.5" />
                                {a.distance.toFixed(1)} km
                              </span>
                            </p>
                          </div>
                        </div>

                        <EquipmentReportActions appt={a} compact />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}

          {enriched.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-gray-500">Nenhuma visita futura</CardContent></Card>
          )}
        </>
      )}

      {view === "map" && (
        <>
          <Card>
            <CardContent className="py-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Rota otimizada de hoje — {todayItems.length} parada{todayItems.length === 1 ? "" : "s"}</span>
              </div>
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <Home className="w-3 h-3" /> Base: <span className="font-medium text-gray-700">{PROVIDER.baseAddress.split("—")[0].trim()}</span>
                <span className="ml-auto font-semibold text-blue-700">Σ {todayRouteKm.toFixed(1)} km</span>
              </p>
            </CardContent>
          </Card>

          {todayItems.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-gray-500">Nenhuma visita para hoje</CardContent></Card>
          ) : (
            <>
              <RouteMap
                items={todayItems}
                selectedId={selectedId}
                onPinTap={handlePinTap}
              />

              <div className="space-y-2">
                {todayItems.map((a, idx) => {
                  const isSelected = a.id === selectedId;
                  return (
                    <div
                      key={a.id}
                      ref={el => { cardRefs.current[a.id] = el; }}
                    >
                      <Card className={isSelected ? "ring-2 ring-blue-500" : ""}>
                        <CardContent className="py-3 space-y-2">
                          <div className="flex items-start gap-2.5">
                            <div className="flex items-center justify-center bg-blue-600 text-white rounded-full w-7 h-7 shrink-0 text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">{a.client.name}</p>
                                <ShiftBadge shift={a.shift} size="xs" />
                              </div>
                              <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {a.client.neighborhood}
                                <span className="ml-auto inline-flex items-center gap-0.5 font-semibold text-blue-700">
                                  <Navigation className="w-2.5 h-2.5" />
                                  {a.distance.toFixed(1)} km
                                </span>
                              </p>
                            </div>
                          </div>

                          <EquipmentReportActions appt={a} compact />
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </MockupShell>
  );
}

/** Mapa SVG simples que projeta lat/lng dos pontos em um viewBox normalizado. */
function RouteMap({
  items,
  selectedId,
  onPinTap,
}: {
  items: Array<{ id: string; client: { name: string; lat: number; lng: number; neighborhood: string } }>;
  selectedId: string | null;
  onPinTap: (id: string) => void;
}) {
  const W = 320;
  const H = 240;
  const PAD = 28;

  // bounding box incluindo a base
  const lats = [PROVIDER.lat, ...items.map(i => i.client.lat)];
  const lngs = [PROVIDER.lng, ...items.map(i => i.client.lng)];
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = Math.max(maxLat - minLat, 0.001);
  const lngRange = Math.max(maxLng - minLng, 0.001);

  function project(lat: number, lng: number): [number, number] {
    const x = PAD + ((lng - minLng) / lngRange) * (W - 2 * PAD);
    // lat maior = mais ao norte = y menor
    const y = PAD + ((maxLat - lat) / latRange) * (H - 2 * PAD);
    return [x, y];
  }

  const basePt = project(PROVIDER.lat, PROVIDER.lng);
  const pts = items.map(i => project(i.client.lat, i.client.lng));
  const polyline = [basePt, ...pts].map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <Card>
      <CardContent className="p-2">
        <div className="rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 ring-1 ring-gray-200">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto block"
            role="img"
            aria-label="Mapa da rota do dia"
          >
            {/* grade leve */}
            <defs>
              <pattern id="route-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill="url(#route-grid)" />

            {/* linha da rota */}
            <polyline
              points={polyline}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="5 3"
              opacity="0.7"
            />

            {/* pino da base */}
            <g>
              <circle cx={basePt[0]} cy={basePt[1]} r="11" fill="#fff" stroke="#0f172a" strokeWidth="2" />
              <text
                x={basePt[0]}
                y={basePt[1] + 3.5}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#0f172a"
              >
                ★
              </text>
              <text
                x={basePt[0]}
                y={basePt[1] - 16}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#334155"
              >
                Base
              </text>
            </g>

            {/* pinos numerados */}
            {items.map((it, idx) => {
              const [x, y] = pts[idx];
              const isSelected = it.id === selectedId;
              return (
                <g
                  key={it.id}
                  className="cursor-pointer"
                  onClick={() => onPinTap(it.id)}
                  style={{ touchAction: "manipulation" }}
                >
                  {/* área de toque maior, invisível */}
                  <circle cx={x} cy={y} r="18" fill="transparent" />
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 13 : 11}
                    fill={isSelected ? "#1d4ed8" : "#2563eb"}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y + 3.5}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#fff"
                    pointerEvents="none"
                  >
                    {idx + 1}
                  </text>
                  {isSelected && (
                    <text
                      x={x}
                      y={y - 16}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      fill="#1e3a8a"
                      pointerEvents="none"
                    >
                      {it.client.name.split(" ")[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-[10px] text-gray-400 text-center pt-1.5">
          Toque em um pino para abrir o agendamento
        </p>
      </CardContent>
    </Card>
  );
}
