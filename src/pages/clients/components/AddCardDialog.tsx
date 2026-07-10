import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { AsaasDisclosure } from "@/components/AsaasDisclosure";
import { paymentMethodService, type IPaymentMethod } from "@/services/payment-method";
import { maskCardNumber, maskExpiry, maskCpf, onlyDigits, validateCard, parseCard } from "@/lib/card";
import { getApiErrorMessage, getFieldErrors } from "@/services/apiError";
import { FieldError } from "@/components/ui/field-error";

interface Props {
  open: boolean;
  onClose: () => void;
  publicToken: string;
  clientId: string;
  onAdded: (card: IPaymentMethod) => void;
}

export function AddCardDialog({ open, onClose, publicToken, clientId, onAdded }: Props) {
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [ccv, setCcv] = useState("");
  const [cpf, setCpf] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  const reset = () => {
    // Segurança: nunca persistir o cartão — limpar o state ao fechar.
    setNumber(""); setHolderName(""); setExpiry(""); setCcv(""); setCpf("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateCard({ number, holderName, expiry, ccv, cpf });
    if (error) { toast.error(error); return; }
    const parsed = parseCard({ number, holderName, expiry, ccv, cpf });

    setFieldErrors(null);
    setSaving(true);
    try {
      const card = await paymentMethodService.save(publicToken, clientId, {
        holderName: parsed.holderName,
        number: parsed.number,
        expiryMonth: parsed.expiryMonth,
        expiryYear: parsed.expiryYear,
        ccv: parsed.ccv,
        holderCpfCnpj: parsed.cpf,
      });
      toast.success("Cartão salvo!");
      onAdded(card);
      handleClose();
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields) {
        setFieldErrors(fields);
      } else {
        toast.error(getApiErrorMessage(err, "Erro ao salvar o cartão"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={open => !open && handleClose()}
      size="sm"
      title="Adicionar cartão"
    >
        <p className="text-xs text-gray-500 -mt-1">
          Crédito ou débito. Usamos pra pagar os laudos do seu prestador.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Número do cartão</Label>
            <div className="relative">
              <Input
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={number}
                onChange={e => setNumber(maskCardNumber(e.target.value))}
                className="pr-10"
                aria-invalid={!!fieldErrors?.number}
              />
              <CreditCard className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <FieldError message={fieldErrors?.number} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nome do titular</Label>
            <Input
              autoComplete="cc-name"
              placeholder="Como está no cartão"
              value={holderName}
              onChange={e => setHolderName(e.target.value)}
              aria-invalid={!!fieldErrors?.holderName}
            />
            <FieldError message={fieldErrors?.holderName} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Validade</Label>
              <Input
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                value={expiry}
                onChange={e => setExpiry(maskExpiry(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CVV</Label>
              <Input
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="000"
                value={ccv}
                onChange={e => setCcv(onlyDigits(e.target.value).slice(0, 4))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CPF do titular</Label>
            <Input
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(maskCpf(e.target.value))}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 h-11"
            disabled={saving}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar cartão
          </Button>

          <div className="space-y-1.5 pt-1">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Seus dados são enviados com segurança.
            </p>
            <AsaasDisclosure />
          </div>
        </form>
    </ResponsiveModal>
  );
}
