import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportVisitsTimeline } from "@/components/ReportVisitsTimeline";
import { ScheduleExecutionDialog } from "./components/ScheduleExecutionDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext";
import { reportService, type IReportDetailResponse, type IReportItemResponse } from "@/services/report";
import { providerService } from "@/services/provider";
import { uploadService } from "@/services/upload";
import {
  ArrowLeft, Plus, Trash2, Camera, Send, CheckCircle2, Copy, Loader2,
  Eye, User, Wind, ShieldCheck, Banknote, CalendarClock, CalendarPlus, Zap, XCircle,
} from "lucide-react";
import { DECLINED_REASON_LABEL } from "@/services/enums";
import { getApiErrorMessage } from "@/services/apiError";

// Data local (YYYY-MM-DD) — usada p/ detectar visita de execução já marcada hoje.
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  split: "Split", janela: "Janela", central: "Central",
  cassete: "Cassete", piso_teto: "Piso-teto", portatil: "Portátil",
};

const STATUS_META: Record<string, { label: string; pillClass: string; dotClass: string }> = {
  draft:     { label: "Rascunho",                pillClass: "bg-amber-50 text-amber-700 border-amber-200",  dotClass: "bg-amber-500" },
  sent:      { label: "Aguardando aprovação",    pillClass: "bg-blue-50 text-blue-700 border-blue-200",     dotClass: "bg-blue-500" },
  awaiting_payment: { label: "Aguardando pagamento", pillClass: "bg-amber-50 text-amber-700 border-amber-200", dotClass: "bg-amber-500" },
  approved:  { label: "Aprovado pelo cliente",   pillClass: "bg-teal-50 text-teal-700 border-teal-200",     dotClass: "bg-teal-500" },
  awaiting_execution: { label: "Aguardando execução", pillClass: "bg-amber-50 text-amber-700 border-amber-200", dotClass: "bg-amber-500" },
  completed: { label: "Concluído",               pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200", dotClass: "bg-emerald-500" },
  declined:  { label: "Perdido",                 pillClass: "bg-rose-50 text-rose-700 border-rose-200",       dotClass: "bg-rose-500" },
};

const centsToBRL = (cents: number | null | undefined) =>
  ((cents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const centsToPlain = (cents: number | null | undefined) =>
  ((cents ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const qtyToStr = (q: number | null | undefined) => {
  const n = q ?? 1;
  return Number.isInteger(n) ? String(n) : n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
};

const lineSubtotal = (it: IReportItemResponse) =>
  Math.round((it.quantity ?? 1) * (it.unitPriceCents ?? 0));

// ─────────────────────────────────────────────────────────────────────────────
// Inline editable inputs
// ─────────────────────────────────────────────────────────────────────────────

interface CurrencyInputProps {
  valueCents: number | null;
  onCommit: (cents: number) => void;
  disabled?: boolean;
}
function CurrencyInput({ valueCents, onCommit, disabled }: CurrencyInputProps) {
  const [text, setText] = useState(centsToPlain(valueCents));
  // Re-sincroniza quando o prop muda (ex: após save) — pattern "derived state" do React.
  const [prevValue, setPrevValue] = useState(valueCents);
  if (valueCents !== prevValue) {
    setPrevValue(valueCents);
    setText(centsToPlain(valueCents));
  }

  const commit = () => {
    const cleaned = text.replace(/[^\d,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    const cents = !Number.isNaN(num) ? Math.round(num * 100) : 0;
    if (cents !== (valueCents ?? 0)) onCommit(cents);
    setText(centsToPlain(cents));
  };

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">R$</span>
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-full h-11 md:h-9 pl-8 pr-2 text-sm text-right rounded-md border border-gray-200 bg-white tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );
}

interface QtyInputProps {
  value: number | null;
  onCommit: (n: number) => void;
  disabled?: boolean;
}
function QtyInput({ value, onCommit, disabled }: QtyInputProps) {
  const [text, setText] = useState(qtyToStr(value));
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(qtyToStr(value));
  }

  const commit = () => {
    const cleaned = text.replace(",", ".");
    const num = parseFloat(cleaned);
    const n = !Number.isNaN(num) && num > 0 ? num : 1;
    if (n !== (value ?? 1)) onCommit(n);
    setText(qtyToStr(n));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className="w-full h-11 md:h-9 px-2.5 text-sm text-right rounded-md border border-gray-200 bg-white tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
    />
  );
}

interface WarrantyInputProps {
  value: number | null;
  onCommit: (n: number) => void;
  disabled?: boolean;
}
function WarrantyInput({ value, onCommit, disabled }: WarrantyInputProps) {
  const [text, setText] = useState(String(value ?? 0));
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(String(value ?? 0));
  }

  const commit = () => {
    const n = parseInt(text.replace(/\D/g, ""), 10);
    const v = !Number.isNaN(n) ? n : 0;
    if (v !== (value ?? 0)) onCommit(v);
    setText(String(v));
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-full h-11 md:h-9 pl-2.5 pr-10 text-sm text-right rounded-md border border-gray-200 bg-white tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">dias</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────────

export function ReportEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, provider } = useAuth();

  const [detail, setDetail] = useState<IReportDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [suggestingTravel, setSuggestingTravel] = useState(false);
  const [confirmingCash, setConfirmingCash] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [copied, setCopied] = useState(false);
  // Agendamento da visita de execução (laudo "aguardando execução").
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [executingToday, setExecutingToday] = useState(false);
  // Estados locais (commit on-blur). Re-sincronizam quando o detail muda.
  const [titleDraft, setTitleDraft] = useState("");
  const [prevTitle, setPrevTitle] = useState<string | null | undefined>(undefined);
  const [diagnosisDraft, setDiagnosisDraft] = useState("");
  const [prevDiagnosis, setPrevDiagnosis] = useState<string | null | undefined>(undefined);
  const [finalNotesDraft, setFinalNotesDraft] = useState("");
  const [prevFinalNotes, setPrevFinalNotes] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!token || !id) return;
    reportService.getDetail(token, id)
      .then(setDetail)
      .catch(e => toast.error(getApiErrorMessage(e, "Erro ao carregar laudo")))
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleUpdateItem = async (itemId: string, patch: Parameters<typeof reportService.updateItem>[3]) => {
    if (!token || !id) return;
    try {
      const updated = await reportService.updateItem(token, id, itemId, patch);
      setDetail(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar item"));
    }
  };

  const handleAddItem = async () => {
    if (!token || !id) return;
    setAddingItem(true);
    try {
      const updated = await reportService.addItem(token, id, { description: "Novo item" });
      setDetail(updated);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao adicionar item"));
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!token || !id) return;
    try {
      setDetail(await reportService.deleteItem(token, id, itemId));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao remover item"));
    }
  };

  const handleSend = async () => {
    if (!token || !id) return;
    setSending(true);
    try {
      setDetail(await reportService.send(token, id));
      toast.success("Pré-laudo enviado ao cliente!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao enviar laudo"));
    } finally {
      setSending(false);
    }
  };

  const handleCommitTitle = async () => {
    if (!token || !id || !detail) return;
    const trimmed = titleDraft.trim();
    const current = detail.report.title ?? "";
    if (!trimmed || trimmed === current) {
      setTitleDraft(current);
      return;
    }
    try {
      const updated = await reportService.updateReport(token, id, { title: trimmed });
      setDetail(updated);
      toast.success("Título salvo");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar título"));
      setTitleDraft(current);
    }
  };

  const handleCommitDiagnosis = async () => {
    if (!token || !id || !detail) return;
    const trimmed = diagnosisDraft.trim();
    const current = detail.report.diagnosis ?? "";
    if (trimmed === current) return;
    try {
      const updated = await reportService.updateReport(token, id, { diagnosis: trimmed });
      setDetail(updated);
      toast.success("Diagnóstico salvo");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar diagnóstico"));
      setDiagnosisDraft(current);
    }
  };

  const handleCommitFinalNotes = async () => {
    if (!token || !id || !detail) return;
    const trimmed = finalNotesDraft.trim();
    const current = detail.report.finalNotes ?? "";
    if (trimmed === current) return;
    try {
      const updated = await reportService.updateReport(token, id, { finalNotes: trimmed });
      setDetail(updated);
      toast.success("Observações salvas");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar observações"));
      setFinalNotesDraft(current);
    }
  };

  const handleCommitLabor = async (cents: number) => {
    if (!token || !id || !detail) return;
    if (cents === (detail.financial?.laborCents ?? 0)) return;
    try {
      const updated = await reportService.updateReport(token, id, { laborCents: cents });
      setDetail(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar mão de obra"));
    }
  };

  const handleCommitTravel = async (cents: number) => {
    if (!token || !id || !detail) return;
    if (cents === (detail.financial?.travelCents ?? 0)) return;
    try {
      const updated = await reportService.updateReport(token, id, { travelCents: cents });
      setDetail(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao salvar deslocamento"));
    }
  };

  // Sugere o deslocamento pela distância (config de tarifa + coords do cliente).
  const handleSuggestTravel = async () => {
    if (!token || !id || !detail) return;
    setSuggestingTravel(true);
    try {
      const est = await providerService.getTravelEstimate(token, detail.client.id);
      if (!est.available || est.suggestedCents == null) {
        toast.message("Não foi possível estimar — confira o CEP da sua base e o endereço do cliente.");
        return;
      }
      await handleCommitTravel(est.suggestedCents);
      const km = est.distanceKm != null ? `${est.distanceKm.toLocaleString("pt-BR")} km` : "";
      toast.success(`Deslocamento sugerido${km ? ` (${km})` : ""} aplicado.`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao estimar o deslocamento"));
    } finally {
      setSuggestingTravel(false);
    }
  };

  const handleComplete = async () => {
    if (!token || !id) return;
    setCompleting(true);
    try {
      setDetail(await reportService.complete(token, id));
      toast.success("Laudo finalizado!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao finalizar laudo"));
    } finally {
      setCompleting(false);
    }
  };

  const handleConfirmCash = async () => {
    if (!token || !id) return;
    setConfirmingCash(true);
    try {
      setDetail(await reportService.confirmCash(token, id));
      toast.success("Pagamento confirmado! Laudo liberado.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao confirmar pagamento"));
    } finally {
      setConfirmingCash(false);
    }
  };

  // Recarrega o detalhe (ex.: após agendar/criar uma visita de execução, p/ a timeline).
  const reloadDetail = async () => {
    if (!token || !id) return;
    try {
      setDetail(await reportService.getDetail(token, id));
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao recarregar o laudo"));
    }
  };

  // Atalho "Executar hoje": cria a visita de execução de hoje E leva o laudo de
  // awaiting_execution → approved (num só endpoint), liberando a execução agora.
  const handleExecuteToday = async () => {
    if (!token || !id) return;
    setExecutingToday(true);
    try {
      setDetail(await reportService.executeToday(token, id));
      toast.success("Execução de hoje iniciada! Suba as fotos antes/depois e finalize o laudo.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao iniciar a execução de hoje"));
    } finally {
      setExecutingToday(false);
    }
  };

  const publicLink = useMemo(() => {
    if (!detail || !provider) return "";
    return `${window.location.origin}/providers/${provider.publicToken}/clients/${detail.client.id}/equipment/${detail.equipment.id}/laudo/${detail.report.publicToken}`;
  }, [detail, provider]);

  const copyLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!detail) return null;

  // Sincroniza os drafts quando o detail vem do backend ou é atualizado.
  if (detail.report.title !== prevTitle) {
    setPrevTitle(detail.report.title);
    setTitleDraft(detail.report.title ?? "");
  }
  if (detail.report.diagnosis !== prevDiagnosis) {
    setPrevDiagnosis(detail.report.diagnosis);
    setDiagnosisDraft(detail.report.diagnosis ?? "");
  }
  if (detail.report.finalNotes !== prevFinalNotes) {
    setPrevFinalNotes(detail.report.finalNotes);
    setFinalNotesDraft(detail.report.finalNotes ?? "");
  }

  const { report, items, equipment, client } = detail;
  const status = STATUS_META[report.status] ?? { label: report.status, pillClass: "bg-gray-100 text-gray-700 border-gray-200", dotClass: "bg-gray-400" };
  const isDraft = report.status === "draft";
  // approved (visita padrão) e awaiting_execution (laudo de avaliação aprovado,
  // executado em visita(s) de retorno) compartilham a execução: iniciar serviço,
  // subir fotos antes/depois e finalizar. Ver Fase F3.
  const isAwaitingExecution = report.status === "awaiting_execution";
  // Já existe uma visita de execução agendada para hoje? Então "Executar hoje"
  // não deve criar outra (não faz sentido marcar a mesma visita N vezes no dia).
  const hasExecutionToday = detail.visits.some(
    v => v.role === "execution" && v.scheduledDate === todayISO() && v.status === "scheduled"
  );
  // Já há qualquer visita de execução agendada (hoje ou futura)? Muda o texto do
  // aviso de "agende a visita" para "suba as fotos e finalize".
  const hasScheduledExecution = detail.visits.some(
    v => v.role === "execution" && v.status === "scheduled"
  );
  const canExecute = report.status === "approved" || isAwaitingExecution;
  const isCompleted = report.status === "completed";
  const isAwaitingPayment = report.status === "awaiting_payment";
  // Terminal: perda comercial (CRM F2). Não deve oferecer envio/finalização/pagamento.
  const isDeclined = report.status === "declined";
  const isCashPending = isAwaitingPayment && detail.financial?.payment?.method === "cash";
  const activeItems = items.filter(i => !i.rejected);
  const itemsCompleted = activeItems.filter(i => i.photoBefore && i.photoAfter).length;
  const subtotal = items.filter(i => !i.rejected).reduce((s, it) => s + lineSubtotal(it), 0);
  const labor = detail.financial?.laborCents ?? 0;
  const travel = detail.financial?.travelCents ?? 0;
  const discount = detail.financial?.discountCents ?? 0;
  const total = detail.financial?.totalCents ?? Math.max(0, subtotal + labor + travel - discount);
  const showLabor = !!provider?.chargesLabor || labor > 0;
  const showTravel = !!provider?.chargesTravel || travel > 0;

  const equipLabel =
    equipment.label
    || EQUIPMENT_TYPE_LABELS[equipment.type]
    || equipment.type
    || "Equipamento";

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-44 md:pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2 text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <span className="text-xs text-gray-500">
            Dashboard <span className="mx-1.5 text-gray-300">/</span>
            {client.name} <span className="mx-1.5 text-gray-300">/</span>
            <span className="text-gray-700 font-medium">{report.displayCode ?? "Novo laudo"}</span>
          </span>
        </div>

        {/* Documento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
              <span className="font-mono font-semibold text-gray-800">{report.displayCode ?? "—"}</span>
              <span className="text-gray-300">·</span>
              <span>Atendimento de {equipLabel.toLowerCase()}</span>
              {report.createdAt && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>Criado {new Date(report.createdAt).toLocaleString("pt-BR")}</span>
                </>
              )}
            </div>
            <div className="mt-1.5 flex items-start gap-3">
              {isDraft ? (
                <input
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={handleCommitTitle}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  placeholder="Título do laudo…"
                  aria-label="Título do laudo"
                  className="flex-1 min-w-0 text-xl font-bold tracking-tight text-gray-900 leading-snug bg-transparent px-1 -mx-1 py-0.5 rounded-md border border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 focus:outline-none placeholder:text-gray-400"
                />
              ) : (
                <h1 className="flex-1 min-w-0 text-xl font-bold tracking-tight text-gray-900 leading-snug">
                  {report.title ?? "Laudo técnico"}
                </h1>
              )}
              <span className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${status.pillClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                {status.label}
              </span>
            </div>
          </div>

          {/* Laudo perdido (CRM F2): motivo + data — terminal, sem ações de negócio abaixo */}
          {isDeclined && (
            <div className="px-6 py-3 bg-rose-50/60 border-b border-rose-100">
              <div className="flex items-start gap-2 text-sm">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-rose-800">
                    Laudo perdido
                    {report.declinedReason && ` · ${DECLINED_REASON_LABEL[report.declinedReason]}`}
                    {report.declinedAt && ` · ${new Date(report.declinedAt).toLocaleString("pt-BR")}`}
                  </p>
                  {report.declinedReasonText && (
                    <p className="text-rose-700/90 mt-0.5">{report.declinedReasonText}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Context row */}
          <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-gray-100">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="w-9 h-9 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Cliente</div>
                <div className="text-sm font-semibold text-gray-900 truncate">{client.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {client.phone ?? "—"}{client.email ? ` · ${client.email}` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="w-9 h-9 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                <Wind className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Equipamento</div>
                <div className="text-sm font-semibold text-gray-900 truncate">{equipLabel}</div>
                <div className="text-xs text-gray-500 truncate">
                  {equipment.brand ?? "—"}{equipment.model ? ` ${equipment.model}` : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Link público (se já enviado) */}
          {!isDraft && (
            <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100">
              {/* Desktop: campo + ícones */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-blue-700 font-medium shrink-0">Link público</span>
                <input
                  value={publicLink}
                  readOnly
                  className="flex-1 min-w-0 text-xs font-mono px-2 py-1 rounded border border-blue-200 bg-white text-gray-700"
                />
                <button
                  onClick={copyLink}
                  className="h-7 px-2 shrink-0 rounded border border-blue-200 bg-white text-blue-700 hover:bg-blue-100 transition"
                  title="Copiar link"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={publicLink} target="_blank" rel="noreferrer"
                  className="h-7 px-2 shrink-0 rounded border border-blue-200 bg-white text-blue-700 hover:bg-blue-100 transition inline-flex items-center"
                  title="Abrir como o cliente vai ver"
                >
                  <Eye className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Mobile: botões de ação (link cru não ajuda numa tela pequena) */}
              <div className="md:hidden">
                <span className="text-[11px] uppercase tracking-wide text-blue-700 font-medium">Link público</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={copyLink}
                    className="h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white text-sm font-medium text-blue-700 active:bg-blue-100 transition"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <Copy className="w-4 h-4 shrink-0" />}
                    {copied ? "Copiado!" : "Copiar link"}
                  </button>
                  <a
                    href={publicLink} target="_blank" rel="noreferrer"
                    className="h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white text-sm font-medium text-blue-700 active:bg-blue-100 transition"
                  >
                    <Eye className="w-4 h-4 shrink-0" />
                    Ver como cliente
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Diagnóstico técnico — editável apenas em rascunho */}
          {(isDraft || report.diagnosis) && (
            <div className="px-6 pt-5 pb-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900">Diagnóstico técnico</h2>
                {!isDraft && (
                  <span className="text-[11px] text-gray-400">Somente leitura</span>
                )}
              </div>
              {isDraft ? (
                <textarea
                  value={diagnosisDraft}
                  onChange={e => setDiagnosisDraft(e.target.value)}
                  onBlur={handleCommitDiagnosis}
                  placeholder="O que você observou no equipamento? (ex.: compressor com ruído anormal, vazamento de gás na linha de alta…)"
                  rows={3}
                  className="w-full text-sm rounded-md border border-gray-200 bg-white p-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-gray-400"
                />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50/70 rounded-md border border-gray-100 p-2.5">
                  {report.diagnosis}
                </p>
              )}
            </div>
          )}

          {/* Visitas deste laudo (Fase F4) — avaliação + execuções */}
          {detail.visits.length > 0 && (
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Visitas deste laudo</h2>
              <ReportVisitsTimeline visits={detail.visits} />

              {/* Aguardando execução: agendar uma visita de retorno OU executar hoje */}
              {isAwaitingExecution && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleOpen(true)}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Agendar nova visita de execução
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteToday}
                    disabled={executingToday || hasExecutionToday}
                    title={hasExecutionToday ? "Já existe uma visita de execução agendada para hoje" : undefined}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-semibold transition disabled:cursor-not-allowed ${
                      hasExecutionToday
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600 disabled:opacity-60"
                    }`}
                  >
                    {executingToday ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : hasExecutionToday ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {hasExecutionToday ? "Execução de hoje já criada" : "Executar hoje"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Itens do serviço */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Itens do serviço</h2>
              <span className="text-xs text-gray-500">
                {items.length} {items.length === 1 ? "item" : "itens"}
                {!isDraft && ` · ${itemsCompleted}/${activeItems.length} concluídos`}
              </span>
            </div>

            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">Nenhum item ainda. Adicione abaixo.</p>
              )}

              {items.map((item, idx) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={idx + 1}
                  isDraft={isDraft}
                  canExecute={canExecute}
                  isCompleted={isCompleted}
                  token={token!}
                  reportId={id!}
                  onUpdate={(patch) => handleUpdateItem(item.id, patch)}
                  onDelete={() => handleDeleteItem(item.id)}
                  onItemUpdated={setDetail}
                />
              ))}

              {isDraft && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={addingItem}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Adicionar item
                </button>
              )}
            </div>
          </div>

          {/* Observações finais — editáveis somente em "approved" (pré-finalização) */}
          {(canExecute || report.finalNotes) && (
            <div className="px-6 pb-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900">Observações finais</h2>
                {!canExecute && (
                  <span className="text-[11px] text-gray-400">Somente leitura</span>
                )}
              </div>
              {canExecute ? (
                <textarea
                  value={finalNotesDraft}
                  onChange={e => setFinalNotesDraft(e.target.value)}
                  onBlur={handleCommitFinalNotes}
                  placeholder="Notas pós-execução para o cliente (ex.: recomendar limpeza semestral, próxima revisão em 6 meses…)"
                  rows={3}
                  className="w-full text-sm rounded-md border border-gray-200 bg-white p-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-gray-400"
                />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50/70 rounded-md border border-gray-100 p-2.5">
                  {report.finalNotes}
                </p>
              )}
            </div>
          )}

          {/* Resumo financeiro */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Resumo financeiro</h2>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50/60 to-white p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Total do laudo
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Subtotal ({activeItems.length} {activeItems.length === 1 ? "item" : "itens"})
                </span>
                <span className="font-semibold text-gray-900 tabular-nums">{centsToBRL(subtotal)}</span>
              </div>

              {showLabor && (
                <div className="flex items-center justify-between gap-3 text-sm border-t border-gray-100 pt-3">
                  <span className="text-gray-600 shrink-0">Mão de obra</span>
                  {isDraft && provider?.chargesLabor ? (
                    <div className="w-32">
                      <CurrencyInput valueCents={labor} onCommit={handleCommitLabor} />
                    </div>
                  ) : (
                    <span className="font-semibold text-gray-900 tabular-nums">{centsToBRL(labor)}</span>
                  )}
                </div>
              )}

              {showTravel && (
                <div className="flex items-center justify-between gap-3 text-sm border-t border-gray-100 pt-3">
                  <div className="min-w-0">
                    <span className="text-gray-600">Deslocamento</span>
                    {isDraft && provider?.chargesTravel && (
                      <button
                        type="button"
                        onClick={handleSuggestTravel}
                        disabled={suggestingTravel}
                        className="block text-[11px] text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {suggestingTravel ? "Estimando…" : "Sugerir pela distância"}
                      </button>
                    )}
                  </div>
                  {isDraft && provider?.chargesTravel ? (
                    <div className="w-32 shrink-0">
                      <CurrencyInput valueCents={travel} onCommit={handleCommitTravel} />
                    </div>
                  ) : (
                    <span className="font-semibold text-gray-900 tabular-nums">{centsToBRL(travel)}</span>
                  )}
                </div>
              )}

              <div className="border-b border-gray-100" />

              {discount > 0 && (
                <div className="flex items-center justify-between text-sm pb-1">
                  <span className="text-gray-600">Desconto</span>
                  <span className="font-medium text-rose-600 tabular-nums">− {centsToBRL(discount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-emerald-50/70 border border-emerald-200 px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold text-emerald-900">Total a aprovar</div>
                  <div className="text-[11px] text-emerald-700/80">Valor que o cliente verá no link público</div>
                </div>
                <div className="text-2xl font-bold text-emerald-700 tabular-nums">{centsToBRL(total)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action bar (desktop) */}
        <div className="mt-4 hidden md:flex flex-wrap items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Auto-salvo
            </span>
            {/* {publicLink && (
              <a
                href={publicLink} target="_blank" rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-gray-600 hover:text-blue-600"
              >
                <Eye className="w-3.5 h-3.5" />
                Como o cliente vai ver
              </a>
            )} */}
          </div>

          <div className="flex items-center gap-2">
            {isDraft && items.length > 0 && (
              !confirmSend ? (
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={() => setConfirmSend(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar pré-laudo para o cliente aprovar
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-600">Após enviar, não dá pra editar itens.</span>
                  <Button variant="outline" size="sm" onClick={() => setConfirmSend(false)} disabled={sending}>
                    Cancelar
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleSend} disabled={sending}>
                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Confirmar envio
                  </Button>
                </div>
              )
            )}

            {report.status === "sent" && (
              <span className="text-xs text-gray-600">Aguardando aprovação do cliente pelo link acima.</span>
            )}

            {isAwaitingPayment && !isCashPending && (
              <span className="text-xs text-amber-700 font-medium inline-flex items-center gap-1.5">
                <Banknote className="w-4 h-4" />
                Aguardando o pagamento do cliente.
              </span>
            )}

            {isCashPending && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-600">
                  Cliente escolheu pagar em dinheiro. Confirme assim que receber para liberar o laudo.
                </span>
                <Button
                  size="lg"
                  className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                  onClick={handleConfirmCash}
                  disabled={confirmingCash}
                >
                  {confirmingCash ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                  Confirmar dinheiro recebido
                </Button>
              </div>
            )}

            {canExecute && (
              <div className="flex flex-col items-end gap-1.5">
                {isAwaitingExecution && (
                  <span className="text-xs text-amber-700 font-medium inline-flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4" />
                    {hasScheduledExecution
                      ? "Execução agendada — suba as fotos antes/depois e finalize após executar."
                      : "Aguardando execução — agende a visita de execução e finalize após executar."}
                  </span>
                )}
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={handleComplete}
                  disabled={completing || itemsCompleted < activeItems.length}
                >
                  {completing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {itemsCompleted < activeItems.length
                    ? `Faltam ${activeItems.length - itemsCompleted} item(ns)`
                    : "Finalizar laudo"}
                </Button>
              </div>
            )}

            {isCompleted && (
              <span className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Concluído em {new Date(report.completedAt!).toLocaleString("pt-BR")}
              </span>
            )}

            {isDeclined && (
              <span className="text-xs text-rose-700 font-medium inline-flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Laudo perdido — sem novas ações.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action bar (mobile, fixa no rodapé): total + ação contextual sempre à mão */}
      {/* Fica acima do bottom nav fixo (Layout.tsx), que reserva 4rem + safe-area no rodapé mobile */}
      <div className="md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {!isCompleted && !isDeclined && (
            <div className="shrink-0">
              <div className="text-[11px] leading-none text-gray-500">Total</div>
              <div className="text-lg font-bold text-gray-900 tabular-nums leading-tight">{centsToBRL(total)}</div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {isDraft && items.length === 0 && (
              <p className="text-xs text-gray-500 text-center">Adicione itens para enviar o laudo.</p>
            )}

            {isDraft && items.length > 0 && (
              !confirmSend ? (
                <Button className="w-full h-11 text-sm bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setConfirmSend(true)}>
                  <Send className="w-4 h-4 mr-2" /> Enviar pré-laudo
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex-1 h-11 text-sm" onClick={() => setConfirmSend(false)} disabled={sending}>
                    Cancelar
                  </Button>
                  <Button className="flex-1 h-11 text-sm bg-blue-600 hover:bg-blue-700" onClick={handleSend} disabled={sending}>
                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Confirmar
                  </Button>
                </div>
              )
            )}

            {report.status === "sent" && (
              <p className="text-xs text-gray-600 text-center">Aguardando aprovação do cliente.</p>
            )}

            {isAwaitingPayment && !isCashPending && (
              <p className="w-full text-xs text-amber-700 font-medium inline-flex items-center justify-center gap-1.5">
                <Banknote className="w-4 h-4" /> Aguardando pagamento.
              </p>
            )}

            {isCashPending && (
              <Button className="w-full h-11 text-sm bg-amber-500 hover:bg-amber-600 text-white" onClick={handleConfirmCash} disabled={confirmingCash}>
                {confirmingCash ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                Confirmar dinheiro recebido
              </Button>
            )}

            {canExecute && (
              <div className="flex flex-col gap-1.5">
                {isAwaitingExecution && (
                  <p className="w-full text-[11px] text-amber-700 font-medium inline-flex items-center justify-center gap-1 text-center">
                    <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                    Aguardando execução — agende a visita de execução.
                  </p>
                )}
                <Button className="w-full h-11 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleComplete} disabled={completing || itemsCompleted < activeItems.length}>
                  {completing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {itemsCompleted < activeItems.length ? `Faltam ${activeItems.length - itemsCompleted} item(ns)` : "Finalizar laudo"}
                </Button>
              </div>
            )}

            {isCompleted && (
              <p className="w-full text-xs text-emerald-700 font-medium inline-flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Concluído em {new Date(report.completedAt!).toLocaleString("pt-BR")}
              </p>
            )}

            {isDeclined && (
              <p className="w-full text-xs text-rose-700 font-medium inline-flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4" /> Laudo perdido — sem novas ações.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Agendar visita de execução (laudo aguardando execução) */}
      {token && provider?.publicToken && (
        <ScheduleExecutionDialog
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          token={token}
          publicToken={provider.publicToken}
          clientId={client.id}
          reportId={report.id}
          onScheduled={reloadDetail}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Item Card
// ─────────────────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: IReportItemResponse;
  index: number;
  isDraft: boolean;
  canExecute: boolean;
  isCompleted: boolean;
  token: string;
  reportId: string;
  onUpdate: (patch: Parameters<typeof reportService.updateItem>[3]) => Promise<void>;
  onDelete: () => void;
  onItemUpdated: (d: IReportDetailResponse) => void;
}

function ItemCard({
  item, index, isDraft, canExecute, isCompleted,
  token, reportId, onUpdate, onDelete, onItemUpdated,
}: ItemCardProps) {
  const [desc, setDesc] = useState(item.description);
  const [prevDesc, setPrevDesc] = useState(item.description);
  if (item.description !== prevDesc) {
    setPrevDesc(item.description);
    setDesc(item.description);
  }

  const [notes, setNotes] = useState(item.notes ?? "");
  const [prevNotes, setPrevNotes] = useState(item.notes);
  if (item.notes !== prevNotes) {
    setPrevNotes(item.notes);
    setNotes(item.notes ?? "");
  }

  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);

  const commitDesc = () => {
    const trimmed = desc.trim();
    if (!trimmed || trimmed === item.description) {
      setDesc(item.description);
      return;
    }
    onUpdate({ description: trimmed });
  };

  const commitNotes = () => {
    const trimmed = notes.trim();
    if (trimmed === (item.notes ?? "")) return;
    onUpdate({ notes: trimmed });
  };

  const handleFile = async (file: File, kind: "before" | "after") => {
    setUploading(kind);
    try {
      const url = await uploadService.upload(token, file);
      const updated = await reportService.updateItem(token, reportId, item.id,
        kind === "before" ? { photoBefore: url } : { photoAfter: url }
      );
      onItemUpdated(updated);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao fazer upload da foto"));
    } finally {
      setUploading(null);
    }
  };

  const done = !!(item.photoBefore && item.photoAfter);
  const subtotal = lineSubtotal(item);

  return (
    <div className={`rounded-lg border ${done ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 bg-white"} p-3.5 space-y-3`}>
      {/* Cabeçalho do item: índice + descrição + remover */}
      <div className="flex items-start gap-3">
        <span className="mt-2 text-[11px] font-mono font-bold text-gray-400 tabular-nums shrink-0">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          {isDraft ? (
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              placeholder="Descreva o item de serviço…"
              className={`w-full text-sm font-medium px-2 py-1.5 rounded-md border border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 focus:outline-none ${item.rejected ? "line-through text-gray-400" : "text-gray-900"}`}
            />
          ) : (
            <p className={`text-sm font-medium px-2 py-1.5 ${item.rejected ? "line-through text-gray-400" : "text-gray-900"}`}>
              {item.description}
            </p>
          )}
        </div>
        {item.rejected && (
          <span className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full shrink-0">Não autorizado</span>
        )}
        {!item.rejected && done && <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1.5 shrink-0" />}
        {isDraft && (
          <button
            onClick={onDelete}
            className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
            title="Remover item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid de campos (qty/preço/garantia/subtotal) — editável em draft, read-only nos demais estados */}
      {!item.rejected && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-8">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Quantidade</label>
            {isDraft ? (
              <QtyInput value={item.quantity} onCommit={v => onUpdate({ quantity: v })} />
            ) : (
              <div className="h-9 px-2.5 flex items-center justify-end text-sm text-gray-700 tabular-nums bg-gray-50/70 rounded-md border border-gray-100">
                {qtyToStr(item.quantity)}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Preço unitário</label>
            {isDraft ? (
              <CurrencyInput valueCents={item.unitPriceCents} onCommit={v => onUpdate({ unitPriceCents: v })} />
            ) : (
              <div className="h-9 px-2.5 flex items-center justify-end text-sm text-gray-700 tabular-nums bg-gray-50/70 rounded-md border border-gray-100">
                {centsToBRL(item.unitPriceCents)}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Garantia</label>
            {isDraft ? (
              <WarrantyInput value={item.warrantyDays} onCommit={v => onUpdate({ warrantyDays: v })} />
            ) : (
              <div className="h-9 px-2.5 flex items-center justify-end text-sm text-gray-700 tabular-nums bg-gray-50/70 rounded-md border border-gray-100">
                {item.warrantyDays ?? 0} dias
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Subtotal</label>
            <div className="h-9 px-2.5 flex items-center justify-end text-sm font-semibold text-gray-900 tabular-nums bg-white rounded-md border border-gray-200">
              {centsToBRL(subtotal)}
            </div>
          </div>
        </div>
      )}

      {/* Execução: fotos antes/depois e nota */}
      {!isDraft && !item.rejected && (
        <div className="pl-8 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <PhotoSlot
              label="Antes"
              photo={item.photoBefore}
              disabled={!canExecute || isCompleted}
              uploading={uploading === "before"}
              onClick={() => beforeRef.current?.click()}
              onDropFile={f => handleFile(f, "before")}
            />
            <PhotoSlot
              label="Depois"
              photo={item.photoAfter}
              disabled={!canExecute || !item.photoBefore || isCompleted}
              uploading={uploading === "after"}
              onClick={() => afterRef.current?.click()}
              onDropFile={f => handleFile(f, "after")}
            />
            <input ref={beforeRef} type="file" accept="image/*" capture="environment" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f, "before"); e.target.value = ""; }} />
            <input ref={afterRef} type="file" accept="image/*" capture="environment" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f, "after"); e.target.value = ""; }} />
          </div>
          {canExecute ? (
            <textarea
              className="w-full text-sm rounded-md border border-gray-200 bg-white p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50"
              rows={2}
              placeholder="Nota opcional…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={commitNotes}
            />
          ) : (item.notes) ? (
            <p className="text-xs text-gray-600 italic">{item.notes}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Photo slot
// ─────────────────────────────────────────────────────────────────────────────

interface PhotoSlotProps {
  label: string;
  photo: string | null;
  disabled: boolean;
  uploading: boolean;
  onClick: () => void;
  onDropFile?: (file: File) => void;
}

function PhotoSlot({ label, photo, disabled, uploading, onClick, onDropFile }: PhotoSlotProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith("image/"));
    if (file && onDropFile) onDropFile(file);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || uploading}
      onDragOver={e => { e.preventDefault(); if (!disabled && !uploading) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative aspect-video rounded-md border-2 border-dashed disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex flex-col items-center justify-center text-xs transition-colors ${
        dragOver ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500"
      }`}
    >
      {photo ? (
        <>
          <img src={photo} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs">{label}</span>
        </>
      ) : uploading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <Camera className="w-5 h-5 mb-1" />
          <span>{dragOver ? "Solte aqui" : label}</span>
        </>
      )}
    </button>
  );
}
