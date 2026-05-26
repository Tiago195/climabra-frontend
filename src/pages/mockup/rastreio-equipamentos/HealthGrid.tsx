import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, AirVent, CalendarPlus } from "lucide-react";
import {
  MockupShellWide,
  TRACKED_EQUIPMENTS,
  EQUIPMENT_TYPE_LABELS,
  MAINTENANCE_KINDS,
  MAINTENANCE_ICONS,
  MAINTENANCE_LABELS,
  MAINTENANCE_LABELS_SHORT,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  computeAllStatus,
  worstSeverity,
  mostCritical,
  formatRelative,
  clientById,
  type Severity,
  type MaintenanceKind,
} from "./_shared";

type SevFilter = "all" | Severity;
type KindFilter = "all" | MaintenanceKind;

const SEV_FILTERS: { key: SevFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "overdue", label: "Atrasados" },
  { key: "due_soon", label: "Vence em 30d" },
  { key: "ok", label: "Em dia" },
  { key: "never", label: "Nunca feito" },
];

export default function HealthGrid() {
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  // pré-computa status de todos os equipamentos
  const enriched = TRACKED_EQUIPMENTS.map(eq => {
    const statuses = computeAllStatus(eq.id);
    return {
      eq,
      statuses,
      worst: worstSeverity(statuses),
      critical: mostCritical(statuses),
      client: clientById(eq.clientId),
    };
  });

  // KPIs (sempre sobre o universo total, ignora filtros)
  const totalEq = enriched.length;
  const overdueCount = enriched.filter(e => e.worst === "overdue").length;
  const dueSoonCount = enriched.filter(e => e.worst === "due_soon").length;
  const okCount = enriched.filter(e => e.worst === "ok").length;

  // filtro
  const visible = enriched.filter(({ statuses, worst }) => {
    if (kindFilter !== "all") {
      const s = statuses.find(s => s.kind === kindFilter)!;
      if (sevFilter === "all") return true;
      return s.severity === sevFilter;
    }
    if (sevFilter === "all") return true;
    return worst === sevFilter;
  });

  return (
    <MockupShellWide title="Saúde dos equipamentos" subtitle="Variante A — Grid de manutenção">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Equipamentos" value={totalEq} color="text-gray-900" />
        <KpiCard label="Em dia" value={okCount} color="text-green-600" />
        <KpiCard label="Vence em ≤30d" value={dueSoonCount} color="text-amber-600" />
        <KpiCard label="Atrasados" value={overdueCount} color="text-red-600" />
      </div>

      {/* Alerta */}
      {overdueCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-900">
                {overdueCount} equipamento{overdueCount > 1 ? "s" : ""} com manutenção vencida
              </p>
              <p className="text-xs text-red-800 mt-0.5">
                Recomendamos agendar visita técnica para colocar a rotina em dia.
              </p>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shrink-0">
              Agendar visita
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {SEV_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setSevFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                sevFilter === f.key
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[11px] text-gray-500 font-medium">Tipo:</span>
          <button
            onClick={() => setKindFilter("all")}
            className={`text-[11px] px-2.5 py-1 rounded-full border ${
              kindFilter === "all"
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            Todos
          </button>
          {MAINTENANCE_KINDS.map(k => {
            const Icon = MAINTENANCE_ICONS[k];
            const active = kindFilter === k;
            return (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${
                  active ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                <Icon className="w-3 h-3" />
                {MAINTENANCE_LABELS_SHORT[k]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-400 text-sm">
            Nenhum equipamento corresponde ao filtro.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(({ eq, statuses, worst, critical, client }) => {
            const c = SEVERITY_COLORS[worst];
            const Icon = MAINTENANCE_ICONS[critical.kind];
            const ctaLabel = critical.severity === "ok"
              ? "Ver histórico"
              : `Agendar ${MAINTENANCE_LABELS_SHORT[critical.kind].toLowerCase()}`;
            return (
              <Card key={eq.id} className={`${c.border} border`}>
                <CardContent className="py-4 space-y-3">
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-gray-500 truncate">{client?.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <AirVent className="w-4 h-4 text-blue-500 shrink-0" />
                        <p className="text-sm font-semibold text-gray-900 truncate">{eq.label}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {EQUIPMENT_TYPE_LABELS[eq.type]} · {eq.brand} {eq.model}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.chip}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      {SEVERITY_LABELS[worst]}
                    </span>
                  </div>

                  {/* Mini-badges por serviço */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {statuses.map(s => {
                      const sc = SEVERITY_COLORS[s.severity];
                      const SIcon = MAINTENANCE_ICONS[s.kind];
                      return (
                        <div
                          key={s.kind}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md ${sc.chip}`}
                          title={`${MAINTENANCE_LABELS[s.kind]}: ${SEVERITY_LABELS[s.severity]}`}
                        >
                          <SIcon className="w-3 h-3 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-medium truncate leading-tight">
                              {MAINTENANCE_LABELS_SHORT[s.kind]}
                            </p>
                            <p className="text-[9px] opacity-80 leading-tight">
                              {s.severity === "never" ? "nunca feito" : formatRelative(s.daysOverdue)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA contextual */}
                  <Button
                    size="sm"
                    variant={critical.severity === "ok" ? "outline" : "default"}
                    className={`w-full gap-1.5 text-xs ${
                      critical.severity === "overdue" ? "bg-red-600 hover:bg-red-700 text-white" :
                      critical.severity === "due_soon" ? "bg-amber-500 hover:bg-amber-600 text-white" :
                      critical.severity === "never" ? "bg-gray-700 hover:bg-gray-800 text-white" : ""
                    }`}
                  >
                    {critical.severity === "ok" ? null : <CalendarPlus className="w-3.5 h-3.5" />}
                    {critical.severity === "ok" ? "Ver histórico" : (
                      <span>
                        {ctaLabel}
                        <Icon className="inline-block w-3 h-3 ml-1 opacity-70" />
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </MockupShellWide>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="py-3">
        <p className="text-[11px] text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
