import { Skeleton } from "@/components/ui/skeleton";
import { Receipt } from "lucide-react";
import type { IPaymentListItem } from "@/services/finance";
import { formatCents } from "@/lib/utils";
import { formatShortDate } from "@/pages/settings/components/format";
import { METHOD_LABEL, STATUS_LABEL, STATUS_BADGE_CLASS } from "../labels";

function StatusBadge({ status }: { status: IPaymentListItem["status"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function refDate(p: IPaymentListItem): string {
  return formatShortDate(p.paidAt ?? p.createdAt);
}

/**
 * Lista de pagamentos — mobile-first: cards empilhados no mobile, tabela no
 * desktop (`hidden md:*`). Clique abre o detalhe do pagamento (CRM F6.2), que
 * traz um atalho para o laudo. Sem scroll horizontal no mobile.
 */
export function PaymentsList({
  items, loading, onSelect,
}: { items: IPaymentListItem[]; loading: boolean; onSelect: (p: IPaymentListItem) => void }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum pagamento neste filtro</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards empilhados */}
      <div className="space-y-2 md:hidden">
        {items.map(p => (
          <button
            key={p.paymentId}
            onClick={() => onSelect(p)}
            className="w-full text-left bg-white border rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{p.clientName ?? "Cliente"}</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {p.reportDisplayCode ?? "Laudo"} · {METHOD_LABEL[p.method]}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm text-gray-900">{formatCents(p.amountCents)}</p>
                <p className="text-[10px] text-gray-400">{refDate(p)}</p>
              </div>
            </div>
            <div className="mt-2">
              <StatusBadge status={p.status} />
            </div>
          </button>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2 pr-4 font-medium">Data</th>
              <th className="py-2 pr-4 font-medium">Cliente</th>
              <th className="py-2 pr-4 font-medium">Laudo</th>
              <th className="py-2 pr-4 font-medium">Método</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pl-4 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr
                key={p.paymentId}
                onClick={() => onSelect(p)}
                className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
              >
                <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{refDate(p)}</td>
                <td className="py-3 pr-4 font-medium text-gray-900">{p.clientName ?? "Cliente"}</td>
                <td className="py-3 pr-4 text-gray-500">{p.reportDisplayCode ?? "—"}</td>
                <td className="py-3 pr-4 text-gray-600">{METHOD_LABEL[p.method]}</td>
                <td className="py-3 pr-4"><StatusBadge status={p.status} /></td>
                <td className="py-3 pl-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                  {formatCents(p.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
