import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, QrCode, Timer } from "lucide-react";
import { toast } from "sonner";
import type { IPixData } from "@/services/checkout";
import { AwaitingPaymentPanel } from "./AwaitingPaymentPanel";

const fmtMoney = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const countdownLabel = (expiresAt: string | null | undefined): string | null => {
  if (!expiresAt) return null;
  const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/** Conta regressiva "mm:ss" a partir de uma data de expiração ISO. */
function useCountdown(expiresAt: string | null | undefined): string | null {
  // Valor inicial calculado na montagem (lazy init) — sem setState no corpo do effect.
  const [label, setLabel] = useState<string | null>(() => countdownLabel(expiresAt));
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setLabel(countdownLabel(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return label;
}

/**
 * Painel do PIX: QR Code + copia-e-cola + expiração, com o painel de "aguardando"
 * (polling) abaixo. "Gerar novo PIX" volta à escolha de método (P7 do backend:
 * tentar de novo = novo checkout).
 */
export function PixPaymentPanel({
  tokens, pix, amountCents, onPaid, onRegenerate,
}: {
  tokens: { pt: string; cid: string; eid: string; rt: string };
  pix: IPixData;
  amountCents: number;
  onPaid: () => void;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(pix.expiresAt);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.qrCodePayload);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <QrCode className="w-3.5 h-3.5 text-blue-600" />
        <p className="text-xs font-semibold text-gray-800">Pagar com PIX</p>
        <span className="ml-auto text-[12px] font-bold text-gray-900 tabular-nums">{fmtMoney(amountCents)}</span>
      </div>

      {pix.qrCodeImageBase64 && (
        <div className="flex justify-center">
          <img
            src={`data:image/png;base64,${pix.qrCodeImageBase64}`}
            alt="QR Code PIX"
            className="w-48 h-48 rounded-md ring-1 ring-gray-200 bg-white"
          />
        </div>
      )}

      {countdown && (
        <p className="text-[11px] text-amber-700 flex items-center justify-center gap-1">
          <Timer className="w-3 h-3" /> Expira em {countdown}
        </p>
      )}

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">PIX copia e cola</p>
        <div className="flex items-stretch gap-1.5">
          <code className="flex-1 min-w-0 truncate rounded-md bg-gray-100 ring-1 ring-gray-200 px-2 py-2 text-[11px] text-gray-600">
            {pix.qrCodePayload}
          </code>
          <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={copy}>
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            Copiar
          </Button>
        </div>
      </div>

      <AwaitingPaymentPanel tokens={tokens} mode="pix" onPaid={onPaid} />

      <button
        type="button"
        onClick={onRegenerate}
        className="block w-full text-center text-[11px] text-gray-500 underline underline-offset-2"
      >
        Gerar novo PIX
      </button>
    </div>
  );
}
