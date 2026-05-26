import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  MessageCircle,
  Mail,
  Smartphone,
  Send,
  AlertCircle,
  CheckCircle2,
  AirVent,
  Info,
} from "lucide-react";
import {
  MockupShellWide,
  TRACKED_EQUIPMENTS,
  MAINTENANCE_KINDS,
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
  type MaintenanceKind,
  type MaintenanceStatus,
  type Severity,
} from "./_shared";

type Channel = "whatsapp" | "email" | "portal";

interface PendingReminder {
  equipmentId: string;
  equipmentLabel: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  status: MaintenanceStatus;
}

const CHANNEL_META: Record<Channel, { label: string; Icon: typeof MessageCircle }> = {
  whatsapp: { label: "WhatsApp", Icon: MessageCircle },
  email: { label: "E-mail", Icon: Mail },
  portal: { label: "Portal do cliente", Icon: Smartphone },
};

function buildMessage(p: PendingReminder): string {
  const kindLabel = MAINTENANCE_LABELS[p.status.kind].toLowerCase();
  let situation: string;
  if (p.status.severity === "overdue") {
    situation = `está com a ${kindLabel} *atrasada há ${p.status.daysOverdue} dias*`;
  } else {
    const dias = -(p.status.daysOverdue ?? 0);
    situation = `precisa de ${kindLabel} *em ${dias} dias* (vence em ${formatDateBR(p.status.nextDueAt!)})`;
  }
  return [
    `Olá, ${p.clientName.split(" ")[0]}!`,
    "",
    `Aqui é ${PROVIDER.name} da ${PROVIDER.companyName}. Seu *${p.equipmentLabel}* ${situation}.`,
    "",
    "Posso já reservar um horário para você?",
    "",
    "👉 Agende em 1 clique pelo seu portal.",
  ].join("\n");
}

export default function ReminderSettings() {
  // Quais tipos de manutenção disparam lembrete (default: todos)
  const [enabled, setEnabled] = useState<Record<MaintenanceKind, boolean>>({
    cleaning: true,
    preventive: true,
    sanitization: false,
    gas: true,
  });
  const [channels, setChannels] = useState<Record<Channel, boolean>>({
    whatsapp: true,
    email: false,
    portal: true,
  });
  const [preview, setPreview] = useState<PendingReminder | null>(null);

  // Calcula todos os lembretes que SERIAM enviados hoje, dadas as preferências
  const pending: PendingReminder[] = useMemo(() => {
    const out: PendingReminder[] = [];
    TRACKED_EQUIPMENTS.forEach(eq => {
      const c = clientById(eq.clientId);
      if (!c) return;
      computeAllStatus(eq.id).forEach(status => {
        if (!enabled[status.kind]) return;
        // Critério da task: lembrete só para "vence em ≤30d" ou "atrasado".
        // "never" e "ok" não disparam aviso automático.
        if (status.severity !== "overdue" && status.severity !== "due_soon") return;
        out.push({
          equipmentId: eq.id,
          equipmentLabel: eq.label ?? eq.type,
          clientId: c.id,
          clientName: c.name,
          clientPhone: c.phone,
          status,
        });
      });
    });
    // Mais críticos primeiro
    const rank: Record<Severity, number> = { overdue: 3, never: 2, due_soon: 1, ok: 0 };
    return out.sort((a, b) => {
      const r = rank[b.status.severity] - rank[a.status.severity];
      if (r !== 0) return r;
      return (b.status.daysOverdue ?? -9999) - (a.status.daysOverdue ?? -9999);
    });
  }, [enabled]);

  const overdueCount = pending.filter(p => p.status.severity === "overdue").length;
  const dueSoonCount = pending.filter(p => p.status.severity === "due_soon").length;

  const previewMsg = preview ?? pending[0] ?? null;
  const previewText = previewMsg ? buildMessage(previewMsg) : null;

  return (
    <MockupShellWide
      title="Lembretes automáticos de manutenção"
      subtitle="Variante C — Configuração do prestador"
    >
      <div className="grid md:grid-cols-[1fr_360px] gap-4">
        {/* COLUNA ESQUERDA — Configuração + Fila */}
        <section className="space-y-4 min-w-0">
          {/* Card master switch */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    Avisar o cliente quando a manutenção vencer
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Disparamos um lembrete automático quando um equipamento entra em{" "}
                    <span className="font-medium text-amber-700">vence em ≤30d</span> ou{" "}
                    <span className="font-medium text-red-700">atrasado</span>. O cliente recebe um
                    botão "Agendar agora" que abre o portal dele.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quais tipos disparam */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Tipos de serviço com lembrete</p>
                <p className="text-[11px] text-gray-500">
                  Escolha quais manutenções devem gerar aviso automático.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MAINTENANCE_KINDS.map(k => {
                  const Icon = MAINTENANCE_ICONS[k];
                  const on = enabled[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setEnabled(p => ({ ...p, [k]: !p[k] }))}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 text-left transition-colors ${
                        on
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                          on ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold ${
                            on ? "text-blue-900" : "text-gray-700"
                          }`}
                        >
                          {MAINTENANCE_LABELS[k]}
                        </p>
                        <p
                          className={`text-[10px] ${
                            on ? "text-blue-700" : "text-gray-400"
                          }`}
                        >
                          {on ? "lembrete ativo" : "desativado"}
                        </p>
                      </div>
                      <div
                        className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${
                          on ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                            on ? "left-4" : "left-0.5"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Canais */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Canais de envio</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CHANNEL_META) as Channel[]).map(c => {
                  const { label, Icon } = CHANNEL_META[c];
                  const on = channels[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChannels(p => ({ ...p, [c]: !p[c] }))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        on
                          ? "bg-gray-900 border-gray-900 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                      {on && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-500 inline-flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                O portal sempre mostra o aviso — os outros canais são opcionais.
              </p>
            </CardContent>
          </Card>

          {/* Fila de envio */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Serão enviados hoje · {pending.length}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {overdueCount} atrasado{overdueCount === 1 ? "" : "s"} · {dueSoonCount} vencendo
                    em ≤30d
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  disabled={pending.length === 0}
                >
                  <Send className="w-3.5 h-3.5" />
                  Disparar agora
                </Button>
              </div>

              {pending.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">
                  Nenhum lembrete pendente — tudo em dia ou tipos desativados.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 -mx-2">
                  {pending.map(p => {
                    const sc = SEVERITY_COLORS[p.status.severity];
                    const KIcon = MAINTENANCE_ICONS[p.status.kind];
                    const active = previewMsg?.equipmentId === p.equipmentId && previewMsg?.status.kind === p.status.kind;
                    return (
                      <li key={`${p.equipmentId}-${p.status.kind}`}>
                        <button
                          type="button"
                          onClick={() => setPreview(p)}
                          className={`w-full text-left px-2 py-2 rounded-md flex items-center gap-3 transition-colors ${
                            active ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {p.clientName}
                              <span className="text-gray-400 font-normal"> · {p.equipmentLabel}</span>
                            </p>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <KIcon className="w-3 h-3" />
                              {MAINTENANCE_LABELS_SHORT[p.status.kind]} ·{" "}
                              {p.status.severity === "never"
                                ? "nunca feito"
                                : formatRelative(p.status.daysOverdue)}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${sc.chip}`}
                          >
                            {SEVERITY_LABELS[p.status.severity]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* COLUNA DIREITA — Preview da mensagem */}
        <aside className="space-y-3">
          <Card className="bg-gray-100">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Pré-visualização</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                  <MessageCircle className="w-3 h-3 text-green-600" /> WhatsApp
                </span>
              </div>

              {!previewMsg || !previewText ? (
                <div className="text-center py-10 text-xs text-gray-400">
                  Selecione um lembrete na lista para pré-visualizar.
                </div>
              ) : (
                <>
                  <div className="text-[11px] text-gray-500">
                    Para: <span className="font-medium text-gray-700">{previewMsg.clientName}</span>{" "}
                    · {previewMsg.clientPhone}
                  </div>

                  {/* Bolha estilo whatsapp */}
                  <div className="bg-[#dcf8c6] rounded-lg rounded-tr-sm px-3 py-2 text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                    {previewText}
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <span className="inline-block bg-white rounded-md px-3 py-1.5 text-[11px] font-semibold text-blue-600 shadow-sm">
                        🗓️  Agendar agora
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 text-right mt-1">enviado hoje · ClimaTec</p>
                  </div>

                  {channels.email && (
                    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-600">
                      <p className="font-semibold text-gray-700 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Também por e-mail
                      </p>
                      <p className="text-gray-500 mt-0.5">
                        Assunto: "Sua manutenção de{" "}
                        {MAINTENANCE_LABELS_SHORT[previewMsg.status.kind].toLowerCase()} venceu"
                      </p>
                    </div>
                  )}

                  <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-[11px] text-blue-800 flex items-start gap-1.5">
                    <AirVent className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>
                      O mesmo aviso aparece no portal do cliente — veja a variante "Portal com
                      alertas".
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Resumo regra */}
          <Card>
            <CardContent className="py-3 text-[11px] text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" /> Quando disparamos
              </p>
              <p>
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 align-middle" />
                Equipamento <strong>atrasado</strong> — envia 1x, repete a cada 14 dias.
              </p>
              <p>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5 align-middle" />
                Vence em <strong>≤30 dias</strong> — envia 1x quando entra na janela.
              </p>
              <p className="text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1.5 align-middle" />
                <strong>Nunca feito</strong> — não dispara aviso automático (aparece só no painel do prestador).
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </MockupShellWide>
  );
}
