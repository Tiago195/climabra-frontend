import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  reportService,
  type IPublicReportResponse,
  type IPublicReportItemResponse,
  type IRatingInfo,
  type IFinancialInfo,
  type PaymentMethod,
} from "@/services/report";
import {
  FileText, CheckCircle2, Calendar, Send, ThumbsUp, Wrench, Camera,
  Image as ImageIcon, ShieldCheck, BadgeCheck, CreditCard, Star,
  Download, RotateCw, Timer, User, Building2, Loader2, RefreshCw,
} from "lucide-react";

// ============================================================================
// Helpers
// ============================================================================

const fmtMoney = (cents: number | null | undefined) => {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const fmtDateTime = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR");
};

function warrantyLabel(days: number | null | undefined) {
  if (days == null || days === 0) return "Sem garantia";
  if (days >= 365 && days % 365 === 0) {
    const y = days / 365;
    return `Garantia ${y} ${y === 1 ? "ano" : "anos"}`;
  }
  if (days >= 30 && days % 30 === 0) {
    const m = days / 30;
    return `Garantia ${m} ${m === 1 ? "mês" : "meses"}`;
  }
  return `Garantia ${days} dias`;
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  credit: "Cartão de crédito",
  debit: "Cartão de débito",
  cash: "Dinheiro",
  boleto: "Boleto",
};

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  split: "Split", janela: "Janela", central: "Central",
  cassete: "Cassete", piso_teto: "Piso-teto", portatil: "Portátil",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho", sent: "Aguardando aprovação", approved: "Aprovado", completed: "Concluído",
};

// Calcula gap entre approved e serviceStartedAt — usado como highlight da timeline
function gapApprovedToStart(approvedAt: string | null, startedAt: string | null): string | null {
  if (!approvedAt || !startedAt) return null;
  const diffMin = (new Date(startedAt).getTime() - new Date(approvedAt).getTime()) / 60000;
  if (diffMin <= 0) return null;
  const days = Math.floor(diffMin / 1440);
  const hours = Math.floor((diffMin % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h após aprovação`;
  if (hours > 0) return `${hours}h após aprovação`;
  return `${Math.floor(diffMin)}min após aprovação`;
}

// ============================================================================
// Placeholder de foto (quando URL não disponível) — preserva o visual do canvas
// ============================================================================

function PhotoPlaceholder({ tone, label }: { tone: "before" | "after"; label: string }) {
  const palette = tone === "after"
    ? { bgA: "#dbeafe", bgB: "#1d4ed8", ink: "#0c1e4e", Icon: BadgeCheck }
    : { bgA: "#e5e7eb", bgB: "#6b7280", ink: "#1f2937", Icon: Wrench };
  return (
    <div className="relative aspect-[4/3] rounded-md overflow-hidden ring-1 ring-gray-200">
      <svg viewBox="0 0 120 90" className="w-full h-full block">
        <defs>
          <linearGradient id={`g-${tone}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.bgA} />
            <stop offset="100%" stopColor={palette.bgB} />
          </linearGradient>
        </defs>
        <rect width="120" height="90" fill={`url(#g-${tone})`} />
        <rect x="22" y="20" width="76" height="46" rx="4" fill="#ffffff" opacity="0.18" />
        <rect x="32" y="30" width="56" height="6" rx="2" fill={palette.ink} opacity="0.18" />
        <rect x="32" y="42" width="42" height="6" rx="2" fill={palette.ink} opacity="0.14" />
        <rect x="32" y="54" width="28" height="6" rx="2" fill={palette.ink} opacity="0.12" />
      </svg>
      <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
        <palette.Icon className="w-2.5 h-2.5" />
        {label}
      </div>
    </div>
  );
}

function PhotoFrame({ url, tone, label }: { url: string | null; tone: "before" | "after"; label: string }) {
  if (!url) return <PhotoPlaceholder tone={tone} label={label} />;
  return (
    <div className="relative aspect-[4/3] rounded-md overflow-hidden ring-1 ring-gray-200 bg-gray-100">
      <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
        {label}
      </div>
    </div>
  );
}

// ============================================================================
// Component principal
// ============================================================================

export function PublicReport() {
  const { providerToken, clientId, equipmentId, reportToken } = useParams<{
    providerToken: string; clientId: string; equipmentId: string; reportToken: string;
  }>();

  const [data, setData] = useState<IPublicReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Aprovação (status=sent)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Rating (status=completed)
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!providerToken || !clientId || !equipmentId || !reportToken) return;
    reportService.getPublic(providerToken, clientId, equipmentId, reportToken)
      .then(d => {
        setData(d);
        // Pré-seleciona todos os itens quando o cliente está aprovando
        if (d.report.status === "sent") {
          setSelectedIds(new Set(d.items.map(i => i.id)));
        }
      })
      .catch(() => toast.error("Laudo não encontrado"))
      .finally(() => setLoading(false));
  }, [providerToken, clientId, equipmentId, reportToken]);

  const handleRefresh = async () => {
    if (!providerToken || !clientId || !equipmentId || !reportToken) return;
    setRefreshing(true);
    try {
      setData(await reportService.getPublic(providerToken, clientId, equipmentId, reportToken));
    } catch {
      toast.error("Erro ao atualizar. Tente novamente.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async () => {
    if (!providerToken || !clientId || !equipmentId || !reportToken) return;
    setApproving(true);
    try {
      setData(await reportService.approve(providerToken, clientId, equipmentId, reportToken, Array.from(selectedIds)));
      toast.success("Serviço autorizado!");
      setConfirmOpen(false);
    } catch {
      toast.error("Erro ao autorizar. Tente novamente.");
    } finally {
      setApproving(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!providerToken || !clientId || !equipmentId || !reportToken) return;
    if (ratingStars < 1 || ratingStars > 5) {
      toast.error("Escolha de 1 a 5 estrelas");
      return;
    }
    setSubmittingRating(true);
    try {
      await reportService.submitRating(providerToken, clientId, equipmentId, reportToken, {
        stars: ratingStars,
        comment: ratingComment.trim() || undefined,
      });
      toast.success("Avaliação enviada. Obrigado!");
      setData(await reportService.getPublic(providerToken, clientId, equipmentId, reportToken));
    } catch {
      toast.error("Erro ao enviar avaliação");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto p-8 text-center text-gray-500">
        Laudo não encontrado.
      </div>
    );
  }

  const { report, items, equipment, provider, financial, rating } = data;
  const isSent = report.status === "sent";
  const isApproved = report.status === "approved";
  const isCompleted = report.status === "completed";

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-12">

        {/* ═════════════ HEADER DO LAUDO ═════════════ */}
        <ReportHeader
          displayCode={report.displayCode}
          status={report.status}
          title={report.diagnosis || "Laudo técnico de serviço"}
          equipment={equipment}
        />

        {/* ═════════════ TIMELINE ═════════════ */}
        <TimelineCard
          submittedAt={report.submittedAt}
          sentAt={report.sentAt}
          approvedAt={report.approvedAt}
          serviceStartedAt={report.serviceStartedAt}
          photoBeforeAt={report.photoBeforeAt}
          photoAfterAt={report.photoAfterAt}
          completedAt={report.completedAt}
        />

        {/* ═════════════ ESTADO: SENT (cliente aprovando) ═════════════ */}
        {isSent && (
          <ApprovalSection
            items={items}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            confirmOpen={confirmOpen}
            setConfirmOpen={setConfirmOpen}
            approving={approving}
            onApprove={handleApprove}
          />
        )}

        {/* ═════════════ ESTADO: APPROVED (aguardando execução) ═════════════ */}
        {isApproved && (
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="py-4 space-y-3">
              <p className="text-sm text-purple-900">
                O prestador está executando o serviço. Atualize a página conforme ele avança para ver as fotos.
              </p>
              <Button
                variant="outline"
                className="w-full border-purple-300 text-purple-900 hover:bg-purple-100"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Atualizar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═════════════ ESTADO: COMPLETED (laudo final estilo canvas) ═════════════ */}
        {isCompleted && (
          <>
            {/* Fotos antes/depois */}
            <PhotosCard items={items} />

            {/* Descrição técnica (sem AI por enquanto: usa diagnosis + finalNotes) */}
            <DescriptionCard diagnosis={report.diagnosis} finalNotes={report.finalNotes} />

            {/* Serviços executados (com valor + garantia) */}
            <ItemsCard items={items} />

            {/* Resumo financeiro + pagamento */}
            {financial && <FinancialCard financial={financial} />}

            {/* Avaliação — mostrada se existe, formulário se ainda não */}
            {rating ? (
              <RatingDisplay rating={rating} />
            ) : (
              <RatingForm
                stars={ratingStars}
                hoverStars={ratingHover}
                comment={ratingComment}
                onSelectStars={setRatingStars}
                onHoverStars={setRatingHover}
                onCommentChange={setRatingComment}
                submitting={submittingRating}
                onSubmit={handleSubmitRating}
              />
            )}

            {/* CTA rodapé */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 gap-1.5 text-xs"
                onClick={() => providerToken && clientId && equipmentId && reportToken &&
                  window.open(reportService.publicPdfUrl(providerToken, clientId, equipmentId, reportToken), "_blank")
                }
              >
                <Download className="w-3.5 h-3.5" /> Baixar PDF
              </Button>
              <Button size="sm" className="flex-1 h-9 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
                <RotateCw className="w-3.5 h-3.5" /> Solicitar nova visita
              </Button>
            </div>
          </>
        )}

        <p className="text-[10px] text-center text-gray-400 pt-2">
          Em caso de dúvidas, fale com {provider.name}
          {provider.companyName ? ` — ${provider.companyName}` : ""}
          {provider.phone ? ` · ${provider.phone}` : ""}.
          <br />
          Status do laudo: {STATUS_LABEL[report.status] ?? report.status}
          {report.completedAt && (
            <>
              {" · Finalizado em "}
              {fmtDateTime(report.completedAt)}
            </>
          )}
        </p>

      </div>
    </div>
  );
}

// ============================================================================
// Sub-componentes (extraídos pra legibilidade)
// ============================================================================

function ReportHeader({
  displayCode, status, title, equipment,
}: {
  displayCode: string | null;
  status: string;
  title: string;
  equipment: IPublicReportResponse["equipment"];
}) {
  const isCompleted = status === "completed";
  const statusColor = isCompleted ? "bg-green-100 text-green-700"
    : status === "approved" ? "bg-purple-100 text-purple-700"
    : status === "sent" ? "bg-blue-100 text-blue-700"
    : "bg-gray-100 text-gray-700";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
          Laudo{displayCode ? ` · ${displayCode}` : ""}
        </p>
        <span className={`inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-2 py-0.5 ${statusColor}`}>
          {isCompleted && <CheckCircle2 className="w-3 h-3" />}
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>
      <h1 className="text-lg font-bold text-gray-900 leading-snug">
        {title || <FileText className="w-5 h-5 inline text-blue-600" />}
      </h1>
      {equipment && (
        <p className="text-xs text-gray-600 flex items-center gap-1">
          <Building2 className="w-3 h-3 text-gray-400" />
          {equipment.label || EQUIPMENT_TYPE_LABELS[equipment.type] || equipment.type}
          {equipment.brand && ` — ${EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type} · ${equipment.brand}`}
          {equipment.model && ` ${equipment.model}`}
        </p>
      )}
    </div>
  );
}

function TimelineCard({
  submittedAt, sentAt, approvedAt, serviceStartedAt, photoBeforeAt, photoAfterAt, completedAt,
}: {
  submittedAt: string | null; sentAt: string | null; approvedAt: string | null;
  serviceStartedAt: string | null; photoBeforeAt: string | null; photoAfterAt: string | null;
  completedAt: string | null;
}) {
  const startGap = useMemo(() => gapApprovedToStart(approvedAt, serviceStartedAt), [approvedAt, serviceStartedAt]);

  const events = useMemo(() => [
    { key: "submitted", icon: Send, label: "Solicitação enviada", date: fmtDateTime(submittedAt), color: "text-gray-500" },
    { key: "quote", icon: FileText, label: "Laudo submetido", date: fmtDateTime(sentAt), color: "text-blue-600" },
    { key: "approved", icon: ThumbsUp, label: "Aprovado pelo cliente", date: fmtDateTime(approvedAt), color: "text-blue-600" },
    { key: "started", icon: Wrench, label: "Serviço iniciado", date: fmtDateTime(serviceStartedAt), color: "text-amber-600", highlight: startGap },
    { key: "before", icon: Camera, label: "Fotos antes", date: fmtDateTime(photoBeforeAt), color: "text-gray-500" },
    { key: "after", icon: ImageIcon, label: "Fotos depois", date: fmtDateTime(photoAfterAt), color: "text-gray-500" },
    { key: "done", icon: CheckCircle2, label: "Serviço finalizado", date: fmtDateTime(completedAt), color: "text-green-600" },
  ].filter(e => e.date), [submittedAt, sentAt, approvedAt, serviceStartedAt, photoBeforeAt, photoAfterAt, completedAt, startGap]);

  if (events.length === 0) return null;

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center gap-1.5 mb-3">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-xs font-semibold text-gray-800">Linha do tempo</p>
        </div>
        <ol className="space-y-2.5 relative">
          <div className="absolute left-[11px] top-1.5 bottom-1.5 w-px bg-gray-200" aria-hidden />
          {events.map(e => {
            const Icon = e.icon;
            return (
              <li key={e.key} className="relative flex items-start gap-2.5 pl-0">
                <div className="relative z-10 w-6 h-6 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center shrink-0">
                  <Icon className={`w-3 h-3 ${e.color}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[12px] font-medium text-gray-800 leading-tight">{e.label}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{e.date}</p>
                  {e.highlight && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-[10px] font-semibold px-1.5 py-0.5">
                      <Timer className="w-2.5 h-2.5" /> {e.highlight}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function PhotosCard({ items }: { items: IPublicReportItemResponse[] }) {
  // Só fotos de itens não-rejeitados que tenham pelo menos uma foto
  const photoItems = items.filter(i => !i.rejected && (i.photoBefore || i.photoAfter));
  if (photoItems.length === 0) return null;
  return (
    <Card>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-xs font-semibold text-gray-800">Fotos antes &amp; depois</p>
          <span className="ml-auto text-[10px] text-gray-400">{photoItems.length} {photoItems.length === 1 ? "par" : "pares"}</span>
        </div>
        {photoItems.map(i => {
          const uploader = i.photoBeforeUploadedByName || i.photoAfterUploadedByName;
          const uploadDate = fmtDate(i.photoAfterUploadedAt || i.photoBeforeUploadedAt);
          return (
            <div key={i.id} className="space-y-1.5">
              <p className="text-[11px] font-medium text-gray-700">{i.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <PhotoFrame url={i.photoBefore} tone="before" label="Antes" />
                <PhotoFrame url={i.photoAfter} tone="after" label="Depois" />
              </div>
              {(uploader || uploadDate) && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <User className="w-2.5 h-2.5" />
                  {uploader && `Enviadas por ${uploader}`}
                  {uploader && uploadDate && " · "}
                  {uploadDate}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DescriptionCard({ diagnosis, finalNotes }: { diagnosis: string | null; finalNotes: string | null }) {
  if (!diagnosis && !finalNotes) return null;
  return (
    <Card>
      <CardContent className="py-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-xs font-semibold text-gray-800">Descrição técnica</p>
        </div>
        {diagnosis && (
          <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">
            {diagnosis}
          </p>
        )}
        {finalNotes && (
          <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line border-l-2 border-gray-200 pl-2 italic">
            {finalNotes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ItemsCard({ items }: { items: IPublicReportItemResponse[] }) {
  const approved = items.filter(i => !i.rejected);
  return (
    <Card>
      <CardContent className="py-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-xs font-semibold text-gray-800">Serviços executados</p>
          <span className="ml-auto text-[10px] text-gray-400">{approved.length} {approved.length === 1 ? "item" : "itens"}</span>
        </div>
        <ul className="space-y-2">
          {approved.map((it, idx) => {
            const qty = it.quantity ?? 1;
            const unit = it.unitPriceCents;
            const sub = unit != null ? qty * unit : null;
            const w = warrantyLabel(it.warrantyDays);
            const noWarranty = !it.warrantyDays || it.warrantyDays === 0;
            return (
              <li key={it.id} className="rounded-md ring-1 ring-gray-200 bg-white px-2.5 py-2 space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-blue-500 mt-0.5 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[12px] font-medium text-gray-800 flex-1 leading-snug">
                    {it.description}
                  </p>
                  {sub != null && (
                    <p className="text-[12px] font-semibold text-gray-900 tabular-nums shrink-0">
                      {fmtMoney(sub)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pl-5">
                  {unit != null && (
                    <span className="text-[10px] text-gray-500 tabular-nums">
                      {qty.toString().replace(".", ",")} × {fmtMoney(unit)}
                    </span>
                  )}
                  <span className={`ml-auto inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-1.5 py-0.5 ${
                    noWarranty
                      ? "bg-gray-100 text-gray-500"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  }`}>
                    <ShieldCheck className="w-2.5 h-2.5" /> {w}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function FinancialCard({ financial }: { financial: IFinancialInfo }) {
  const { subtotalCents, discountCents, totalCents, payment } = financial;
  if (subtotalCents == null || subtotalCents === 0) return null;
  return (
    <Card>
      <CardContent className="py-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-xs font-semibold text-gray-800">Resumo financeiro</p>
        </div>
        <div className="space-y-1 text-[12px] tabular-nums">
          <div className="flex items-center justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{fmtMoney(subtotalCents)}</span>
          </div>
          {discountCents != null && discountCents > 0 && (
            <div className="flex items-center justify-between text-emerald-700">
              <span>Desconto</span>
              <span>− {fmtMoney(discountCents)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-gray-100 pt-1.5 mt-1.5 text-gray-900 font-bold">
            <span>{payment ? "Total pago" : "Total"}</span>
            <span>{fmtMoney(totalCents)}</span>
          </div>
        </div>
        {payment && (
          <div className="mt-2 rounded-md bg-blue-50 ring-1 ring-blue-100 px-2.5 py-2 flex items-start gap-2">
            <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-blue-900">
                {PAYMENT_LABEL[payment.method] ?? payment.method}
              </p>
              {payment.detail && <p className="text-[11px] text-blue-800">{payment.detail}</p>}
              <p className="text-[10px] text-blue-700/80 mt-0.5">
                Quitado em {fmtDateTime(payment.paidAt)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RatingDisplay({ rating }: { rating: IRatingInfo }) {
  return (
    <Card className="bg-amber-50/60 border-amber-200">
      <CardContent className="py-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <p className="text-xs font-semibold text-gray-800">Avaliação do cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${i < rating.stars ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-2xl font-bold text-gray-900 tabular-nums">
            {rating.stars}<span className="text-sm text-gray-400 font-medium">/5</span>
          </span>
        </div>
        {rating.comment && (
          <p className="text-[12px] text-gray-700 italic leading-relaxed border-l-2 border-amber-300 pl-2">
            "{rating.comment}"
          </p>
        )}
        <p className="text-[10px] text-gray-500">
          {rating.ratedByName && `— ${rating.ratedByName}`}
          {rating.ratedByName && rating.ratedAt && " · "}
          {fmtDateTime(rating.ratedAt)}
        </p>
      </CardContent>
    </Card>
  );
}

function RatingForm({
  stars, hoverStars, comment, onSelectStars, onHoverStars, onCommentChange, submitting, onSubmit,
}: {
  stars: number; hoverStars: number; comment: string;
  onSelectStars: (n: number) => void; onHoverStars: (n: number) => void;
  onCommentChange: (s: string) => void;
  submitting: boolean; onSubmit: () => void;
}) {
  const displayStars = hoverStars || stars;
  return (
    <Card className="bg-amber-50/60 border-amber-200">
      <CardContent className="py-3 space-y-3">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <p className="text-xs font-semibold text-gray-800">Como foi o serviço?</p>
        </div>
        <p className="text-[11px] text-gray-600">
          Sua avaliação ajuda outros clientes e o profissional. É anônima para os outros — só ele vê.
        </p>
        <div
          className="flex items-center gap-1 justify-center py-2"
          onMouseLeave={() => onHoverStars(0)}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            const active = value <= displayStars;
            return (
              <button
                key={i}
                type="button"
                className="p-1 -m-1 transition-transform hover:scale-110"
                onMouseEnter={() => onHoverStars(value)}
                onClick={() => onSelectStars(value)}
                aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
              >
                <Star className={`w-8 h-8 transition-colors ${active ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
              </button>
            );
          })}
        </div>
        <Textarea
          placeholder="Deixe um comentário (opcional)"
          value={comment}
          onChange={e => onCommentChange(e.target.value)}
          maxLength={2000}
          className="text-[12px] min-h-[70px] bg-white"
        />
        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          size="sm"
          disabled={stars === 0 || submitting}
          onClick={onSubmit}
        >
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {stars === 0 ? "Escolha as estrelas" : "Enviar avaliação"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ApprovalSection({
  items, selectedIds, setSelectedIds, confirmOpen, setConfirmOpen, approving, onApprove,
}: {
  items: IPublicReportItemResponse[];
  selectedIds: Set<string>; setSelectedIds: (s: Set<string>) => void;
  confirmOpen: boolean; setConfirmOpen: (b: boolean) => void;
  approving: boolean; onApprove: () => void;
}) {
  return (
    <>
      <Card>
        <CardContent className="py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-semibold text-gray-800">Serviços a executar</p>
            </div>
            <button
              type="button"
              className="text-[10px] text-blue-600 underline underline-offset-2"
              onClick={() => setSelectedIds(
                selectedIds.size === items.length ? new Set() : new Set(items.map(i => i.id))
              )}
            >
              {selectedIds.size === items.length ? "Desmarcar todos" : "Marcar todos"}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 -mt-2">
            Desmarque os serviços que não deseja autorizar.
          </p>
          <ul className="space-y-2">
            {items.map((it, idx) => {
              const isSelected = selectedIds.has(it.id);
              return (
                <li key={it.id} className={`rounded-md ring-1 px-2.5 py-2 cursor-pointer transition-colors ${
                  isSelected ? "ring-blue-200 bg-blue-50" : "ring-gray-200 bg-gray-50/50"
                }`}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(it.id); else next.delete(it.id);
                        setSelectedIds(next);
                      }}
                      className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
                    />
                    <span className="text-[10px] font-bold text-blue-500 mt-0.5 shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className={`text-[12px] font-medium flex-1 leading-snug ${isSelected ? "text-gray-800" : "text-gray-400"}`}>
                      {it.description}
                    </p>
                    {it.unitPriceCents != null && (
                      <span className="text-[11px] font-semibold text-gray-700 tabular-nums shrink-0">
                        {fmtMoney((it.quantity ?? 1) * it.unitPriceCents)}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3 space-y-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-[12px] text-blue-900">
              Ao autorizar, você concorda que o prestador realize os serviços selecionados.
            </p>
          </div>
          {!confirmOpen ? (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={selectedIds.size === 0}
            >
              {selectedIds.size === 0 ? "Selecione ao menos um serviço" : "Autorizar serviço"}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-[12px] font-medium text-center text-blue-900">Confirma a autorização?</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmOpen(false)}>
                  Cancelar
                </Button>
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={onApprove} disabled={approving}>
                  {approving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Sim, autorizo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
