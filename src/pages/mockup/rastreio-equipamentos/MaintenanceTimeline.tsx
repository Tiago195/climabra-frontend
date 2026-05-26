import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AirVent, AlertCircle, CalendarPlus, CheckCircle2, ChevronDown, User } from "lucide-react";
import {
  MockupShellWide,
  TRACKED_EQUIPMENTS,
  EQUIPMENT_TYPE_LABELS,
  MAINTENANCE_KINDS,
  MAINTENANCE_ICONS,
  MAINTENANCE_LABELS,
  MAINTENANCE_LABELS_SHORT,
  MAINTENANCE_INTERVALS_DAYS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  TODAY,
  computeAllStatus,
  eventsFor,
  worstSeverity,
  mostCritical,
  formatDateBR,
  formatRelative,
  clientById,
  daysBetween,
} from "./_shared";

interface TimelineItem {
  id: string;
  kind: ReturnType<typeof eventsFor>[number]["kind"];
  date: string;
  isFuture: boolean;
  technicianName?: string;
  severity?: ReturnType<typeof worstSeverity>;
}

export default function MaintenanceTimeline() {
  const [selectedId, setSelectedId] = useState<string>(TRACKED_EQUIPMENTS[0].id);
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});

  // Lista lateral agrupada por cliente
  const grouped = useMemo(() => {
    const byClient = new Map<string, typeof TRACKED_EQUIPMENTS>();
    TRACKED_EQUIPMENTS.forEach(eq => {
      const arr = byClient.get(eq.clientId) ?? [];
      arr.push(eq);
      byClient.set(eq.clientId, arr);
    });
    return Array.from(byClient.entries()).map(([cid, eqs]) => ({
      client: clientById(cid)!,
      equipments: eqs.map(eq => {
        const statuses = computeAllStatus(eq.id);
        return { eq, worst: worstSeverity(statuses) };
      }),
    }));
  }, []);

  const selectedEq = TRACKED_EQUIPMENTS.find(e => e.id === selectedId)!;
  const selectedClient = clientById(selectedEq.clientId)!;
  const statuses = computeAllStatus(selectedEq.id);
  const critical = mostCritical(statuses);
  const pastEvents = eventsFor(selectedEq.id);
  const doneCountByKind = MAINTENANCE_KINDS.map(k => ({
    kind: k,
    count: eventsFor(selectedEq.id, k).length,
  }));

  // Marcos futuros (próximos vencimentos) + passado, mesclados na timeline
  const timelineItems: TimelineItem[] = [
    ...statuses
      .filter(s => s.nextDueAt) // só os que tem histórico
      .map(s => ({
        id: `future-${s.kind}`,
        kind: s.kind,
        date: s.nextDueAt!,
        isFuture: daysBetween(TODAY, s.nextDueAt!) > 0,
        severity: s.severity,
      } as TimelineItem)),
    ...pastEvents.map(ev => ({
      id: ev.id,
      kind: ev.kind,
      date: ev.doneAt,
      isFuture: false,
      technicianName: ev.technicianName,
    } as TimelineItem)),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // calcula intervalo médio real entre eventos por tipo
  const avgIntervals = MAINTENANCE_KINDS.map(k => {
    const evs = eventsFor(selectedEq.id, k);
    if (evs.length < 2) return { kind: k, avg: null as number | null };
    const diffs: number[] = [];
    for (let i = 0; i < evs.length - 1; i++) diffs.push(daysBetween(evs[i + 1].doneAt, evs[i].doneAt));
    return { kind: k, avg: Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) };
  });

  const sc = SEVERITY_COLORS[critical.severity];

  return (
    <MockupShellWide title="Histórico de manutenção" subtitle="Variante B — Timeline por equipamento">
      <div className="grid md:grid-cols-[260px_1fr] gap-4">
        {/* SIDEBAR */}
        <aside className="space-y-2">
          {grouped.map(({ client, equipments }) => {
            const hasIssue = equipments.some(e => e.worst === "overdue" || e.worst === "never");
            const open = groupOpen[client.id] ?? true;
            return (
              <Card key={client.id}>
                <button
                  type="button"
                  onClick={() => setGroupOpen(p => ({ ...p, [client.id]: !open }))}
                  className="w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-gray-50 rounded-t-xl"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 truncate">{client.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasIssue && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`} />
                  </div>
                </button>
                {open && (
                  <div className="px-1 pb-1">
                    {equipments.map(({ eq, worst }) => {
                      const dot = SEVERITY_COLORS[worst].dot;
                      const active = eq.id === selectedId;
                      return (
                        <button
                          key={eq.id}
                          onClick={() => setSelectedId(eq.id)}
                          className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                            active ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                          <AirVent className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-gray-800 truncate leading-tight">{eq.label}</p>
                            <p className="text-[10px] text-gray-400 truncate leading-tight">{eq.brand} {eq.model}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </aside>

        {/* PAINEL PRINCIPAL */}
        <section className="space-y-4 min-w-0">
          {/* Header equipamento */}
          <Card>
            <CardContent className="py-4">
              <p className="text-[11px] text-gray-500">{selectedClient.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <AirVent className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-900">{selectedEq.label}</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {EQUIPMENT_TYPE_LABELS[selectedEq.type]} · {selectedEq.brand} {selectedEq.model}
              </p>
            </CardContent>
          </Card>

          {/* Próxima ação sugerida */}
          <Card className={`${sc.border} border-2`}>
            <CardContent className={`py-4 ${sc.chip}`}>
              <div className="flex items-start gap-3">
                {(() => { const CIcon = MAINTENANCE_ICONS[critical.kind]; return <CIcon className={`w-6 h-6 mt-0.5 ${sc.text}`} />; })()}
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] uppercase tracking-wide font-semibold ${sc.text}`}>Próxima ação</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {(() => {
                      if (critical.severity === "never") return `${MAINTENANCE_LABELS[critical.kind]} nunca foi feita — agendar primeira visita`;
                      if (critical.severity === "overdue") return `${MAINTENANCE_LABELS[critical.kind]} venceu há ${critical.daysOverdue}d — agendar`;
                      if (critical.severity === "due_soon") return `${MAINTENANCE_LABELS[critical.kind]} vence ${formatRelative(critical.daysOverdue)} — planejar`;
                      return `Tudo em dia — próxima ${MAINTENANCE_LABELS_SHORT[critical.kind].toLowerCase()} ${formatRelative(critical.daysOverdue)}`;
                    })()}
                  </p>
                </div>
                {critical.severity !== "ok" && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shrink-0">
                    <CalendarPlus className="w-3.5 h-3.5" /> Agendar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo lateral inline (intervalos) */}
          <Card>
            <CardContent className="py-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Resumo dos serviços</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {doneCountByKind.map(({ kind, count }) => {
                  const Icon = MAINTENANCE_ICONS[kind];
                  const avg = avgIntervals.find(a => a.kind === kind)?.avg ?? null;
                  const ideal = MAINTENANCE_INTERVALS_DAYS[kind];
                  return (
                    <div key={kind} className="text-center bg-gray-50 rounded-md py-2">
                      <Icon className="w-4 h-4 text-gray-500 mx-auto" />
                      <p className="text-[10px] text-gray-500 mt-1">{MAINTENANCE_LABELS_SHORT[kind]}</p>
                      <p className="text-base font-bold text-gray-900">{count}</p>
                      <p className="text-[9px] text-gray-400">
                        {avg !== null ? `~${avg}d / ideal ${ideal}d` : `ideal ${ideal}d`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* TIMELINE */}
          <Card>
            <CardContent className="py-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Linha do tempo</p>
              {timelineItems.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">Sem histórico registrado.</p>
              ) : (
                <ol className="relative border-l-2 border-gray-100 ml-3 space-y-3">
                  {/* marcador "hoje" — inserido na posição cronológica certa */}
                  {(() => {
                    const merged: (TimelineItem | { id: "TODAY"; isToday: true })[] = [];
                    let todayInserted = false;
                    timelineItems.forEach(item => {
                      if (!todayInserted && item.date < TODAY) {
                        merged.push({ id: "TODAY", isToday: true });
                        todayInserted = true;
                      }
                      merged.push(item);
                    });
                    if (!todayInserted) merged.push({ id: "TODAY", isToday: true });
                    return merged.map(node => {
                      if ("isToday" in node) {
                        return (
                          <li key="today" className="pl-5 relative">
                            <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white" />
                            <div className="bg-blue-50 text-blue-700 inline-block px-2 py-0.5 rounded text-[11px] font-semibold">
                              hoje · {formatDateBR(TODAY)}
                            </div>
                          </li>
                        );
                      }
                      const Icon = MAINTENANCE_ICONS[node.kind];
                      const sev = node.severity ?? "ok";
                      const c = SEVERITY_COLORS[sev];
                      return (
                        <li key={node.id} className="pl-5 relative">
                          <span
                            className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ring-2 ring-white ${
                              node.isFuture ? c.dot : "bg-green-500"
                            }`}
                            style={node.isFuture ? { outline: "2px dashed currentColor", outlineOffset: 1 } : undefined}
                          />
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Icon className={`w-3.5 h-3.5 ${node.isFuture ? c.text : "text-green-600"}`} />
                                <span className="text-sm font-medium text-gray-900">
                                  {MAINTENANCE_LABELS[node.kind]}
                                </span>
                                {node.isFuture ? (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${c.chip}`}>
                                    previsto · {SEVERITY_LABELS[sev]}
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-green-50 text-green-700 inline-flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> feito
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatDateBR(node.date)}
                                {node.technicianName && <> · por {node.technicianName}</>}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    });
                  })()}
                </ol>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </MockupShellWide>
  );
}
