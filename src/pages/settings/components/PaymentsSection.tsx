import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/authContext";
import { paymentService, type IPaymentSettings } from "@/services/payment";
import { PaymentsStatusCard } from "./PaymentsStatusCard";
import { ConnectPaymentsWizard } from "./ConnectPaymentsWizard";
import { AcceptedMethodsCard } from "./AcceptedMethodsCard";
import { AsaasDisclosure } from "@/components/AsaasDisclosure";

export function PaymentsSection() {
  const { provider, token, updateProvider } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);

  const status = provider?.gatewayAccountStatus ?? "none";
  const accepted = provider?.acceptedPaymentMethods ?? [];

  // Sincroniza o status real da subconta na Asaas ao abrir os Pagamentos (Fase A):
  // sem isso, o gatewayAccountStatus de um provider real fica preso no que o onboarding gravou.
  useEffect(() => {
    if (!token || status === "none") return;
    paymentService.getStatus(token)
      .then(s => updateProvider({
        gatewayAccountStatus: s.gatewayAccountStatus,
        acceptedPaymentMethods: s.acceptedPaymentMethods,
      }))
      .catch(() => { /* silencioso — mantém o status atual se a sync falhar */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleConnected = (settings: IPaymentSettings) => {
    updateProvider({
      gatewayAccountStatus: settings.gatewayAccountStatus,
      acceptedPaymentMethods: settings.acceptedPaymentMethods,
    });
    setWizardOpen(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          {wizardOpen ? "Configurar recebimentos" : "Pagamentos"}
        </h2>
        <p className="text-sm text-gray-500">
          {wizardOpen
            ? "Leva uns 3 minutos. Seus dados vão para análise da instituição parceira."
            : "Receba dos seus clientes direto pelos laudos, sem sair do app."}
        </p>
      </div>

      {wizardOpen ? (
        <Card>
          <CardContent className="py-6">
            <ConnectPaymentsWizard onConnected={handleConnected} onCancel={() => setWizardOpen(false)} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <PaymentsStatusCard status={status} onConfigure={() => setWizardOpen(true)} />
          {status === "approved" && <AcceptedMethodsCard status={status} accepted={accepted} />}
          {status !== "approved" && <AsaasDisclosure className="px-1" />}
        </div>
      )}
    </div>
  );
}
