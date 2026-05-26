import { FileText, FilePlus2, CheckCircle2, AirVent } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EQUIPMENT_TYPE_LABELS,
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  canConclude,
  equipmentById,
  reportForEquipment,
  type MockAppointment,
} from "./_shared";

/** Lista de equipamentos da visita com botão de laudo individual + botão Concluir global. */
export function EquipmentReportActions({ appt, compact = false }: { appt: MockAppointment; compact?: boolean }) {
  const eqs = appt.equipmentIds.map(equipmentById);
  const can = canConclude(appt);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {eqs.map(eq => {
          const r = reportForEquipment(appt, eq.id);
          const has = !!r;
          return (
            <div key={eq.id} className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1.5">
              <AirVent className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-800 truncate">{eq.label}</p>
                {!compact && (
                  <p className="text-[10px] text-gray-400 truncate">{EQUIPMENT_TYPE_LABELS[eq.type]} · {eq.brand}</p>
                )}
              </div>
              {has && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${REPORT_STATUS_COLORS[r!.status]}`}>
                  {REPORT_STATUS_LABELS[r!.status]}
                </span>
              )}
              <Button
                size="sm"
                variant={has ? "outline" : "default"}
                className={`h-7 text-[11px] gap-1 px-2 ${has ? "" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {has ? <><FileText className="w-3 h-3" /> Ver laudo</> : <><FilePlus2 className="w-3 h-3" /> Criar laudo</>}
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        disabled={!can}
        size="sm"
        className={`w-full h-8 gap-1.5 ${can ? "bg-green-600 hover:bg-green-700" : ""}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Concluir visita
        {!can && <span className="text-[10px] font-normal opacity-80">(faltam laudos)</span>}
      </Button>
    </div>
  );
}
