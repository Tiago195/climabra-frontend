import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, CreditCard, XCircle, Check, Link2, BadgePercent } from "lucide-react";
import type { GatewayAccountStatus } from "@/services/enums";
import { useAuth } from "@/contexts/authContext";
import { formatDocument, formatLongDate } from "./format";

interface Props {
  status: GatewayAccountStatus;
  onConfigure: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

export function PaymentsStatusCard({ status, onConfigure }: Props) {
  const { provider } = useAuth();
  const titular = provider?.companyName || provider?.name || "—";
  const documento = formatDocument(provider?.cpfCnpj);

  if (status === "pending") {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-amber-900">Conta em análise</p>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Em análise</Badge>
              </div>
              <p className="text-sm text-amber-800 mt-1">
                Recebemos seus dados e estamos verificando tudo. Isso costuma levar até{" "}
                <span className="font-medium">1 dia útil</span>. Avisaremos por e-mail e aqui no
                painel assim que sua conta estiver pronta.
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-white border border-amber-100 px-4 py-2">
            <DetailRow label="Titular" value={titular} />
            <DetailRow label="Documento" value={documento} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "approved") {
    return (
      <Card className="border-green-200 bg-green-50/60">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-green-900">Conta de recebimento ativa</p>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Ativa</Badge>
              </div>
              <p className="text-sm text-green-800 mt-1">
                Tudo certo! Você já pode cobrar pelos laudos. Os métodos que você aceita ficam logo abaixo.
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-white border border-green-100 px-4 py-2">
            <DetailRow label="Titular" value={titular} />
            <DetailRow label="Documento" value={documento} />
            <DetailRow label="Ativa desde" value={formatLongDate(provider?.updatedAt)} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "rejected") {
    return (
      <Card className="border-red-200 bg-red-50/60">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-red-900">Não foi possível ativar sua conta</p>
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Recusada</Badge>
              </div>
              <p className="text-sm text-red-800 mt-1">
                Não conseguimos validar alguns dados enviados. Confira as informações e tente de novo —
                normalmente é algo simples, como um documento que não confere.
              </p>
            </div>
          </div>
          <p className="text-xs text-red-700 bg-white border border-red-100 rounded-lg px-4 py-2">
            Motivo: os dados do titular não puderam ser confirmados junto à instituição parceira.
          </p>
          <div className="flex items-center gap-3">
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfigure}>
              Revisar dados
            </Button>
            <span className="text-xs text-gray-500">Precisa de ajuda? Fale com o suporte</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // none
  const benefits = [
    { icon: BadgePercent, text: "PIX e cartão confirmados automaticamente" },
    { icon: Link2, text: "Cliente paga pelo link do laudo" },
    { icon: Check, text: "Sem mensalidade — você só paga quando recebe" },
  ];
  return (
    <Card>
      <CardContent className="py-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">Receba pagamentos pelos seus laudos</p>
            <p className="text-sm text-gray-500 mt-1">
              Conecte uma conta de recebimento e cobre seus clientes por PIX, cartão e boleto direto
              no laudo. O valor cai na sua conta sem complicação.
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {benefits.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-blue-600" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={onConfigure}>
            Configurar recebimentos
          </Button>
          <span className="text-xs text-gray-500">Leva uns 3 minutos</span>
        </div>
      </CardContent>
    </Card>
  );
}
