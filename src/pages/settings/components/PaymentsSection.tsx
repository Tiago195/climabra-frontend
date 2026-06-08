import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/authContext";
import { paymentService, type IPaymentSettings, type IPaymentDocument } from "@/services/payment";
import { PaymentsStatusCard } from "./PaymentsStatusCard";
import { PaymentsDocumentsCard } from "./PaymentsDocumentsCard";
import { ConnectPaymentsWizard } from "./ConnectPaymentsWizard";
import { AcceptedMethodsCard } from "./AcceptedMethodsCard";
import { ChargesCard } from "./ChargesCard";
import { AsaasDisclosure } from "@/components/AsaasDisclosure";

export function PaymentsSection() {
  const { provider, token, updateProvider } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);
  // pixEnabled e documentos não vêm no provider do login — só do sync ao vivo (Fase A/B).
  const [pixEnabled, setPixEnabled] = useState(false);
  const [documents, setDocuments] = useState<IPaymentDocument[]>([]);
  const [syncing, setSyncing] = useState(false);

  const status = provider?.gatewayAccountStatus ?? "none";
  const accepted = provider?.acceptedPaymentMethods ?? [];
  const hasAccount = status !== "none";
  const fullyReady = status === "approved" && pixEnabled;

  // Sincroniza o status real da subconta + pendências documentais. Sem isso, o status do provider
  // fica preso no que o onboarding gravou e o PIX nunca religa sozinho na UI.
  const sync = useCallback(async () => {
    if (!token) return;
    setSyncing(true);
    try {
      const s = await paymentService.getStatus(token);
      updateProvider({
        gatewayAccountStatus: s.gatewayAccountStatus,
        acceptedPaymentMethods: s.acceptedPaymentMethods,
      });
      setPixEnabled(s.pixEnabled);
      // Busca pendências enquanto a conta não está 100% pronta (cartão+boleto+PIX).
      if (s.hasGatewayAccount && !(s.gatewayAccountStatus === "approved" && s.pixEnabled)) {
        setDocuments(await paymentService.getDocuments(token).catch(() => []));
      } else {
        setDocuments([]);
      }
    } catch {
      /* silencioso — mantém o estado atual se a sync falhar */
    } finally {
      setSyncing(false);
    }
  }, [token, updateProvider]);

  useEffect(() => {
    if (!token || status === "none") return;
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleConnected = (settings: IPaymentSettings) => {
    updateProvider({
      gatewayAccountStatus: settings.gatewayAccountStatus,
      acceptedPaymentMethods: settings.acceptedPaymentMethods,
    });
    setPixEnabled(settings.pixEnabled);
    setWizardOpen(false);
    // logo após conectar, busca as pendências de documento p/ o provider concluir o cadastro
    void sync();
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
          <ChargesCard />
          <PaymentsStatusCard status={status} onConfigure={() => setWizardOpen(true)} />
          {hasAccount && status !== "rejected" && !fullyReady && (
            <PaymentsDocumentsCard
              documents={documents}
              pixEnabled={pixEnabled}
              syncing={syncing}
              onRefresh={sync}
            />
          )}
          {status === "approved" && (
            <AcceptedMethodsCard status={status} accepted={accepted} pixEnabled={pixEnabled} />
          )}
          {status !== "approved" && <AsaasDisclosure className="px-1" />}
        </div>
      )}
    </div>
  );
}
