import { useState } from "react";
import { FileText, FilePlus2, CheckCircle2, AirVent, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  EQUIPMENT_TYPE_LABELS,
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  canConclude,
  equipmentById,
  reportForEquipment,
  type MockAppointment,
  type MockReport,
  type ReportStatus,
} from "./_shared";

interface LocalReport {
  equipmentId: string;
  status: ReportStatus;
  exists: boolean;
}

const NEXT: Record<ReportStatus, ReportStatus | null> = {
  draft: "sent",
  sent: "approved",
  approved: "completed",
  completed: null,
};

const NEXT_LABEL: Record<ReportStatus, string> = {
  draft: "Enviar para aprovação",
  sent: "Marcar como aprovado",
  approved: "Marcar como concluído",
  completed: "Concluído",
};

/** Lista de equipamentos da visita com botão de laudo individual + botão Concluir global. */
export function EquipmentReportActions({ appt, compact = false }: { appt: MockAppointment; compact?: boolean }) {
  const eqs = appt.equipmentIds.map(equipmentById);

  // estado local mutável para demonstrar a interação
  const [reports, setReports] = useState<LocalReport[]>(() =>
    appt.equipmentIds.map(eqId => {
      const r = reportForEquipment(appt, eqId);
      return r ? { equipmentId: eqId, status: r.status, exists: true } : { equipmentId: eqId, status: "draft", exists: false };
    })
  );
  const [concluded, setConcluded] = useState(false);
  const [openEq, setOpenEq] = useState<string | null>(null);

  const reportFor = (eqId: string) => reports.find(r => r.equipmentId === eqId)!;
  const canFinish = !concluded && reports.every(r => r.exists && r.status === "completed")
    || (!concluded && canConclude(appt) && reports.every(r => r.exists));

  function createReport(eqId: string) {
    setReports(prev => prev.map(r => r.equipmentId === eqId ? { ...r, exists: true, status: "draft" } : r));
    setOpenEq(eqId);
  }

  function advanceStatus(eqId: string) {
    setReports(prev => prev.map(r => {
      if (r.equipmentId !== eqId || !r.exists) return r;
      const nxt = NEXT[r.status];
      return nxt ? { ...r, status: nxt } : r;
    }));
  }

  const openReport = openEq ? reportFor(openEq) : null;
  const openEqLabel = openEq ? equipmentById(openEq).label : "";

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {eqs.map(eq => {
          const r = reportFor(eq.id);
          return (
            <div key={eq.id} className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1.5">
              <AirVent className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-800 truncate">{eq.label}</p>
                {!compact && (
                  <p className="text-[10px] text-gray-400 truncate">{EQUIPMENT_TYPE_LABELS[eq.type]} · {eq.brand}</p>
                )}
              </div>
              {r.exists && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${REPORT_STATUS_COLORS[r.status]}`}>
                  {REPORT_STATUS_LABELS[r.status]}
                </span>
              )}
              {r.exists ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenEq(eq.id)}
                  className="h-7 text-[11px] gap-1 px-2"
                >
                  <FileText className="w-3 h-3" /> Ver laudo
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => createReport(eq.id)}
                  className="h-7 text-[11px] gap-1 px-2 bg-blue-600 hover:bg-blue-700"
                >
                  <FilePlus2 className="w-3 h-3" /> Criar laudo
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Button
        disabled={!canFinish}
        onClick={() => setConcluded(true)}
        size="sm"
        className={`w-full h-8 gap-1.5 ${canFinish ? "bg-green-600 hover:bg-green-700" : ""}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {concluded ? "Visita concluída" : "Concluir visita"}
        {!canFinish && !concluded && (
          <span className="text-[10px] font-normal opacity-80">(faltam laudos)</span>
        )}
      </Button>

      <Dialog open={!!openEq} onOpenChange={(o) => !o && setOpenEq(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Laudo do equipamento
            </DialogTitle>
            <DialogDescription>{openEqLabel}</DialogDescription>
          </DialogHeader>
          {openReport && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status atual:</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${REPORT_STATUS_COLORS[openReport.status]}`}>
                  {REPORT_STATUS_LABELS[openReport.status]}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Diagnóstico</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                  Verificação completa do sistema. Limpeza de filtros e checagem de gás refrigerante realizadas.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-1" onClick={() => setOpenEq(null)}>
                  <X className="w-3 h-3" /> Fechar
                </Button>
                {NEXT[openReport.status] && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => advanceStatus(openReport.equipmentId)}
                  >
                    {NEXT_LABEL[openReport.status]}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type { MockReport };
