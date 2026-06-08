import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, CreditCard, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AsaasDisclosure } from "@/components/AsaasDisclosure";
import { maskCardNumber, maskExpiry, maskCpf, onlyDigits, validateCard, parseCard } from "@/lib/card";

const fmtMoney = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface NewCardPayload {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  holderCpfCnpj: string;
  saveCard: boolean;
}

/**
 * Form de cartão novo (modelo A — nosso, sem iframe de terceiro). Reusa as
 * máscaras/validação de {@code lib/card}. Coleta o CPF do titular (exigência da
 * tokenização). Limpa o state ao desmontar (segurança — nunca persistir o PAN).
 */
export function CheckoutCardForm({
  amountCents, processing, onSubmit, onBack,
}: {
  amountCents: number;
  processing: boolean;
  onSubmit: (payload: NewCardPayload) => void;
  onBack: () => void;
}) {
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [ccv, setCcv] = useState("");
  const [cpf, setCpf] = useState("");
  const [saveCard, setSaveCard] = useState(false);

  // Segurança: limpar o cartão da memória ao desmontar.
  useEffect(() => () => { setNumber(""); setCcv(""); setCpf(""); }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateCard({ number, holderName, expiry, ccv, cpf });
    if (error) { toast.error(error); return; }
    const p = parseCard({ number, holderName, expiry, ccv, cpf });
    onSubmit({
      holderName: p.holderName,
      number: p.number,
      expiryMonth: p.expiryMonth,
      expiryYear: p.expiryYear,
      ccv: p.ccv,
      holderCpfCnpj: p.cpf,
      saveCard,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-1.5">
        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
        <p className="text-xs font-semibold text-gray-800">Pagar com cartão</p>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Número do cartão</Label>
        <div className="relative">
          <Input
            inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000"
            value={number} onChange={e => setNumber(maskCardNumber(e.target.value))} className="pr-10"
          />
          <CreditCard className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Nome do titular</Label>
        <Input autoComplete="cc-name" placeholder="Como está no cartão"
          value={holderName} onChange={e => setHolderName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Validade</Label>
          <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA"
            value={expiry} onChange={e => setExpiry(maskExpiry(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CVV</Label>
          <Input inputMode="numeric" autoComplete="cc-csc" placeholder="000"
            value={ccv} onChange={e => setCcv(onlyDigits(e.target.value).slice(0, 4))} />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">CPF do titular</Label>
        <Input inputMode="numeric" placeholder="000.000.000-00"
          value={cpf} onChange={e => setCpf(maskCpf(e.target.value))} />
      </div>

      <label className="flex items-start gap-2 cursor-pointer pt-0.5">
        <input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0" />
        <span className="text-[11px] text-gray-600 leading-snug">
          Salvar este cartão para a próxima vez
          <span className="block text-[10px] text-gray-400">Fica guardado com segurança para os próximos laudos.</span>
        </span>
      </label>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={processing}>
        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {processing ? "Processando…" : `Pagar ${fmtMoney(amountCents)}`}
      </Button>

      <button type="button" onClick={onBack} disabled={processing}
        className="flex items-center justify-center gap-1 w-full text-[11px] text-gray-500 underline underline-offset-2 disabled:opacity-50">
        <ArrowLeft className="w-3 h-3" /> Escolher outra forma
      </button>

      <div className="space-y-1.5 pt-0.5">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Seus dados são enviados com segurança.
        </p>
        <AsaasDisclosure />
      </div>
    </form>
  );
}
