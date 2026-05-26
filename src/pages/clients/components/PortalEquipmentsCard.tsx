import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AirVent, FileText, Plus } from "lucide-react";
import type { IPortalEquipment, IPortalReport } from "@/services/client";
import { EQUIPMENT_TYPE_LABELS } from "@/lib/equipment";
import { AddEquipmentDialog } from "./AddEquipmentDialog";
import { PortalReportsDialog } from "./PortalReportsDialog";

interface Props {
  equipments: IPortalEquipment[];
  reports: IPortalReport[];
  publicToken: string;
  clientId: string;
  onEquipmentAdded: (equipment: IPortalEquipment) => void;
}

/**
 * Grid compacto 2×N de equipamentos do cliente, adaptado do canvas
 * Portal A - Calendário. Cada card abre o dialog de laudos do equipamento.
 */
export function PortalEquipmentsCard({
  equipments,
  reports,
  publicToken,
  clientId,
  onEquipmentAdded,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Meus equipamentos
          </p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="text-[11px] text-blue-600 font-medium flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>

        {equipments.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-xs text-gray-400">
              Nenhum equipamento cadastrado ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {equipments.map(eq => {
              const eqReports = reports.filter(r => r.equipmentId === eq.id);
              const pendingCount = eqReports.filter(r => r.status === "sent").length;
              const eqLabel = eq.label || EQUIPMENT_TYPE_LABELS[eq.type] || "Equipamento";
              const subtitle = [EQUIPMENT_TYPE_LABELS[eq.type], eq.brand]
                .filter(Boolean)
                .join(" · ");

              return (
                <Dialog key={eq.id}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-left w-full"
                      aria-label={`Abrir laudos de ${eqLabel}`}
                    >
                      <Card className="hover:border-blue-300 transition-colors">
                        <CardContent className="py-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                              <AirVent className="w-4 h-4" />
                            </div>
                            <div className="relative">
                              <FileText
                                className={`w-3.5 h-3.5 ${pendingCount > 0 ? "text-yellow-500" : "text-gray-300"}`}
                              />
                              {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-3.5 h-3.5 px-0.5 rounded-full bg-yellow-500 text-white text-[8px] font-bold leading-none">
                                  {pendingCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800 truncate">{eqLabel}</p>
                            {subtitle && (
                              <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  </DialogTrigger>
                  <PortalReportsDialog equipment={eq} reports={eqReports} />
                </Dialog>
              );
            })}
          </div>
        )}
      </div>

      <AddEquipmentDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        publicToken={publicToken}
        clientId={clientId}
        onAdded={onEquipmentAdded}
      />
    </>
  );
}
