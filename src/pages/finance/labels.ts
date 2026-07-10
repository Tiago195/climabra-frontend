import type { PaymentMethod } from "@/services/enums";
import type { PaymentStatus } from "@/services/finance";

/** Rótulo curto do método de pagamento (para chips/badges). */
export const METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  credit: "Crédito",
  debit: "Débito",
  cash: "Dinheiro",
  boleto: "Boleto",
};

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  failed: "Falhou",
  refunded: "Estornado",
};

/** Classe Tailwind do badge por status (mesma linguagem visual do app). */
export const STATUS_BADGE_CLASS: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};
