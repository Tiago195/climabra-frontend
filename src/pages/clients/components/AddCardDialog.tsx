import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { AsaasDisclosure } from "@/components/AsaasDisclosure";
import { paymentMethodService, type IPaymentMethod } from "@/services/payment-method";

interface Props {
  open: boolean;
  onClose: () => void;
  publicToken: string;
  clientId: string;
  onAdded: (card: IPaymentMethod) => void;
}

const onlyDigits = (v: string) => v.replace(/\D/g, "");

// Máscaras (modelo A — form próprio, sem iframe/SDK de terceiro)
const maskCardNumber = (v: string) =>
  onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
const maskExpiry = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};
const maskCpf = (v: string) =>
  onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export function AddCardDialog({ open, onClose, publicToken, clientId, onAdded }: Props) {
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [ccv, setCcv] = useState("");
  const [cpf, setCpf] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    // Segurança: nunca persistir o cartão — limpar o state ao fechar.
    setNumber(""); setHolderName(""); setExpiry(""); setCcv(""); setCpf("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawNumber = onlyDigits(number);
    const [mm, yy] = expiry.split("/");
    const rawCpf = onlyDigits(cpf);

    if (rawNumber.length < 13 || rawNumber.length > 19) {
      toast.error("Número do cartão inválido"); return;
    }
    if (!holderName.trim()) { toast.error("Informe o nome do titular"); return; }
    if (!mm || !yy || yy.length < 2 || Number(mm) < 1 || Number(mm) > 12) {
      toast.error("Validade inválida"); return;
    }
    if (ccv.length < 3 || ccv.length > 4) { toast.error("CVV inválido"); return; }
    if (rawCpf.length !== 11) { toast.error("CPF do titular inválido"); return; }

    setSaving(true);
    try {
      const card = await paymentMethodService.save(publicToken, clientId, {
        holderName: holderName.trim(),
        number: rawNumber,
        expiryMonth: mm.padStart(2, "0"),
        expiryYear: yy.length === 2 ? `20${yy}` : yy,
        ccv,
        holderCpfCnpj: rawCpf,
      });
      toast.success("Cartão salvo!");
      onAdded(card);
      handleClose();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Erro ao salvar o cartão";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar cartão</DialogTitle>
        </DialogHeader>
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
              />
              <CreditCard className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nome do titular</Label>
            <Input
              autoComplete="cc-name"
              placeholder="Como está no cartão"
              value={holderName}
              onChange={e => setHolderName(e.target.value)}
            />
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
      </DialogContent>
    </Dialog>
  );
}
