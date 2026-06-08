import { CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { IPaymentMethod } from "@/services/payment-method";

const BRAND_LABEL: Record<string, string> = {
  visa: "VISA", master: "Mastercard", elo: "Elo", amex: "Amex",
  hipercard: "Hipercard", diners: "Diners",
};

/**
 * Lista de cartões salvos do cliente. Clicar num cartão cobra direto (sem CPF —
 * o customer já existe). Chip "Padrão" no cartão default.
 */
export function SavedCardsList({
  cards, loading, busyId, onPick,
}: {
  cards: IPaymentMethod[];
  loading: boolean;
  busyId: string | null;
  onPick: (cardId: string) => void;
}) {
  if (loading) {
    return <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>;
  }
  if (cards.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-800">Pagar com cartão salvo</p>
      <ul className="space-y-2">
        {cards.map(card => {
          const busy = busyId === card.id;
          const anyBusy = busyId !== null;
          return (
            <li key={card.id}>
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => onPick(card.id)}
                className="w-full flex items-center gap-2.5 rounded-md ring-1 ring-gray-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-blue-50 hover:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-800 flex items-center gap-1.5">
                    {BRAND_LABEL[card.brand] ?? card.brand?.toUpperCase()} •••• {card.last4}
                    {card.isDefault && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[9px] font-semibold px-1.5 py-0.5">
                        Padrão
                      </span>
                    )}
                  </p>
                  {card.holderName && (
                    <p className="text-[10px] text-gray-500 truncate">{card.holderName}</p>
                  )}
                </div>
                {busy && <span className="text-[10px] text-blue-600">Processando…</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
