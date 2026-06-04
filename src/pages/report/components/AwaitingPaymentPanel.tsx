import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { checkoutService, type PaymentStatus } from "@/services/checkout";

/**
 * Painel "aguardando confirmação" (PIX e dinheiro). Faz polling do status a cada
 * 4s; quando vira {@code paid}, chama {@code onPaid}. Em {@code failed}, chama
 * {@code onFailed}. Limpa o intervalo ao desmontar.
 */
export function AwaitingPaymentPanel({
  tokens, mode, onPaid, onFailed,
}: {
  tokens: { pt: string; cid: string; eid: string; rt: string };
  mode: "pix" | "cash";
  onPaid: () => void;
  onFailed?: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const onPaidRef = useRef(onPaid);
  const onFailedRef = useRef(onFailed);
  // Mantém os callbacks atuais sem recriar o intervalo de polling a cada render.
  useEffect(() => { onPaidRef.current = onPaid; onFailedRef.current = onFailed; });

  const poll = async () => {
    try {
      const { status } = await checkoutService.getStatus(tokens.pt, tokens.cid, tokens.eid, tokens.rt);
      handleStatus(status);
    } catch {
      /* silencioso no polling — tenta de novo no próximo tick */
    }
  };

  const handleStatus = (status: PaymentStatus) => {
    if (status === "paid") onPaidRef.current();
    else if (status === "failed") onFailedRef.current?.();
  };

  useEffect(() => {
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens.pt, tokens.cid, tokens.eid, tokens.rt]);

  const handleManual = async () => {
    setChecking(true);
    try {
      const { status } = await checkoutService.getStatus(tokens.pt, tokens.cid, tokens.eid, tokens.rt);
      handleStatus(status);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="rounded-md bg-blue-50 ring-1 ring-blue-100 px-3 py-3 space-y-2 text-center">
      <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto" />
      <p className="text-[12px] font-semibold text-blue-900">
        {mode === "pix" ? "Aguardando confirmação do pagamento…" : "Aguardando confirmação do técnico"}
      </p>
      <p className="text-[11px] text-blue-800 leading-relaxed">
        {mode === "pix"
          ? "Assim que o pagamento cair, o laudo é liberado automaticamente."
          : "Combine o pagamento com o prestador. Ele confirma o recebimento e o laudo é liberado."}
      </p>
      <button
        type="button"
        onClick={handleManual}
        disabled={checking}
        className="inline-flex items-center gap-1 text-[11px] text-blue-600 underline underline-offset-2 disabled:opacity-50"
      >
        {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        Já paguei, atualizar
      </button>
    </div>
  );
}
