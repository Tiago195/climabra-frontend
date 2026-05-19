import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind } from "lucide-react";
import type { IPortalEquipment, IPortalAppointment, IPortalReport } from "@/services/client";

interface Props {
  equipments: IPortalEquipment[];
  appointments: IPortalAppointment[];
  reports: IPortalReport[];
}

export function PortalEquipmentsCard({ equipments, appointments, reports }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wind className="w-4 h-4" /> Meus ar-condicionados ({equipments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {equipments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-3">Nenhum equipamento cadastrado.</p>
        ) : (
          equipments.map(eq => {
            const eqReports = reports.filter(r => r.equipmentId === eq.id);
            const eqAppts = appointments.filter(a => a.equipmentId === eq.id);
            return (
              <div key={eq.id} className="border rounded-lg p-3 bg-gray-50">
                <p className="font-medium text-sm">{eq.label || eq.type || "Equipamento"}</p>
                {(eq.brand || eq.model) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[eq.brand, eq.model].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {eqAppts.length} visita(s) · {eqReports.length} laudo(s)
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
