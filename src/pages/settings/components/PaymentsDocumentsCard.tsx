import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, RefreshCw, Loader2, ShieldCheck } from "lucide-react";
import type { IPaymentDocument } from "@/services/payment";

interface Props {
  documents: IPaymentDocument[];
  pixEnabled: boolean;
  syncing: boolean;
  onRefresh: () => void;
}

/** Rótulos amigáveis p/ os tipos de documento da Asaas (o resto cai no título ou no próprio tipo). */
const TYPE_LABEL: Record<string, string> = {
  IDENTIFICATION: "Documento de identificação",
  IDENTIFICATION_SELFIE: "Selfie de identificação",
  SOCIAL_CONTRACT: "Contrato social",
  MEI_CERTIFICATE: "Certificado MEI",
  CUSTOM: "Documento adicional",
};

function docLabel(d: IPaymentDocument): string {
  return d.title || TYPE_LABEL[d.type] || d.type;
}

export function PaymentsDocumentsCard({ documents, pixEnabled, syncing, onRefresh }: Props) {
  const hasPendencies = documents.length > 0;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="py-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-blue-900">
              {pixEnabled ? "Cadastro em dia" : "Conclua o cadastro para liberar o PIX"}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              Cartão e boleto já funcionam. Para receber por <span className="font-medium">PIX</span> sua
              conta precisa estar totalmente aprovada — finalize os itens abaixo pela instituição parceira.
            </p>
          </div>
        </div>

        {hasPendencies ? (
          <ul className="space-y-2">
            {documents.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white border border-blue-100 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{docLabel(d)}</p>
                    <p className="text-xs text-gray-500">
                      {d.onboardingUrl ? "Precisa do seu envio" : "Em análise pela instituição"}
                    </p>
                  </div>
                </div>
                {d.onboardingUrl ? (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    onClick={() => window.open(d.onboardingUrl as string, "_blank", "noopener,noreferrer")}
                  >
                    Concluir cadastro
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs shrink-0">
                    Em análise
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-blue-800 bg-white border border-blue-100 rounded-lg px-4 py-3">
            Não há pendências no momento — sua conta ainda está em análise. Toque em{" "}
            <span className="font-medium">Atualizar status</span> para verificar novamente.
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={onRefresh}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1.5" />
            )}
            Atualizar status
          </Button>
          <span className="text-xs text-gray-500">Já enviou? Atualize para liberar o PIX.</span>
        </div>
      </CardContent>
    </Card>
  );
}
