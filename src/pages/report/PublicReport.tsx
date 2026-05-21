import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { reportService, type IPublicReportResponse } from "@/services/report";
import { CheckCircle2, ShieldCheck, Loader2, FileText } from "lucide-react";

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  split: "Split", janela: "Janela", central: "Central",
  cassete: "Cassete", piso_teto: "Piso-teto", portatil: "Portátil",
};

export function PublicReport() {
  const { providerToken, clientId, equipmentId, reportToken } = useParams<{
    providerToken: string; clientId: string; equipmentId: string; reportToken: string;
  }>();

  const [data, setData] = useState<IPublicReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!providerToken || !clientId || !equipmentId || !reportToken) return;
    try {
      setData(await reportService.getPublic(providerToken, clientId, equipmentId, reportToken));
    } catch {
      // silencia erros de polling
    }
  }, [providerToken, clientId, equipmentId, reportToken]);

  useEffect(() => {
    if (!providerToken || !clientId || !equipmentId || !reportToken) return;
    reportService.getPublic(providerToken, clientId, equipmentId, reportToken)
      .then(setData)
      .catch(() => toast.error("Laudo não encontrado"))
      .finally(() => setLoading(false));
  }, [providerToken, clientId, equipmentId, reportToken]);

  // Polling enquanto o status ainda pode mudar
  useEffect(() => {
    if (!data) return;
    const { status } = data.report;
    if (status !== "sent" && status !== "approved") return;

    const interval = setInterval(fetchReport, 10000);
    return () => clearInterval(interval);
  }, [data, fetchReport]);

  const handleApprove = async () => {
    if (!providerToken || !clientId || !equipmentId || !reportToken) return;
    setApproving(true);
    try {
      setData(await reportService.approve(providerToken, clientId, equipmentId, reportToken));
      toast.success("Serviço autorizado!");
      setConfirmOpen(false);
    } catch {
      toast.error("Erro ao autorizar. Tente novamente.");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">
        Laudo não encontrado.
      </div>
    );
  }

  const { report, items, equipment, client, provider } = data;
  const isSent = report.status === "sent";
  const isApproved = report.status === "approved";
  const isCompleted = report.status === "completed";
  const equipLabel = equipment?.label
    || (equipment?.type ? EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type : null)
    || "—";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4 pb-8">

        <div className="text-center py-4">
          <FileText className="w-10 h-10 mx-auto text-blue-600 mb-2" />
          <h1 className="text-2xl font-bold">
            {isCompleted ? "Laudo de Serviço" : "Pré-laudo de Serviço"}
          </h1>
          <p className="text-sm text-gray-500">
            {provider.companyName ?? provider.name}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Equipamento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><span className="text-gray-500">Cliente:</span> {client.name}</p>
            <p><span className="text-gray-500">Equipamento:</span> {equipLabel}</p>
            {equipment?.brand && (
              <p>
                <span className="text-gray-500">Marca/modelo:</span>{" "}
                {equipment.brand} {equipment.model}
              </p>
            )}
          </CardContent>
        </Card>

        {report.diagnosis && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{report.diagnosis}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {isCompleted ? "Serviços executados" : "Serviços a executar"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-500">{idx + 1}.</span>
                  <p className="text-sm flex-1">{item.description}</p>
                  {item.photoBefore && item.photoAfter && (
                    <Badge className="bg-green-100 text-green-800 shrink-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Concluído
                    </Badge>
                  )}
                </div>
                {(item.photoBefore || item.photoAfter) && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {item.photoBefore && (
                      <figure>
                        <img src={item.photoBefore} alt="Antes" className="w-full aspect-video object-cover rounded" />
                        <figcaption className="text-xs text-center text-gray-500 mt-1">Antes</figcaption>
                      </figure>
                    )}
                    {item.photoAfter && (
                      <figure>
                        <img src={item.photoAfter} alt="Depois" className="w-full aspect-video object-cover rounded" />
                        <figcaption className="text-xs text-center text-gray-500 mt-1">Depois</figcaption>
                      </figure>
                    )}
                  </div>
                )}
                {item.notes && (
                  <p className="text-xs text-gray-600 mt-2 italic">{item.notes}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {isSent && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Ao autorizar, você concorda que o prestador realize os serviços listados acima no equipamento informado.
                </p>
              </div>
              {!confirmOpen ? (
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg"
                  onClick={() => setConfirmOpen(true)}>
                  Autorizar serviço
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Confirma a autorização?</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1"
                      onClick={() => setConfirmOpen(false)}>
                      Cancelar
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleApprove} disabled={approving}>
                      {approving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Sim, autorizo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isApproved && (
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="py-4 text-sm text-purple-900 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              Serviço em execução. Esta página será atualizada com fotos conforme o prestador avança.
            </CardContent>
          </Card>
        )}

        {isCompleted && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4 text-sm text-green-900 space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5" /> Laudo concluído
              </div>
              {report.completedAt && (
                <p className="text-xs">
                  Finalizado em {new Date(report.completedAt).toLocaleString("pt-BR")}.
                </p>
              )}
              {report.finalNotes && (
                <p className="whitespace-pre-wrap text-sm">{report.finalNotes}</p>
              )}
              <p className="text-xs">
                Em caso de dúvidas, contate {provider.name}
                {provider.phone ? ` · ${provider.phone}` : ""}.
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
