import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext";
import { financeService, type IPaymentDetail } from "@/services/finance";
import { formatCents } from "@/lib/utils";
import { formatShortDate } from "@/pages/settings/components/format";
import { METHOD_LABEL, STATUS_LABEL, STATUS_BADGE_CLASS } from "../labels";
import { getApiErrorMessage } from "@/services/apiError";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

/**
 * Detalhe do pagamento (CRM F6.2 — Financeiro F4a): bruto sempre local; se a
 * cobrança passou pela Asaas, tenta consultar líquido/taxa (best-effort — some
 * silenciosamente quando indisponível, o resto do detalhe funciona igual).
 */
export function PaymentDetailModal({
  paymentId, open, onOpenChange,
}: { paymentId: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [detail, setDetail] = useState<IPaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !paymentId || !token) return;
    setLoading(true);
    setError(false);
    setDetail(null);
    financeService.paymentDetail(token, paymentId)
      .then(setDetail)
      .catch(e => {
        setError(true);
        toast.error(getApiErrorMessage(e, "Não foi possível carregar o detalhe do pagamento"));
      })
      .finally(() => setLoading(false));
  }, [open, paymentId, token]);

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Detalhe do pagamento" size="sm">
      {loading ? (
        <div className="space-y-2 py-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      ) : error || !detail ? (
        <div className="text-center py-8 text-gray-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Não foi possível carregar este pagamento.</p>
        </div>
      ) : (
        <div className="pt-1">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_CLASS[detail.status]}`}>
              {STATUS_LABEL[detail.status]}
            </span>
            <span className="text-lg font-bold text-gray-900">{formatCents(detail.amountCents)}</span>
          </div>
          <Row label="Cliente" value={detail.clientName ?? "—"} />
          <Row label="Laudo" value={detail.reportDisplayCode ?? "—"} />
          <Row label="Método" value={METHOD_LABEL[detail.method]} />
          <Row label="Data" value={formatShortDate(detail.paidAt ?? detail.createdAt)} />
          {detail.detail && <Row label="Obs." value={detail.detail} />}

          {detail.netAvailable ? (
            <div className="mt-2 pt-2 border-t space-y-1">
              <Row label="Valor líquido" value={formatCents(detail.netAmountCents ?? 0)} />
              <Row label="Taxa do gateway" value={formatCents(detail.feeCents ?? 0)} />
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 mt-2 pt-2 border-t">
              Valor líquido indisponível no momento.
            </p>
          )}

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate(`/dashboard/reports/${detail.reportId}`)}
          >
            <FileText className="w-4 h-4" /> Ver laudo
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
