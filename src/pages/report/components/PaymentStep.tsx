import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard, QrCode, Banknote, Loader2, CheckCircle2, XCircle, ChevronRight, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AsaasDisclosure } from "@/components/AsaasDisclosure";
import { checkoutService, type IPixData } from "@/services/checkout";
import { paymentMethodService, type IPaymentMethod } from "@/services/payment-method";
import type { IPublicReportItemResponse, IPaymentInfo, PaymentMethod } from "@/services/report";
import { maskCpf, onlyDigits } from "@/lib/card";
import { SavedCardsList } from "./SavedCardsList";
import { CheckoutCardForm, type NewCardPayload } from "./CheckoutCardForm";
import { PixPaymentPanel } from "./PixPaymentPanel";
import { AwaitingPaymentPanel } from "./AwaitingPaymentPanel";

const fmtMoney = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const errMsg = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX", credit: "cartão", debit: "cartão", cash: "dinheiro", boleto: "boleto",
};

type Mode = "choose" | "pixCpf" | "pix" | "card" | "cash" | "success" | "error";

export function PaymentStep({
  tokens, amountCents, items, acceptedPaymentMethods, paymentState, onPaid,
}: {
  tokens: { pt: string; cid: string; eid: string; rt: string };
  amountCents: number;
  items: IPublicReportItemResponse[];
  acceptedPaymentMethods: PaymentMethod[];
  paymentState: IPaymentInfo | null;
  onPaid: () => void;
}) {
  // Reload em awaiting_payment com dinheiro pendente → retoma o painel de dinheiro.
  const resumeCash = paymentState?.method === "cash" && paymentState?.status === "pending";
  const [mode, setMode] = useState<Mode>(resumeCash ? "cash" : "choose");
  const [pix, setPix] = useState<IPixData | null>(null);
  const [pixCpf, setPixCpf] = useState("");
  const [processing, setProcessing] = useState(false);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [paidLabel, setPaidLabel] = useState<PaymentMethod>("pix");

  const [cards, setCards] = useState<IPaymentMethod[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  useEffect(() => {
    paymentMethodService.list(tokens.pt, tokens.cid)
      .then(setCards)
      .catch(() => setCards([]))
      .finally(() => setCardsLoading(false));
  }, [tokens.pt, tokens.cid]);

  const accepts = (m: PaymentMethod) => acceptedPaymentMethods.includes(m);

  // Após cobrança confirmada na hora (cartão) → tela de sucesso.
  const onPaidNow = (method: PaymentMethod) => { setPaidLabel(method); setMode("success"); };

  // ── Ações ──────────────────────────────────────────────────────────────────

  const startPix = async (cpf?: string) => {
    setProcessing(true);
    try {
      const res = await checkoutService.checkout(tokens.pt, tokens.cid, tokens.eid, tokens.rt, {
        method: "pix",
        holderCpfCnpj: cpf,
      });
      setPix(res.pix ?? null);
      setMode("pix");
    } catch (err) {
      const msg = errMsg(err, "Erro ao gerar o PIX");
      // Backend pede CPF quando o cliente ainda não tem cadastro de pagamento.
      if (/cpf/i.test(msg) && !cpf) { setMode("pixCpf"); }
      else { toast.error(msg); }
    } finally {
      setProcessing(false);
    }
  };

  const paySavedCard = async (cardId: string) => {
    setBusyCardId(cardId);
    try {
      const res = await checkoutService.checkout(tokens.pt, tokens.cid, tokens.eid, tokens.rt, {
        method: "credit",
        clientPaymentMethodId: cardId,
      });
      if (res.status === "paid") onPaidNow("credit");
      else onPaid();
    } catch (err) {
      setErrorText(errMsg(err, "Não foi possível concluir o pagamento"));
      setMode("error");
    } finally {
      setBusyCardId(null);
    }
  };

  const payNewCard = async (payload: NewCardPayload) => {
    setProcessing(true);
    try {
      const res = await checkoutService.checkout(tokens.pt, tokens.cid, tokens.eid, tokens.rt, {
        method: "credit",
        ...payload,
      });
      if (res.status === "paid") onPaidNow("credit");
      else onPaid();
    } catch (err) {
      setErrorText(errMsg(err, "Cartão recusado"));
      setMode("error");
    } finally {
      setProcessing(false);
    }
  };

  const payCash = async () => {
    setProcessing(true);
    try {
      await checkoutService.checkout(tokens.pt, tokens.cid, tokens.eid, tokens.rt, { method: "cash" });
      setMode("cash");
    } catch (err) {
      toast.error(errMsg(err, "Erro ao registrar o pagamento"));
    } finally {
      setProcessing(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const lineItems = items.filter(i => !i.rejected && i.unitPriceCents != null);

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Total */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-800">Total a pagar</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums">{fmtMoney(amountCents)}</p>
          </div>
          {lineItems.length > 0 && (
            <ul className="space-y-0.5 text-[11px] text-gray-500">
              {lineItems.map(it => (
                <li key={it.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{it.description}</span>
                  <span className="tabular-nums shrink-0">{fmtMoney((it.quantity ?? 1) * (it.unitPriceCents ?? 0))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 pt-3">
          {mode === "success" ? (
            <SuccessPanel method={paidLabel} amountCents={amountCents} onContinue={onPaid} />
          ) : mode === "error" ? (
            <ErrorPanel message={errorText} onRetryCard={() => setMode("card")} onChooseOther={() => setMode("choose")} />
          ) : mode === "cash" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-xs font-semibold text-gray-800">Pagamento em dinheiro</p>
              </div>
              <p className="text-[11px] text-gray-600">
                Pague {fmtMoney(amountCents)} direto ao técnico. Ele marca como recebido no app e o laudo é liberado.
              </p>
              <AwaitingPaymentPanel tokens={tokens} mode="cash" onPaid={onPaid} />
            </div>
          ) : mode === "pix" && pix ? (
            <PixPaymentPanel
              tokens={tokens} pix={pix} amountCents={amountCents}
              onPaid={onPaid} onRegenerate={() => { setPix(null); setMode("choose"); }}
            />
          ) : mode === "pixCpf" ? (
            <PixCpfPrompt
              cpf={pixCpf} setCpf={setPixCpf} processing={processing}
              onSubmit={() => {
                const digits = onlyDigits(pixCpf);
                if (digits.length !== 11) { toast.error("CPF do pagador inválido"); return; }
                startPix(digits);
              }}
              onBack={() => setMode("choose")}
            />
          ) : mode === "card" ? (
            <CheckoutCardForm
              amountCents={amountCents} processing={processing}
              onSubmit={payNewCard} onBack={() => setMode("choose")}
            />
          ) : (
            // mode === "choose"
            <div className="space-y-3">
              <SavedCardsList cards={cards} loading={cardsLoading} busyId={busyCardId} onPick={paySavedCard} />

              <p className="text-xs font-semibold text-gray-800">
                {cards.length > 0 ? "Ou escolha outra forma" : "Como você quer pagar?"}
              </p>
              <div className="space-y-2">
                {accepts("pix") && (
                  <MethodButton icon={QrCode} title="Pagar com PIX" subtitle="Aprovação na hora"
                    onClick={() => setMode("pixCpf")} disabled={processing} />
                )}
                {(accepts("credit") || accepts("debit")) && (
                  <MethodButton icon={CreditCard} title="Pagar com cartão" subtitle="Crédito ou débito"
                    onClick={() => setMode("card")} disabled={processing} />
                )}
                {accepts("cash") && (
                  <MethodButton icon={Banknote} title="Pagar em dinheiro" subtitle="Combine direto com o técnico"
                    onClick={payCash} disabled={processing} />
                )}
              </div>
              <AsaasDisclosure className="pt-1" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sub-componentes locais ─────────────────────────────────────────────────────

function MethodButton({
  icon: Icon, title, subtitle, onClick, disabled,
}: {
  icon: React.ElementType; title: string; subtitle: string;
  onClick: () => void; disabled: boolean;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="w-full flex items-center gap-3 rounded-md ring-1 ring-gray-200 bg-white px-3 py-3 text-left transition-colors hover:bg-blue-50 hover:ring-blue-200 disabled:opacity-60"
    >
      <span className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-800">{title}</p>
        <p className="text-[11px] text-gray-500">{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  );
}

function PixCpfPrompt({
  cpf, setCpf, processing, onSubmit, onBack,
}: {
  cpf: string; setCpf: (v: string) => void; processing: boolean;
  onSubmit: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <QrCode className="w-3.5 h-3.5 text-blue-600" />
        <p className="text-xs font-semibold text-gray-800">Pagar com PIX</p>
      </div>
      <p className="text-[11px] text-gray-600">Para gerar o PIX, informe o CPF do pagador.</p>
      <div className="space-y-1">
        <Label className="text-xs">CPF</Label>
        <Input inputMode="numeric" placeholder="000.000.000-00"
          value={cpf} onChange={e => setCpf(maskCpf(e.target.value))} />
      </div>
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 h-11"
        disabled={processing || onlyDigits(cpf).length !== 11}
        onClick={onSubmit}
      >
        {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Gerar PIX
      </Button>
      <button type="button" onClick={onBack} disabled={processing}
        className="block w-full text-center text-[11px] text-gray-500 underline underline-offset-2 disabled:opacity-50">
        Escolher outra forma
      </button>
      <AsaasDisclosure />
    </div>
  );
}

function SuccessPanel({ method, amountCents, onContinue }: { method: PaymentMethod; amountCents: number; onContinue: () => void }) {
  return (
    <div className="text-center space-y-2 py-2">
      <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
      <p className="text-sm font-bold text-gray-900">Pagamento confirmado!</p>
      <p className="text-[12px] text-gray-600">
        Recebemos seu pagamento de <span className="font-semibold">{fmtMoney(amountCents)}</span> no {PAYMENT_LABEL[method]}.
        Seu laudo já está liberado.
      </p>
      <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-1" onClick={onContinue}>
        Ver laudo e recibo
      </Button>
    </div>
  );
}

function ErrorPanel({ message, onRetryCard, onChooseOther }: { message: string | null; onRetryCard: () => void; onChooseOther: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-md bg-red-50 ring-1 ring-red-100 px-3 py-3 flex items-start gap-2">
        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-red-900">Pagamento não concluído</p>
          <p className="text-[11px] text-red-800">{message ?? "Tente novamente ou escolha outra forma."}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onChooseOther}>Tentar outro método</Button>
        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={onRetryCard}>Tentar de novo</Button>
      </div>
      <p className="text-xs text-gray-400 flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5" /> Nenhum valor foi cobrado.
      </p>
    </div>
  );
}
