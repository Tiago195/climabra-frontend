import { useState } from "react";
import { Link } from "react-router-dom";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, AlertCircle, ChevronDown } from "lucide-react";
import type { IPortalEquipment, IPortalReport } from "@/services/client";

const REPORT_STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: "Rascunho", color: "bg-gray-100 text-gray-600" },
  sent:      { label: "Aguardando aprovação", color: "bg-yellow-100 text-yellow-800" },
  approved:  { label: "Aprovado", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Finalizado", color: "bg-green-100 text-green-700" },
};

const VISIBLE_STATUSES = new Set(["sent", "approved", "completed"]);

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function ReportRow({ r, accent = false }: { r: IPortalReport; accent?: boolean }) {
  const st = REPORT_STATUS[r.status] ?? { label: r.status, color: "bg-gray-100 text-gray-600" };
  const visible = VISIBLE_STATUSES.has(r.status);
  return (
    <div className={`border rounded-lg p-3 ${accent ? "border-yellow-300 bg-yellow-50/60" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{r.title || "Laudo"}</p>
          <p className="text-xs text-gray-500 mt-0.5">{fmt(r.createdAt)}</p>
        </div>
        <Badge className={`text-xs ${st.color} shrink-0`}>{st.label}</Badge>
      </div>
      <div className="flex items-center justify-end mt-2.5">
        {visible && r.publicToken && (
          <Button
            asChild
            size="sm"
            variant={accent ? "default" : "ghost"}
            className={accent ? "h-7 text-xs" : "h-7 text-xs text-blue-600 hover:text-blue-700"}
          >
            <Link to={`equipment/${r.equipmentId}/laudo/${r.publicToken}`}>
              {accent ? "Ver e aprovar" : "Abrir laudo"}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

interface Props {
  equipment: IPortalEquipment;
  reports: IPortalReport[];
}

export function PortalReportsDialog({ equipment, reports }: Props) {
  const [showAll, setShowAll] = useState(false);

  const pending = reports.filter(r => r.status === "sent");
  const history = reports
    .filter(r => r.status !== "sent")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const visibleHistory = showAll ? history : history.slice(0, 3);
  const hiddenCount = history.length - visibleHistory.length;

  const eqLabel = equipment.label || equipment.type || "Equipamento";
  const eqSub = [equipment.brand, equipment.model].filter(Boolean).join(" · ");

  return (
    <DialogContent className="max-w-md p-0 gap-0 max-h-[85vh] flex flex-col">
      <DialogHeader className="px-5 pt-5 pb-3 border-b">
        <DialogTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" /> Laudos · {eqLabel}
        </DialogTitle>
        {eqSub && <p className="text-xs text-gray-500">{eqSub}</p>}
      </DialogHeader>

      <div className="overflow-y-auto px-5 py-4 space-y-5">
        {pending.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <h3 className="text-sm font-semibold text-yellow-900">
                Aguardando sua aprovação ({pending.length})
              </h3>
            </div>
            <p className="text-[11px] text-gray-500 mb-2.5">
              Revise o orçamento e libere o serviço.
            </p>
            <div className="space-y-2">
              {pending.map(r => <ReportRow key={r.id} r={r} accent />)}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold text-gray-800 mb-2.5">
            Histórico ({history.length})
          </h3>
          {history.length === 0 && pending.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum laudo emitido ainda.
            </p>
          ) : history.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3">
              Sem laudos anteriores.
            </p>
          ) : (
            <div className="space-y-2">
              {visibleHistory.map(r => <ReportRow key={r.id} r={r} />)}
              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-2 flex items-center justify-center gap-1"
                >
                  Ver mais {hiddenCount} laudo(s) <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </DialogContent>
  );
}
