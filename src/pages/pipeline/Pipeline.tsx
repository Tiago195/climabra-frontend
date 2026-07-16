import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Filter, TrendingUp, Timer, Target, AlertCircle, XCircle, Loader2,
  Inbox, PenLine, Send, CalendarCheck, Wallet, CheckCircle2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

import { useAuth } from "@/contexts/authContext";
import { formatCents, formatRelative } from "@/lib/utils";
import {
  pipelineService, type IPipeline, type IPipelineCard, type IPipelineStage,
  type PipelineStageKey,
} from "@/services/pipeline";
import { reportService } from "@/services/report";
import { DECLINED_REASON_LABEL, type DeclinedReason } from "@/services/enums";
import { getApiErrorMessage } from "@/services/apiError";

// ── Rótulos ────────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<PipelineStageKey, string> = {
  open_submissions: "Solicitações",
  draft: "Rascunho",
  sent: "Enviado",
  awaiting_execution: "Aguardando execução",
  awaiting_payment: "Aguardando pagamento",
  completed: "Concluído no mês",
  declined: "Perdido no mês",
};

/** Estágios em que faz sentido marcar a perda comercial (espelha a regra do backend). */
const DECLINABLE: Partial<Record<PipelineStageKey, boolean>> = {
  sent: true,
  awaiting_payment: true,
};

const REASON_LABEL = DECLINED_REASON_LABEL;

const REASON_ORDER: DeclinedReason[] = ["price", "deadline", "competitor", "gave_up", "other"];

/** Ícone + cor por estágio — mobile (acordeão), espelha a tela aprovada no Stitch. */
const STAGE_ICON: Record<PipelineStageKey, React.ComponentType<{ className?: string }>> = {
  open_submissions: Inbox,
  draft: PenLine,
  sent: Send,
  awaiting_execution: CalendarCheck,
  awaiting_payment: Wallet,
  completed: CheckCircle2,
  declined: XCircle,
};

const STAGE_ICON_COLOR: Record<PipelineStageKey, string> = {
  open_submissions: "text-blue-600",
  draft: "text-gray-500",
  sent: "text-blue-600",
  awaiting_execution: "text-[#009966]",
  awaiting_payment: "text-[#fe9a00]",
  completed: "text-[#008236]",
  declined: "text-gray-400",
};

/** Dias corridos desde `iso`, ou `null` se ausente/inválido. */
function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

// ── Card do funil ────────────────────────────────────────────────────────────

function PipelineCard({ card, declinable, onOpen, onDecline }: {
  card: IPipelineCard;
  declinable: boolean;
  onOpen: (card: IPipelineCard) => void;
  onDecline: (card: IPipelineCard) => void;
}) {
  const age = formatRelative(card.stageSince);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(card)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(card); }}
      className="w-full text-left rounded-lg border bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm text-gray-900 truncate">
          {card.clientName ?? "Cliente"}
        </p>
        {card.displayCode && (
          <span className="text-[11px] text-gray-400 shrink-0">{card.displayCode}</span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-800">
          {card.valueCents > 0 ? formatCents(card.valueCents) : "—"}
        </span>
        {age && <span className="text-[11px] text-gray-400">{age}</span>}
      </div>
      {declinable && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={(e) => { e.stopPropagation(); onDecline(card); }}
        >
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Marcar como perdido
        </Button>
      )}
    </div>
  );
}

// ── Coluna/seção de estágio ──────────────────────────────────────────────────

function StageColumn({ stage, onOpen, onDecline }: {
  stage: IPipelineStage;
  onOpen: (card: IPipelineCard) => void;
  onDecline: (card: IPipelineCard) => void;
}) {
  const declinable = !!DECLINABLE[stage.key];
  return (
    <section className="flex flex-col rounded-xl bg-gray-100/70 p-3 lg:w-72 lg:shrink-0">
      <header className="mb-2 px-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-700">{STAGE_LABEL[stage.key]}</h2>
          <Badge variant="secondary" className="rounded-full">{stage.count}</Badge>
        </div>
        {stage.totalCents > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">{formatCents(stage.totalCents)}</p>
        )}
      </header>

      {stage.reasons && stage.reasons.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1 px-1">
          {stage.reasons.map((r) => (
            <span key={r.reason} className="text-[11px] rounded-full bg-white border px-2 py-0.5 text-gray-600">
              {REASON_LABEL[r.reason]}: {r.count}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 lg:max-h-[calc(100dvh-20rem)] lg:overflow-y-auto">
        {stage.cards.length === 0 ? (
          <p className="px-1 py-4 text-xs text-gray-400">Nada por aqui.</p>
        ) : (
          stage.cards.map((card) => (
            <PipelineCard
              key={card.reportId ?? card.submissionId ?? Math.random().toString()}
              card={card}
              declinable={declinable}
              onOpen={onOpen}
              onDecline={onDecline}
            />
          ))
        )}
        {stage.count > stage.cards.length && (
          <p className="px-1 py-1 text-[11px] text-gray-400">
            +{stage.count - stage.cards.length} não exibidos
          </p>
        )}
      </div>
    </section>
  );
}

// ── KPI de conversão ─────────────────────────────────────────────────────────

function ConversionKpi({ icon, label, value, tone = "blue" }: {
  icon: React.ReactNode; label: string; value: string; tone?: "blue" | "green" | "amber";
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</span>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
        </div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}

// ── Mobile: barra de métricas compacta ──────────────────────────────────────

function MobileMetricsBar({ conv, lostCents, loading }: {
  conv?: IPipeline["conversion"];
  lostCents: number;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-20" />;

  const ratePct = conv?.conversionRate != null ? `${Math.round(conv.conversionRate * 100)}%` : "—";
  const cycle = conv?.avgDaysSentToApproved != null ? `${Math.round(conv.avgDaysSentToApproved)}d` : "—";

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg bg-white ring-1 ring-foreground/10 shadow-sm p-4">
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Conversão</span>
          <span className="text-lg font-semibold text-blue-600">{ratePct}</span>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Ciclo</span>
          <span className="text-lg font-semibold text-blue-600">{cycle}</span>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Perdido</span>
          <span className="text-lg font-semibold text-red-600">{formatCents(lostCents)}</span>
        </div>
      </div>
      {conv && (
        <p className="mt-1.5 text-center text-[11px] text-gray-400">
          {conv.sentCount} enviados · {conv.approvedCount} aprovados no mês
        </p>
      )}
    </div>
  );
}

// ── Mobile: linha de cliente dentro do estágio ──────────────────────────────

function MobilePipelineRow({ card, declinable, onOpen, onDecline }: {
  card: IPipelineCard;
  declinable: boolean;
  onOpen: (card: IPipelineCard) => void;
  onDecline: (card: IPipelineCard) => void;
}) {
  const age = formatRelative(card.stageSince);
  const days = daysSince(card.stageSince);
  const urgent = days != null && days > 7;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(card)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(card); }}
      className={`w-full text-left rounded-md ring-1 ring-foreground/5 bg-white p-3 active:scale-[0.98] transition-transform cursor-pointer ${urgent ? "border-l-4 border-[#bb4d00]" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-gray-900">{card.clientName ?? "Cliente"}</span>
          {card.displayCode && <span className="text-xs text-gray-500">{card.displayCode}</span>}
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-sm font-medium text-gray-900">
            {card.valueCents > 0 ? formatCents(card.valueCents) : "—"}
          </span>
          {age && (
            <span className={`text-[10px] ${urgent ? "font-bold text-[#bb4d00]" : "text-gray-500"}`}>{age}</span>
          )}
        </div>
      </div>
      {declinable && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-8 w-full justify-center px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={(e) => { e.stopPropagation(); onDecline(card); }}
        >
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Marcar como perdido
        </Button>
      )}
    </div>
  );
}

// ── Mobile: acordeão de estágios ────────────────────────────────────────────

function MobileStageAccordion({ stages, onOpen, onDecline }: {
  stages: IPipelineStage[];
  onOpen: (card: IPipelineCard) => void;
  onDecline: (card: IPipelineCard) => void;
}) {
  const firstWithCards = stages.find((s) => s.cards.length > 0);
  const defaultOpen = firstWithCards ? [firstWithCards.key] : [];

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="flex flex-col gap-3 border-none rounded-none">
      {stages.map((stage) => {
        const Icon = STAGE_ICON[stage.key];
        const declinable = !!DECLINABLE[stage.key];
        const isDeclined = stage.key === "declined";
        return (
          <AccordionItem
            key={stage.key}
            value={stage.key}
            className={`rounded-lg bg-white shadow-sm overflow-hidden border-none data-open:bg-white ${
              isDeclined ? "border-2 border-dashed border-gray-200 ring-0 shadow-none" : "ring-1 ring-foreground/10"
            }`}
          >
            <AccordionTrigger className="p-4 hover:no-underline hover:bg-gray-50 data-[state=open]:border-b data-[state=open]:border-gray-100">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 shrink-0 ${STAGE_ICON_COLOR[stage.key]}`} />
                <span className={`text-sm ${isDeclined ? "text-gray-500" : "text-gray-900"} ${stage.cards.length > 0 && !isDeclined ? "font-semibold" : "font-medium"}`}>
                  {STAGE_LABEL[stage.key]}{" "}
                  <span className="font-normal text-gray-500">
                    ({stage.count}{stage.totalCents > 0 ? ` · ${formatCents(stage.totalCents)}` : ""})
                  </span>
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {isDeclined && stage.reasons && stage.reasons.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {stage.reasons.map((r) => (
                    <span key={r.reason} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                      {REASON_LABEL[r.reason]}: {r.count}
                    </span>
                  ))}
                </div>
              )}
              {stage.cards.length === 0 ? (
                <p className="text-xs italic text-gray-400">Nada por aqui.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {stage.cards.map((card) => (
                    <MobilePipelineRow
                      key={card.reportId ?? card.submissionId ?? Math.random().toString()}
                      card={card}
                      declinable={declinable}
                      onOpen={onOpen}
                      onDecline={onDecline}
                    />
                  ))}
                </div>
              )}
              {stage.count > stage.cards.length && (
                <p className="mt-2 text-[11px] text-gray-400">
                  +{stage.count - stage.cards.length} não exibidos
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export function Pipeline() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<IPipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal de recusa
  const [declineCard, setDeclineCard] = useState<IPipelineCard | null>(null);
  const [reason, setReason] = useState<DeclinedReason | "">("");
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    try {
      setData(await pipelineService.get(token));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openCard = (card: IPipelineCard) => {
    if (card.reportId) navigate(`/dashboard/reports/${card.reportId}`);
    else navigate("/dashboard/agenda?tab=calendario");
  };

  const startDecline = (card: IPipelineCard) => {
    setDeclineCard(card);
    setReason("");
    setReasonText("");
  };

  const confirmDecline = async () => {
    if (!token || !declineCard?.reportId || !reason) return;
    setSubmitting(true);
    try {
      await reportService.decline(token, declineCard.reportId, reason, reasonText.trim() || undefined);
      toast.success("Laudo marcado como perdido");
      setDeclineCard(null);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível marcar como perdido"));
    } finally {
      setSubmitting(false);
    }
  };

  const conv = data?.conversion;
  const ratePct = conv?.conversionRate != null ? `${Math.round(conv.conversionRate * 100)}%` : "—";
  const avgDays = conv?.avgDaysSentToApproved != null
    ? `${conv.avgDaysSentToApproved.toFixed(1)} d` : "—";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Filter className="w-6 h-6 text-blue-600" />
          Funil comercial
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Do orçamento à aprovação — por estágio, com valor e perdas do mês.
        </p>
      </div>

      {/* Conversão (topo do funil) — desktop: 3 KPIs lado a lado */}
      <div className="hidden lg:grid grid-cols-3 gap-3">
        {loading ? (
          <>
            <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
          </>
        ) : (
          <>
            <ConversionKpi
              icon={<Target className="w-4 h-4" />} tone="blue"
              label="Conversão enviado → aprovado (mês)" value={ratePct}
            />
            <ConversionKpi
              icon={<Timer className="w-4 h-4" />} tone="amber"
              label="Tempo médio enviado → aprovado" value={avgDays}
            />
            <ConversionKpi
              icon={<TrendingUp className="w-4 h-4" />} tone="green"
              label="Enviados / aprovados no mês"
              value={conv ? `${conv.approvedCount} / ${conv.sentCount}` : "—"}
            />
          </>
        )}
      </div>

      {/* Conversão (topo do funil) — mobile: barra compacta (design Stitch) */}
      <div className="lg:hidden">
        <MobileMetricsBar
          conv={data?.conversion}
          lostCents={data?.stages.find((s) => s.key === "declined")?.totalCents ?? 0}
          loading={loading}
        />
      </div>

      {/* Funil */}
      {error ? (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-6 h-6 text-gray-400" />
            <p className="text-sm text-gray-500">Não foi possível carregar o funil.</p>
            <Button variant="outline" size="sm" onClick={load}>Tentar novamente</Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <>
          <div className="hidden lg:flex flex-col gap-4 lg:flex-row">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64 lg:w-72 lg:shrink-0" />)}
          </div>
          <div className="flex flex-col gap-3 lg:hidden">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}
          </div>
        </>
      ) : data ? (
        <>
          {/* Desktop: colunas kanban read-only */}
          <div className="hidden lg:flex flex-col gap-4 lg:flex-row lg:overflow-x-auto lg:pb-2">
            {data.stages.map((stage) => (
              <StageColumn
                key={stage.key}
                stage={stage}
                onOpen={openCard}
                onDecline={startDecline}
              />
            ))}
          </div>
          {/* Mobile: acordeão por estágio (design Stitch) */}
          <div className="lg:hidden">
            <MobileStageAccordion stages={data.stages} onOpen={openCard} onDecline={startDecline} />
          </div>
        </>
      ) : null}

      {/* Modal: marcar como perdido */}
      <ResponsiveModal
        open={!!declineCard}
        onOpenChange={(o) => { if (!o) setDeclineCard(null); }}
        title="Marcar laudo como perdido"
        description={declineCard?.clientName
          ? `${declineCard.clientName}${declineCard.displayCode ? ` · ${declineCard.displayCode}` : ""}`
          : undefined}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="decline-reason">Motivo</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as DeclinedReason)}>
              <SelectTrigger id="decline-reason">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {REASON_ORDER.map((r) => (
                  <SelectItem key={r} value={r}>{REASON_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decline-text">Detalhe (opcional)</Label>
            <Textarea
              id="decline-text"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Ex.: fechou com concorrente mais barato"
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDeclineCard(null)}>
              Cancelar
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!reason || submitting}
              onClick={confirmDecline}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Confirmar perda
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
