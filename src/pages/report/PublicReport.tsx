import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data?.report.status === "sent") {
      setSelectedIds(new Set(data.items.map(i => i.id)));
    }
  }, [data]);

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
      setData(await reportService.approve(providerToken, clientId, equipmentId, reportToken, Array.from(selectedIds)));
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
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {isCompleted ? "Serviços executados" : "Serviços a executar"}
              </CardTitle>
              {isSent && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {selectedIds.size}/{items.length} selecionado{selectedIds.size !== 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline underline-offset-2"
                    onClick={() =>
                      setSelectedIds(
                        selectedIds.size === items.length
                          ? new Set()
                          : new Set(items.map(i => i.id))
                      )
                    }
                  >
                    {selectedIds.size === items.length ? "Desmarcar todos" : "Marcar todos"}
                  </button>
                </div>
              )}
            </div>
            {isSent && (
              <p className="text-xs text-gray-500 mt-1">
                Desmarque os serviços que não deseja autorizar.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {items.map((item, idx) => {
              const isSelected = selectedIds.has(item.id);
              const isDeselected = isSent && !isSelected;
              return (
                <label
                  key={idx}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-all cursor-default ${
                    item.rejected
                      ? "border-gray-200 bg-gray-50"
                      : isDeselected
                        ? "border-dashed border-gray-200 bg-gray-50"
                        : isSent
                          ? "border-blue-200 bg-blue-50 cursor-pointer"
                          : "border-gray-100 bg-white"
                  }`}
                >
                  {isSent && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(item.id) : next.delete(item.id);
                          return next;
                        });
                      }}
                      className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-bold mt-0.5 shrink-0 ${isDeselected || item.rejected ? "text-gray-300" : "text-blue-400"}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <p className={`text-sm font-medium leading-snug ${
                          item.rejected ? "line-through text-gray-400" : isDeselected ? "text-gray-400" : "text-gray-800"
                        }`}>
                          {item.description}
                        </p>
                      </div>
                      {item.rejected && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0 font-medium">
                          Não autorizado
                        </span>
                      )}
                      {!item.rejected && item.photoBefore && item.photoAfter && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Concluído
                        </span>
                      )}
                    </div>

                  {!item.rejected && (item.photoBefore || item.photoAfter) && (
                    <div className="grid grid-cols-2 gap-2">
                      {item.photoBefore && (
                        <figure>
                          <img src={item.photoBefore} alt="Antes" className="w-full aspect-video object-cover rounded-lg" />
                          <figcaption className="text-xs text-center text-gray-400 mt-1">Antes</figcaption>
                        </figure>
                      )}
                      {item.photoAfter && (
                        <figure>
                          <img src={item.photoAfter} alt="Depois" className="w-full aspect-video object-cover rounded-lg" />
                          <figcaption className="text-xs text-center text-gray-400 mt-1">Depois</figcaption>
                        </figure>
                      )}
                    </div>
                  )}
                  {item.notes && !item.rejected && (
                    <p className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">{item.notes}</p>
                  )}
                </div>
                </label>
              );
            })}
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
                  onClick={() => setConfirmOpen(true)}
                  disabled={selectedIds.size === 0}>
                  {selectedIds.size === 0 ? "Selecione ao menos um serviço" : "Autorizar serviço"}
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
