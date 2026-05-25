import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Wind, Plus, FileText } from "lucide-react";
import type { IPortalEquipment, IPortalAppointment, IPortalReport } from "@/services/client";
import { AddEquipmentDialog } from "./AddEquipmentDialog";
import { PortalReportsDialog } from "./PortalReportsDialog";

interface Props {
  equipments: IPortalEquipment[];
  appointments: IPortalAppointment[];
  reports: IPortalReport[];
  publicToken: string;
  clientId: string;
  onEquipmentAdded: (equipment: IPortalEquipment) => void;
}

export function PortalEquipmentsCard({ equipments, appointments, reports, publicToken, clientId, onEquipmentAdded }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wind className="w-4 h-4" /> Meus equipamentos ({equipments.length})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {equipments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-3">Nenhum equipamento cadastrado.</p>
          ) : (
            equipments.map(eq => {
              const eqReports = reports.filter(r => r.equipmentId === eq.id);
              const eqAppts = appointments.filter(a => a.equipmentIds.includes(eq.id));
              const pendingCount = eqReports.filter(r => r.status === "sent").length;
              const eqLabel = eq.label || eq.type || "Equipamento";
              const eqSub = [eq.brand, eq.model].filter(Boolean).join(" · ");
              return (
                <div key={eq.id} className="border rounded-lg p-3 bg-white flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{eqLabel}</p>
                    {eqSub && <p className="text-xs text-gray-500 mt-0.5">{eqSub}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {eqAppts.length} visita(s) · {eqReports.length} laudo(s)
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className={`relative shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          pendingCount > 0
                            ? "border-yellow-300 bg-yellow-50 text-yellow-900 hover:bg-yellow-100"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                        aria-label={`Ver laudos de ${eqLabel}`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Laudos
                        {pendingCount > 0 && (
                          <span className="ml-0.5 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-yellow-500 text-white text-[10px] font-bold">
                            {pendingCount}
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
                          </span>
                        )}
                      </button>
                    </DialogTrigger>
                    <PortalReportsDialog equipment={eq} reports={eqReports} />
                  </Dialog>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <AddEquipmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        publicToken={publicToken}
        clientId={clientId}
        onAdded={onEquipmentAdded}
      />
    </>
  );
}
