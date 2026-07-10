/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Wallet, Banknote, QrCode } from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { paymentService } from "@/services/payment";
import type { GatewayAccountStatus, PaymentMethod } from "@/services/enums";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/services/apiError";

const METHODS: { key: PaymentMethod; label: string; hint: string; icon: any; electronic: boolean }[] = [
  { key: "pix", label: "PIX", hint: "Confirmação na hora", icon: QrCode, electronic: true },
  { key: "credit", label: "Cartão de crédito", hint: "Em até 12x (taxas por parcela)", icon: CreditCard, electronic: true },
  { key: "debit", label: "Cartão de débito", hint: "Confirmação na hora", icon: Wallet, electronic: true },
  // { key: "boleto", label: "Boleto", hint: "Compensa em 1–2 dias úteis", icon: FileText, electronic: true },
  { key: "cash", label: "Dinheiro", hint: "Você confirma o recebimento", icon: Banknote, electronic: false },
];

interface Props {
  status: GatewayAccountStatus;
  accepted: PaymentMethod[];
  /** PIX exige a conta totalmente aprovada + chave ativa — gating mais estrito que cartão/boleto. */
  pixEnabled: boolean;
}

export function AcceptedMethodsCard({ status, accepted, pixEnabled }: Props) {
  const { token, updateProvider } = useAuth();
  const [methods, setMethods] = useState<Set<PaymentMethod>>(new Set(accepted));
  const [savingKey, setSavingKey] = useState<PaymentMethod | null>(null);

  const isApproved = status === "approved";

  // Cartão/débito liberam com a conta aprovada (comercial); PIX só com pixEnabled (aprovação total + chave).
  const isMethodDisabled = (key: PaymentMethod, electronic: boolean) => {
    if (!electronic) return false;
    if (key === "pix") return !pixEnabled;
    return !isApproved;
  };

  const toggle = async (method: PaymentMethod, electronic: boolean) => {
    if (!token) return;
    if (isMethodDisabled(method, electronic)) return;

    const nextSet = new Set(methods);
    if (nextSet.has(method)) nextSet.delete(method);
    else nextSet.add(method);

    if (nextSet.size === 0) {
      toast.error("Selecione ao menos um método de pagamento");
      return;
    }

    setSavingKey(method);
    try {
      const settings = await paymentService.updateMethods(token, Array.from(nextSet));
      setMethods(new Set(settings.acceptedPaymentMethods));
      updateProvider({ acceptedPaymentMethods: settings.acceptedPaymentMethods });
      toast.success("Métodos atualizados");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível atualizar os métodos"));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Métodos que você aceita</CardTitle>
        <p className="text-sm text-gray-500">Escolha como seus clientes podem pagar</p>
        <p className="text-xs text-gray-400 mt-1">
          Cartão, PIX e boleto são confirmados automaticamente. Dinheiro exige confirmação manual.
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {METHODS.map(({ key, label, hint, icon: Icon, electronic }) => {
          const disabled = isMethodDisabled(key, electronic);
          const disabledHint = key === "pix"
            ? "Disponível após a conta ser totalmente aprovada"
            : "Disponível após aprovação da conta";
          return (
            <div
              key={key}
              className={`flex items-center justify-between rounded-lg p-3 ${disabled ? "opacity-60" : "hover:bg-gray-50"}`}
              title={disabled ? disabledHint : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-gray-600" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${electronic ? "bg-blue-50 text-blue-600 hover:bg-blue-50" : "bg-gray-100 text-gray-500 hover:bg-gray-100"}`}
                    >
                      {electronic ? "Automático" : "Manual"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{disabled ? disabledHint : hint}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {savingKey === key && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                <Switch
                  checked={methods.has(key)}
                  onCheckedChange={() => toggle(key, electronic)}
                  disabled={disabled || savingKey !== null}
                  aria-label={label}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
