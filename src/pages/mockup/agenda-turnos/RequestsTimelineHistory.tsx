import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus, MapPin, Navigation, List, Map as MapIcon, Home, ExternalLink,
  Clock, AlertTriangle, History, CalendarDays, CheckCircle2, XCircle, UserX,
  AirVent, FileText, Ban,
} from "lucide-react";
import {
  APPOINTMENTS,
  PROVIDER,
  TODAY,
  MockupShell,
  ShiftBadge,
  clientById,
  equipmentById,
  distanceKm,
  MONTH_NAMES_SHORT,
  DAY_NAMES_SHORT,
  SHIFT_START_MIN,
  SHIFT_END_MIN,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  EQUIPMENT_TYPE_LABELS,
  estimateServiceMinutes,
  travelMinutes,
  formatHm,
  formatDateBR,
  relativeDateLabel,
  type Shift,
  type MockAppointment,
  type ApptStatus,
} from "./_shared";

import { EquipmentReportActions } from "./_actions";

type EtaStatus = "ok" | "tight" | "over";
interface EtaInfo {
  arrivalMin: number;
  endMin: number;
  serviceMin: number;
  status: EtaStatus;
}

type FutureBucket = "today" | "week" | "later";
type PastBucket = "thisWeek" | "thisMonth" | "older";
type ViewMode = "timeline" | "map";
type Tab = "future" | "past";

function futureBucketFor(dateISO: string): FutureBucket {
  if (dateISO === TODAY) return "today";
  const today = new Date(`${TODAY}T00:00:00`);
  const d = new Date(`${dateISO}T00:00:00`);
  const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 7 && diff > 0) return "week";
  return "later";
}

function pastBucketFor(dateISO: string): PastBucket {
  const today = new Date(`${TODAY}T00:00:00`);
  const d = new Date(`${dateISO}T00:00:00`);
  const daysAgo = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (daysAgo < 7) return "thisWeek";
  if (daysAgo < 30) return "thisMonth";
  return "older";
}

const FUTURE_BUCKET_LABELS: Record<FutureBucket, string> = {
  today: "Hoje", week: "Esta semana", later: "Depois",
};
const FUTURE_BUCKET_BARS: Record<FutureBucket, string> = {
  today: "bg-blue-600", week: "bg-blue-400", later: "bg-gray-300",
};

const PAST_BUCKET_LABELS: Record<PastBucket, string> = {
  thisWeek: "Esta semana", thisMonth: "Este mês", older: "Mais antigas",
};
const PAST_BUCKET_BARS: Record<PastBucket, string> = {
  thisWeek: "bg-gray-500", thisMonth: "bg-gray-400", older: "bg-gray-300",
};

interface PastStatusVisual {
  label: string;
  chip: string;
  Icon: typeof CheckCircle2;
}
const PAST_STATUS_VISUAL: Record<Exclude<ApptStatus, "scheduled">, PastStatusVisual> = {
  completed: { label: "Concluída",      chip: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  canceled:  { label: "Cancelada",      chip: "bg-rose-100 text-rose-700",   Icon: XCircle },
  no_show:   { label: "Não compareceu", chip: "bg-amber-100 text-amber-700", Icon: UserX },
};

function googleMapsRouteUrl(stops: Array<{ lat: number; lng: number }>) {
  if (stops.length === 0) return "";
  const origin = `${PROVIDER.lat},${PROVIDER.lng}`;
  const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
  const waypoints = stops.slice(0, -1).map(s => `${s.lat},${s.lng}`).join("|");
  const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "driving" });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
function googleMapsSingleUrl(stop: { lat: number; lng: number }) {
  const params = new URLSearchParams({
    api: "1", destination: `${stop.lat},${stop.lng}`, travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
function wazeUrl(stop: { lat: number; lng: number }) {
  return `https://www.waze.com/ul?ll=${stop.lat}%2C${stop.lng}&navigate=yes`;
}

export default function RequestsTimelineHistory() {
  const [tab, setTab] = useState<Tab>("future");
  const [view, setView] = useState<ViewMode>("timeline");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reportsModalId, setReportsModalId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // PRÓXIMAS — mesma pipeline da B original
  const future = APPOINTMENTS
    .filter(a => a.status === "scheduled" && a.scheduledDate >= TODAY)
    .map(a => {
      const cli = clientById(a.clientId);
      return { ...a, client: cli, distance: distanceKm(PROVIDER, cli), bucket: futureBucketFor(a.scheduledDate) };
    });

  const futureGroups: { bucket: FutureBucket; items: typeof future }[] =
    (["today","week","later"] as FutureBucket[]).map(b => ({
      bucket: b,
      items: future.filter(e => e.bucket === b).sort((a, b) => a.distance - b.distance),
    }));

  const todayItems = futureGroups.find(g => g.bucket === "today")?.items ?? [];
  const totalKm = future.reduce((s, e) => s + e.distance, 0);

  // PASSADAS — cronológico reverso, agrupado
  const past = APPOINTMENTS
    .filter(a => a.status !== "scheduled" && a.scheduledDate < TODAY)
    .map(a => ({ ...a, client: clientById(a.clientId), bucket: pastBucketFor(a.scheduledDate) }))
    .sort((a, b) => (a.scheduledDate < b.scheduledDate ? 1 : -1));

  const pastGroups: { bucket: PastBucket; items: typeof past }[] =
    (["thisWeek","thisMonth","older"] as PastBucket[]).map(b => ({
      bucket: b, items: past.filter(e => e.bucket === b),
    }));

  // distância acumulada da rota do dia
  const todayRouteKm = useMemo(() => {
    if (todayItems.length === 0) return 0;
    let total = distanceKm(PROVIDER, todayItems[0].client);
    for (let i = 1; i < todayItems.length; i++) {
      total += distanceKm(todayItems[i - 1].client, todayItems[i].client);
    }
    return total;
  }, [todayItems]);

  const etaById = useMemo(() => {
    const map: Record<string, EtaInfo> = {};
    const shifts: Shift[] = ["morning", "afternoon", "night"];
    shifts.forEach(shift => {
      const items = todayItems.filter(it => it.shift === shift);
      if (items.length === 0) return;
      let prev: { lat: number; lng: number } = PROVIDER;
      let cursor = SHIFT_START_MIN[shift];
      const shiftEnd = SHIFT_END_MIN[shift];
      items.forEach(it => {
        const arr = cursor + travelMinutes(distanceKm(prev, it.client));
        const svc = estimateServiceMinutes(it.equipmentIds.length);
        const end = arr + svc;
        let status: EtaStatus = "ok";
        if (end > shiftEnd) status = "over";
        else if (end > shiftEnd - 15) status = "tight";
        map[it.id] = { arrivalMin: arr, endMin: end, serviceMin: svc, status };
        prev = it.client;
        cursor = end;
      });
    });
    return map;
  }, [todayItems]);

  function handlePinTap(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() => {
      cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  const reportsModalAppt = reportsModalId
    ? past.find(p => p.id === reportsModalId) ?? null
    : null;

  return (
    <MockupShell title="Solicitações" subtitle="Variante B′ — Timeline com Histórico">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {tab === "future"
            ? `${future.length} visita${future.length === 1 ? "" : "s"} agendada${future.length === 1 ? "" : "s"}`
            : `${past.length} visita${past.length === 1 ? "" : "s"} no histórico`}
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-8" size="sm">
          <Plus className="w-3.5 h-3.5" /> Nova
        </Button>
      </div>

      {/* Tabs Próximas / Passadas */}
      <div className="inline-flex rounded-lg bg-gray-100 p-0.5 w-full">
        <button
          onClick={() => { setTab("future"); }}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 transition ${
            tab === "future" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Próximas
          <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${
            tab === "future" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
          }`}>{future.length}</span>
        </button>
        <button
          onClick={() => { setTab("past"); setView("timeline"); }}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 transition ${
            tab === "past" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Passadas
          <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${
            tab === "past" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-500"
          }`}>{past.length}</span>
        </button>
      </div>

      {/* Toggle Timeline / Mapa — Mapa desabilitado em Passadas */}
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
          onClick={() => tab === "future" && setView("map")}
          disabled={tab === "past"}
          title={tab === "past" ? "Disponível só para próximas" : undefined}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 transition ${
            view === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          } ${tab === "past" ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {tab === "past" ? <Ban className="w-3.5 h-3.5" /> : <MapIcon className="w-3.5 h-3.5" />}
          Mapa
        </button>
      </div>

      {/* ===== ABA PRÓXIMAS ===== */}
      {tab === "future" && view === "timeline" && (
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

          {futureGroups.map(g => {
            if (g.items.length === 0) return null;
            return (
              <div key={g.bucket} className="space-y-2">
                <div className="flex items-center gap-2 pt-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${FUTURE_BUCKET_BARS[g.bucket]}`} />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    {FUTURE_BUCKET_LABELS[g.bucket]}
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

          {future.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-gray-500">Nenhuma visita futura</CardContent></Card>
          )}
        </>
      )}

      {tab === "future" && view === "map" && (
        <>
          <Card>
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Rota otimizada de hoje — {todayItems.length} parada{todayItems.length === 1 ? "" : "s"}</span>
              </div>
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <Home className="w-3 h-3" /> Base: <span className="font-medium text-gray-700">{PROVIDER.baseAddress.split("—")[0].trim()}</span>
                <span className="ml-auto font-semibold text-blue-700">Σ {todayRouteKm.toFixed(1)} km</span>
              </p>
              {todayItems.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <a href={googleMapsRouteUrl(todayItems.map(i => i.client))} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" className="w-full h-8 bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs">
                      <ExternalLink className="w-3.5 h-3.5" /> Google Maps
                    </Button>
                  </a>
                  <a href={wazeUrl(todayItems[0].client)} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-8 gap-1.5 text-xs">
                      <ExternalLink className="w-3.5 h-3.5" /> Waze (1ª)
                    </Button>
                  </a>
                </div>
              )}
              {todayItems.length > 1 && (
                <p className="text-[10px] text-gray-400 leading-tight">
                  Waze não aceita múltiplas paradas — abre a 1ª; use "Ir agora" no card de cada visita.
                </p>
              )}
            </CardContent>
          </Card>

          {todayItems.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-gray-500">Nenhuma visita para hoje</CardContent></Card>
          ) : (
            <>
              <RouteMap items={todayItems} selectedId={selectedId} onPinTap={handlePinTap} />
              <div className="space-y-2">
                {todayItems.map((a, idx) => {
                  const isSelected = a.id === selectedId;
                  const eta = etaById[a.id];
                  const etaTone =
                    eta?.status === "over" ? "bg-red-50 text-red-700 ring-red-200"
                    : eta?.status === "tight" ? "bg-amber-50 text-amber-700 ring-amber-200"
                    : "bg-blue-50 text-blue-700 ring-blue-200";
                  return (
                    <div key={a.id} ref={el => { cardRefs.current[a.id] = el; }}>
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
                              {eta && (
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 rounded-full ring-1 px-1.5 py-0.5 text-[10px] font-semibold ${etaTone}`}>
                                    {eta.status === "over" ? <AlertTriangle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                    chega ~{formatHm(eta.arrivalMin)}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    serviço ~{eta.serviceMin}min · sai ~{formatHm(eta.endMin)}
                                  </span>
                                  {eta.status === "over" && (
                                    <span className="text-[10px] font-medium text-red-600">estoura turno</span>
                                  )}
                                  {eta.status === "tight" && (
                                    <span className="text-[10px] font-medium text-amber-700">no limite</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a href={googleMapsSingleUrl(a.client)} target="_blank" rel="noopener noreferrer" className="flex-1">
                              <Button size="sm" variant="outline" className="w-full h-7 gap-1 text-[11px]">
                                <Navigation className="w-3 h-3" /> Ir agora (Maps)
                              </Button>
                            </a>
                            <a href={wazeUrl(a.client)} target="_blank" rel="noopener noreferrer" className="flex-1">
                              <Button size="sm" variant="outline" className="w-full h-7 gap-1 text-[11px]">
                                <Navigation className="w-3 h-3" /> Waze
                              </Button>
                            </a>
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

      {/* ===== ABA PASSADAS ===== */}
      {tab === "past" && (
        <>
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <History className="w-3.5 h-3.5 text-gray-600" />
                <span>Mais recentes primeiro · só leitura</span>
              </div>
            </CardContent>
          </Card>

          {pastGroups.map(g => {
            if (g.items.length === 0) return null;
            return (
              <div key={g.bucket} className="space-y-2">
                <div className="flex items-center gap-2 pt-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${PAST_BUCKET_BARS[g.bucket]}`} />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    {PAST_BUCKET_LABELS[g.bucket]}
                  </p>
                  <span className="text-[10px] text-gray-400">· {g.items.length} visita{g.items.length > 1 ? "s" : ""}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {g.items.map(a => (
                  <PastVisitCard key={a.id} appt={a} onOpenReports={() => setReportsModalId(a.id)} />
                ))}
              </div>
            );
          })}

          {past.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-gray-500">Nenhuma visita finalizada ainda</CardContent></Card>
          )}
        </>
      )}

      {/* Modal "Ver laudos" — somente leitura */}
      <Dialog open={!!reportsModalAppt} onOpenChange={(o) => !o && setReportsModalId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Laudos da visita
            </DialogTitle>
            <DialogDescription>
              {reportsModalAppt && `${clientById(reportsModalAppt.clientId).name} · ${formatDateBR(reportsModalAppt.scheduledDate)}`}
            </DialogDescription>
          </DialogHeader>
          {reportsModalAppt && (
            <div className="space-y-1.5">
              {reportsModalAppt.equipmentIds.map(eqId => {
                const eq = equipmentById(eqId);
                const r = reportsModalAppt.reports.find(rp => rp.equipmentId === eqId);
                return (
                  <div key={eqId} className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1.5">
                    <AirVent className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">{eq.label}</p>
                      <p className="text-[10px] text-gray-400 truncate">{EQUIPMENT_TYPE_LABELS[eq.type]} · {eq.brand}</p>
                    </div>
                    {r ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${REPORT_STATUS_COLORS[r.status]}`}>
                        {REPORT_STATUS_LABELS[r.status]}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-200 text-gray-500">
                        sem laudo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MockupShell>
  );
}

/** Card de visita passada — visual acinzentado, badge de status, resumo de laudos. */
function PastVisitCard({
  appt, onOpenReports,
}: {
  appt: MockAppointment & { client: { name: string; neighborhood: string } };
  onOpenReports: () => void;
}) {
  const d = new Date(`${appt.scheduledDate}T00:00:00`);
  const status = appt.status as Exclude<ApptStatus, "scheduled">;
  const visual = PAST_STATUS_VISUAL[status] ?? {
    label: "Finalizada", chip: "bg-gray-100 text-gray-700", Icon: CheckCircle2,
  };
  const StatusIcon = visual.Icon;

  const totalReports = appt.reports.length;
  const doneReports = appt.reports.filter(r => r.status === "completed").length;
  const showReportsLine = status === "completed";

  return (
    <Card className="bg-gray-50/60 border-gray-200">
      <CardContent className="py-3 space-y-2">
        <div className="flex items-start gap-2.5">
          <div className="flex flex-col items-center justify-center bg-white rounded-lg w-11 py-1 shrink-0 ring-1 ring-gray-200">
            <span className="text-[9px] uppercase font-bold text-gray-400">{DAY_NAMES_SHORT[d.getDay()]}</span>
            <span className="text-base font-bold text-gray-600 leading-none">{d.getDate()}</span>
            <span className="text-[9px] text-gray-400">{MONTH_NAMES_SHORT[d.getMonth()]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-700 truncate">{appt.client.name}</p>
              <span className={`inline-flex items-center gap-1 rounded-full font-medium text-[10px] px-1.5 py-0.5 ${visual.chip}`}>
                <StatusIcon className="w-2.5 h-2.5" />
                {visual.label}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {appt.client.neighborhood}
              <span className="ml-auto inline-flex items-center gap-0.5 text-gray-500">
                <Clock className="w-2.5 h-2.5" />
                {relativeDateLabel(appt.scheduledDate)}
              </span>
            </p>
          </div>
        </div>

        {showReportsLine && (
          <div className="flex items-center gap-2 bg-white/70 rounded-md px-2 py-1.5 ring-1 ring-gray-200">
            <AirVent className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <p className="text-[11px] text-gray-700 flex-1 min-w-0 truncate">
              {appt.equipmentIds.length} equipamento{appt.equipmentIds.length === 1 ? "" : "s"} ·{" "}
              <span className="font-semibold">{doneReports} de {totalReports}</span> laudo{totalReports === 1 ? "" : "s"} concluído{totalReports === 1 ? "" : "s"}
            </p>
            <Button size="sm" variant="outline" onClick={onOpenReports} className="h-7 text-[11px] gap-1 px-2">
              <FileText className="w-3 h-3" /> Ver laudos
            </Button>
          </div>
        )}

        {!showReportsLine && appt.notes && (
          <p className="text-[11px] text-gray-500 italic bg-white/70 rounded-md px-2 py-1.5 ring-1 ring-gray-200">
            “{appt.notes}”
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Mapa SVG simples que projeta lat/lng dos pontos em um viewBox normalizado. */
function RouteMap({
  items, selectedId, onPinTap,
}: {
  items: Array<{ id: string; client: { name: string; lat: number; lng: number; neighborhood: string } }>;
  selectedId: string | null;
  onPinTap: (id: string) => void;
}) {
  const W = 320;
  const H = 240;
  const PAD = 28;

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
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Mapa da rota do dia">
            <defs>
              <pattern id="route-grid-hist" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill="url(#route-grid-hist)" />
            <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 3" opacity="0.7" />
            <g>
              <circle cx={basePt[0]} cy={basePt[1]} r="11" fill="#fff" stroke="#0f172a" strokeWidth="2" />
              <text x={basePt[0]} y={basePt[1] + 3.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">★</text>
              <text x={basePt[0]} y={basePt[1] - 16} textAnchor="middle" fontSize="9" fontWeight="600" fill="#334155">Base</text>
            </g>
            {items.map((it, idx) => {
              const [x, y] = pts[idx];
              const isSelected = it.id === selectedId;
              return (
                <g key={it.id} className="cursor-pointer" onClick={() => onPinTap(it.id)} style={{ touchAction: "manipulation" }}>
                  <circle cx={x} cy={y} r="18" fill="transparent" />
                  <circle cx={x} cy={y} r={isSelected ? 13 : 11}
                    fill={isSelected ? "#1d4ed8" : "#2563eb"} stroke="#fff" strokeWidth="2" />
                  <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" pointerEvents="none">
                    {idx + 1}
                  </text>
                  {isSelected && (
                    <text x={x} y={y - 16} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e3a8a" pointerEvents="none">
                      {it.client.name.split(" ")[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-[10px] text-gray-400 text-center pt-1.5">Toque em um pino para abrir o agendamento</p>
      </CardContent>
    </Card>
  );
}
