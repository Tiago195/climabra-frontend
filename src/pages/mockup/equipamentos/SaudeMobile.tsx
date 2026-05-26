// Variante A — Saúde dos equipamentos, versão mobile-first (max-w-md).
// Mesmo conteúdo e fluxo do HealthGrid wide, empilhado em coluna única.
// Reaproveita mocks e helpers de rastreio-equipamentos/_shared (NÃO duplicar).

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, AirVent, Bell, CheckCircle2, MessageCircle, Send } from "lucide-react";
import {
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
  clientById,
  type MaintenanceStatus,
  type MockEquipment,
  type MockClient,
  type Severity,
  type MaintenanceKind,
} from "../rastreio-equipamentos/_shared";

type SevFilter = "all" | Severity;
type KindFilter = "all" | MaintenanceKind;

interface EnrichedEq {
  eq: MockEquipment;
  statuses: MaintenanceStatus[];
  pendings: MaintenanceStatus[];
  worst: Severity;
  client: MockClient | undefined;
}

const SEV_FILTERS: { key: SevFilter; label: string }[] = [
  { key: "all",      label: "Todos" },
  { key: "overdue",  label: "Atrasados" },
  { key: "due_soon", label: "Vence em 30d" },
  { key: "ok",       label: "Em dia" },
  { key: "never",    label: "Nunca feito" },
];

function pendencyLine(s: MaintenanceStatus): string {
  const label = MAINTENANCE_LABELS[s.kind].toLowerCase();
  if (s.severity === "overdue") return `${label} atrasada há ${s.daysOverdue}d`;
  if (s.severity === "due_soon") return `${label} vence em ${Math.max(0, -(s.daysOverdue ?? 0))}d`;
  if (s.severity === "never") return `${label} nunca foi feita`;
  return label;
}

function buildPreviewMessage(eq: MockEquipment, client: MockClient | undefined, pendings: MaintenanceStatus[]): string {
  const equipDesc = `${EQUIPMENT_TYPE_LABELS[eq.type]} ${eq.brand} ${eq.model} (${eq.label})`;
  const list = pendings.map(p => pendencyLine(p)).join("; ");
  const name = client?.name?.split(" ")[0] ?? "cliente";
  return `Olá, ${name}! Passando para avisar que seu ${equipDesc} está com: ${list}. Posso já reservar um horário para nossa equipe atender?`;
}

type DialogTarget =
  | { mode: "single"; equipmentId: string }
  | { mode: "batch" }
  | null;

export default function SaudeMobile() {
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [dialogTarget, setDialogTarget] = useState<DialogTarget>(null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const enriched: EnrichedEq[] = useMemo(() => TRACKED_EQUIPMENTS.map(eq => {
    const statuses = computeAllStatus(eq.id);
    const pendings = statuses.filter(s => s.severity !== "ok");
    return {
      eq,
      statuses,
      pendings,
      worst: worstSeverity(statuses),
      client: clientById(eq.clientId),
    };
  }), []);

  const totalEq = enriched.length;
  const overdueCount = enriched.filter(e => e.worst === "overdue").length;
  const dueSoonCount = enriched.filter(e => e.worst === "due_soon").length;
  const okCount = enriched.filter(e => e.worst === "ok").length;

  const visible = enriched.filter(({ statuses, worst }) => {
    if (kindFilter !== "all") {
      const s = statuses.find(s => s.kind === kindFilter)!;
      if (sevFilter === "all") return true;
      return s.severity === sevFilter;
    }
    if (sevFilter === "all") return true;
    return worst === sevFilter;
  });

  const batchByClient = useMemo(() => {
    const overdue = enriched.filter(e => e.worst === "overdue");
    const map = new Map<string, { client: MockClient | undefined; items: EnrichedEq[] }>();
    overdue.forEach(item => {
      const key = item.eq.clientId;
      const bucket = map.get(key) ?? { client: item.client, items: [] };
      bucket.items.push(item);
      map.set(key, bucket);
    });
    return Array.from(map.values());
  }, [enriched]);

  function openSingle(equipmentId: string) {
    setNote("");
    setDialogTarget({ mode: "single", equipmentId });
  }
  function openBatch() {
    setNote("");
    setDialogTarget({ mode: "batch" });
  }
  function closeDialog() {
    setDialogTarget(null);
  }
  function handleSend() {
    if (!dialogTarget) return;
    if (dialogTarget.mode === "single") {
      const item = enriched.find(e => e.eq.id === dialogTarget.equipmentId);
      setToast(`Aviso enviado para ${item?.client?.name ?? "cliente"} via WhatsApp e portal.`);
    } else {
      const n = batchByClient.length;
      setToast(`Aviso enviado para ${n} cliente${n > 1 ? "s" : ""} via WhatsApp e portal.`);
    }
    closeDialog();
  }

  const singleTarget = dialogTarget?.mode === "single"
    ? enriched.find(e => e.eq.id === dialogTarget.equipmentId)
    : null;

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-12">

        {/* ===== HEADER ===== */}
        <header>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Variante A — versão mobile
          </p>
          <h1 className="text-xl font-bold text-gray-900">Saúde dos equipamentos</h1>
        </header>

        {/* ===== KPIs 2×2 ===== */}
        <div className="grid grid-cols-2 gap-2.5">
          <KpiCard label="Equipamentos"      value={totalEq}      color="text-gray-900" />
          <KpiCard label="Em dia"            value={okCount}      color="text-green-600" />
          <KpiCard label="Vence em ≤30d"     value={dueSoonCount} color="text-amber-600" />
          <KpiCard label="Atrasados"         value={overdueCount} color="text-red-600" />
        </div>

        {/* ===== ALERTA ===== */}
        {overdueCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-900">
                    {overdueCount} equipamento{overdueCount > 1 ? "s" : ""} com manutenção vencida
                  </p>
                  <p className="text-xs text-red-800 mt-0.5 leading-snug">
                    Avise os clientes em massa — eles recebem as pendências por WhatsApp e pelo portal.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full bg-red-600 hover:bg-red-700 text-white gap-1.5"
                onClick={openBatch}
              >
                <Send className="w-3.5 h-3.5" />
                Avisar clientes
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== FILTROS ===== */}
        <div className="space-y-2 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SEV_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setSevFilter(f.key)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium whitespace-nowrap transition-colors ${
                  sevFilter === f.key
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 items-center no-scrollbar">
            <span className="shrink-0 text-[11px] text-gray-500 font-medium">Tipo:</span>
            <button
              onClick={() => setKindFilter("all")}
              className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${
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
                  className={`shrink-0 inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${
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

        {/* ===== LISTA VERTICAL ===== */}
        {visible.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-400 text-sm">
              Nenhum equipamento corresponde ao filtro.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map(({ eq, statuses, worst, pendings, client }) => {
              const c = SEVERITY_COLORS[worst];
              const isOk = worst === "ok";
              const btnColor =
                worst === "overdue" ? "bg-red-600 hover:bg-red-700 text-white" :
                worst === "due_soon" ? "bg-amber-500 hover:bg-amber-600 text-white" :
                worst === "never" ? "bg-gray-700 hover:bg-gray-800 text-white" : "";
              return (
                <Card key={eq.id} className={`${c.border} border`}>
                  <CardContent className="py-3 space-y-3">
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
                      <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.chip}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {SEVERITY_LABELS[worst]}
                      </span>
                    </div>

                    {/* Mini-badges 2×2 por tipo */}
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
                                {s.severity === "never"
                                  ? "nunca feito"
                                  : s.daysOverdue !== null && s.daysOverdue > 0
                                    ? `atrasado há ${s.daysOverdue}d`
                                    : s.daysOverdue !== null && s.daysOverdue >= -30
                                      ? `vence em ${-s.daysOverdue}d`
                                      : "em dia"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA */}
                    <Button
                      size="sm"
                      variant={isOk ? "outline" : "default"}
                      disabled={isOk}
                      onClick={() => openSingle(eq.id)}
                      className={`w-full gap-1.5 text-xs ${btnColor}`}
                      title={isOk ? "Equipamento em dia — nada a avisar" : `Avisar ${client?.name ?? "cliente"} sobre ${pendings.length} pendência${pendings.length > 1 ? "s" : ""}`}
                    >
                      {isOk ? (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tudo em dia
                        </span>
                      ) : (
                        <>
                          <span>Avisar cliente</span>
                          <span className="inline-flex items-center gap-0.5 ml-1 opacity-90">
                            <MessageCircle className="w-3 h-3" />
                            <Bell className="w-3 h-3" />
                          </span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== DIALOG ===== */}
      <Dialog open={!!dialogTarget} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg max-w-[calc(100vw-1.5rem)]">
          <DialogHeader>
            <DialogTitle className="text-base">
              {dialogTarget?.mode === "batch"
                ? `Avisar ${batchByClient.length} cliente${batchByClient.length > 1 ? "s" : ""} sobre manutenção vencida`
                : "Avisar cliente sobre pendências"}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-xs flex-wrap">
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </span>
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                <Bell className="w-3 h-3" /> Portal do cliente
              </span>
              <span className="text-gray-500">— enviados juntos</span>
            </DialogDescription>
          </DialogHeader>

          {singleTarget && (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto">
              <div className="bg-gray-50 rounded-md p-3 space-y-1.5">
                <p className="text-[11px] text-gray-500">Cliente</p>
                <p className="text-sm font-semibold text-gray-900">{singleTarget.client?.name}</p>
                <p className="text-[11px] text-gray-500">{singleTarget.client?.phone}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] text-gray-500 font-medium">Pendências deste equipamento</p>
                <p className="text-xs text-gray-700">
                  <AirVent className="inline w-3.5 h-3.5 text-blue-500 mr-1 -mt-0.5" />
                  {singleTarget.eq.label} — {EQUIPMENT_TYPE_LABELS[singleTarget.eq.type]} {singleTarget.eq.brand} {singleTarget.eq.model}
                </p>
                <ul className="space-y-1 mt-2">
                  {singleTarget.pendings.map(s => {
                    const sc = SEVERITY_COLORS[s.severity];
                    const Icon = MAINTENANCE_ICONS[s.kind];
                    return (
                      <li key={s.kind} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${sc.chip}`}>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs flex-1">{pendencyLine(s)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] text-gray-500 font-medium">Prévia da mensagem</p>
                <div className="bg-green-50 border border-green-100 rounded-md p-2.5 text-xs text-gray-800 whitespace-pre-wrap">
                  {buildPreviewMessage(singleTarget.eq, singleTarget.client, singleTarget.pendings)}
                  {note.trim() && (
                    <>
                      {"\n\n"}
                      <span className="text-gray-700">{note.trim()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {dialogTarget?.mode === "batch" && (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto">
              <p className="text-xs text-gray-600">
                Será enviado <strong>um aviso por cliente</strong>, agrupando os equipamentos atrasados de cada um.
              </p>
              <ul className="space-y-2">
                {batchByClient.map(({ client, items }) => (
                  <li key={client?.id ?? items[0]?.eq.clientId ?? items[0]?.eq.id} className="border border-gray-200 rounded-md p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{client?.name}</p>
                      <span className="text-[10px] text-gray-500 shrink-0">
                        {items.length} equipamento{items.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {items.map(({ eq, pendings }) => (
                        <li key={eq.id} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                          <AirVent className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                          <span className="min-w-0">
                            <strong className="text-gray-800">{eq.label}</strong>
                            {" — "}
                            {pendings
                              .filter(p => p.severity === "overdue")
                              .map(p => pendencyLine(p))
                              .join("; ") || "manutenção em atraso"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] text-gray-500 font-medium" htmlFor="aviso-nota-mobile">
              Observação adicional (opcional)
            </label>
            <textarea
              id="aviso-nota-mobile"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex.: tenho horário disponível esta semana, posso passar quinta de tarde."
              className="w-full text-xs border border-gray-200 rounded-md p-2 resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={closeDialog} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={dialogTarget?.mode === "batch" && batchByClient.length === 0}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {dialogTarget?.mode === "batch"
                ? `Enviar para ${batchByClient.length} cliente${batchByClient.length > 1 ? "s" : ""}`
                : "Enviar agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== TOAST ===== */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] bg-gray-900 text-white text-xs rounded-lg shadow-lg px-4 py-3 flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{toast}</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="py-2.5 px-3">
        <p className="text-[10px] text-gray-500 font-medium leading-tight">{label}</p>
        <p className={`text-xl font-bold ${color} leading-tight mt-0.5`}>{value}</p>
      </CardContent>
    </Card>
  );
}
