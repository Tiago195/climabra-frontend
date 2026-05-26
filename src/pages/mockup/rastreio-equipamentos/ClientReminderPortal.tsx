import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CalendarPlus, AirVent, ChevronRight, X, MessageCircle } from "lucide-react";
import {
  MockupShellWide,
  TRACKED_EQUIPMENTS,
  EQUIPMENT_TYPE_LABELS,
  MAINTENANCE_ICONS,
  MAINTENANCE_LABELS,
  MAINTENANCE_LABELS_SHORT,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  PROVIDER,
  computeAllStatus,
  clientById,
  formatRelative,
  formatDateBR,
  type MaintenanceStatus,
} from "./_shared";

// Para o mockup, mostramos o portal do cliente "Ana Beatriz" (c1)
// e o cliente "Carla Mendes" (c3) para alternar.
const PORTAL_CLIENTS = ["c1", "c3", "c6", "c5"] as const;

interface Alert {
  equipmentId: string;
  equipmentLabel: string;
  equipmentSub: string;
  status: MaintenanceStatus;
}

function alertsFor(clientId: string): Alert[] {
  const eqs = TRACKED_EQUIPMENTS.filter(e => e.clientId === clientId);
  const out: Alert[] = [];
  eqs.forEach(eq => {
    computeAllStatus(eq.id).forEach(status => {
      if (status.severity === "ok") return;
      out.push({
        equipmentId: eq.id,
        equipmentLabel: eq.label ?? eq.type,
        equipmentSub: `${EQUIPMENT_TYPE_LABELS[eq.type]} · ${eq.brand} ${eq.model}`,
        status,
      });
    });
  });
  // Mais críticos primeiro
  const rank = { overdue: 3, never: 2, due_soon: 1, ok: 0 } as const;
  return out.sort((a, b) => {
    const r = rank[b.status.severity] - rank[a.status.severity];
    if (r !== 0) return r;
    return (b.status.daysOverdue ?? -9999) - (a.status.daysOverdue ?? -9999);
  });
}

function ctaLabel(status: MaintenanceStatus): string {
  const k = MAINTENANCE_LABELS_SHORT[status.kind].toLowerCase();
  if (status.severity === "overdue") return `Agendar ${k} (atrasada há ${status.daysOverdue}d)`;
  if (status.severity === "due_soon") return `Agendar ${k} (${formatRelative(status.daysOverdue)})`;
  return `Agendar primeira ${k}`;
}

function headline(status: MaintenanceStatus, eqLabel: string): string {
  if (status.severity === "overdue") {
    return `${MAINTENANCE_LABELS[status.kind]} do seu ${eqLabel} está atrasada há ${status.daysOverdue} dias`;
  }
  if (status.severity === "due_soon") {
    const dias = -(status.daysOverdue ?? 0);
    return `${MAINTENANCE_LABELS[status.kind]} do seu ${eqLabel} vence em ${dias} dias`;
  }
  return `Seu ${eqLabel} ainda não passou por ${MAINTENANCE_LABELS[status.kind].toLowerCase()}`;
}

export default function ClientReminderPortal() {
  const [clientId, setClientId] = useState<string>("c1");
  const [showPush, setShowPush] = useState(true);

  const client = clientById(clientId)!;
  const alerts = useMemo(() => alertsFor(clientId), [clientId]);
  const topAlert = alerts[0];

  return (
    <MockupShellWide
      title="Portal do cliente · aviso de manutenção"
      subtitle="Variante D — Visão do cliente"
    >
      {/* Switcher de cliente (só para demo) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-gray-500 font-medium">Cliente do exemplo:</span>
        {PORTAL_CLIENTS.map(cid => {
          const c = clientById(cid)!;
          const a = alertsFor(cid);
          const active = cid === clientId;
          return (
            <button
              key={cid}
              onClick={() => {
                setClientId(cid);
                setShowPush(true);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${
                active
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {c.name.split(" ")[0]}
              <span
                className={`text-[10px] px-1.5 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {a.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-[1fr_360px] gap-4 items-start">
        {/* PORTAL */}
        <section className="space-y-3 min-w-0">
          {/* Banner principal de manutenção pendente */}
          {topAlert ? (
            <Card
              className={`${SEVERITY_COLORS[topAlert.status.severity].border} border-2`}
            >
              <CardContent
                className={`py-4 ${SEVERITY_COLORS[topAlert.status.severity].chip}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 ${SEVERITY_COLORS[topAlert.status.severity].text}`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[10px] uppercase tracking-wider font-bold ${SEVERITY_COLORS[topAlert.status.severity].text}`}
                    >
                      Aviso de manutenção
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {headline(topAlert.status, topAlert.equipmentLabel)}
                    </p>
                    {topAlert.status.nextDueAt && (
                      <p className="text-[11px] text-gray-600 mt-1">
                        Vencimento previsto: {formatDateBR(topAlert.status.nextDueAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Agendar agora
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Falar com {PROVIDER.name.split(" ")[0]}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-green-600 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Tudo em dia, {client.name.split(" ")[0]}!
                  </p>
                  <p className="text-[11px] text-green-700">
                    Vamos te avisar quando algum equipamento precisar de manutenção.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de outros equipamentos com pendência */}
          {alerts.length > 1 && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Outros equipamentos que precisam de atenção
                </p>
                <ul className="divide-y divide-gray-100 -mx-2">
                  {alerts.slice(1).map(a => {
                    const sc = SEVERITY_COLORS[a.status.severity];
                    const Icon = MAINTENANCE_ICONS[a.status.kind];
                    return (
                      <li
                        key={`${a.equipmentId}-${a.status.kind}`}
                        className="px-2 py-2.5 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                          <AirVent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {a.equipmentLabel}
                            <span className="font-normal text-gray-400"> · {a.equipmentSub}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Icon className="w-3 h-3" />
                            {MAINTENANCE_LABELS_SHORT[a.status.kind]} ·{" "}
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${sc.chip}`}
                            >
                              {SEVERITY_LABELS[a.status.severity]}
                            </span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-[11px] shrink-0"
                        >
                          {ctaLabel(a.status)}
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Rodapé: equipamentos em dia */}
          <Card>
            <CardContent className="py-3 text-[11px] text-gray-500">
              <p>
                Olá, <span className="font-semibold text-gray-700">{client.name}</span> — você é
                atendido por{" "}
                <span className="font-semibold text-gray-700">{PROVIDER.companyName}</span>.
              </p>
              <p className="mt-1">
                Esses avisos chegam automaticamente quando algum equipamento entra em "vence em
                breve" ou "atrasado".
              </p>
            </CardContent>
          </Card>
        </section>

        {/* PUSH SIMULADA */}
        <aside className="space-y-3">
          {showPush && topAlert && (
            <Card className="bg-gray-900 text-white border-gray-900">
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold inline-flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-green-400" />
                    WhatsApp · agora
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPush(false)}
                    className="text-gray-500 hover:text-white"
                    aria-label="Fechar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] font-semibold">{PROVIDER.companyName}</p>
                <p className="text-xs text-gray-200 leading-relaxed">
                  Olá, {client.name.split(" ")[0]}! Seu{" "}
                  <span className="font-semibold">{topAlert.equipmentLabel}</span>{" "}
                  {topAlert.status.severity === "overdue"
                    ? `está atrasado em ${MAINTENANCE_LABELS_SHORT[topAlert.status.kind].toLowerCase()}.`
                    : topAlert.status.severity === "due_soon"
                      ? `precisa de ${MAINTENANCE_LABELS_SHORT[topAlert.status.kind].toLowerCase()} em breve.`
                      : `ainda não passou por ${MAINTENANCE_LABELS_SHORT[topAlert.status.kind].toLowerCase()}.`}{" "}
                  Posso reservar um horário?
                </p>
                <button
                  type="button"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md py-1.5 inline-flex items-center justify-center gap-1.5"
                >
                  <CalendarPlus className="w-3 h-3" /> Agendar agora
                </button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="py-3 text-[11px] text-gray-600 space-y-1.5">
              <p className="text-xs font-semibold text-gray-700">Como o cliente vê o aviso</p>
              <p>
                1. Notificação no celular (WhatsApp / e-mail, conforme prestador configurou).
              </p>
              <p>2. Banner no topo do portal ao abrir o link.</p>
              <p>3. Botão único "Agendar agora" abre o fluxo de nova visita.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </MockupShellWide>
  );
}
