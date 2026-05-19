import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind } from "lucide-react";
import EquipmentReports from "@/components/EquipmentReports";
import { type IEquipmentResponse } from "@/services/client";

interface Props {
  equipments: IEquipmentResponse[];
}

export function ClientEquipmentsCard({ equipments }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wind className="w-4 h-4" /> Equipamentos ({equipments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {equipments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum equipamento cadastrado ainda.
          </p>
        ) : (
          equipments.map((eq) => (
            <div key={eq.id} className="border rounded-lg p-3 space-y-3 bg-gray-50">
              <div>
                <p className="font-medium text-sm">
                  {eq.label || eq.type || "Equipamento"}
                </p>
                {(eq.brand || eq.model) && (
                  <p className="text-xs text-gray-500">
                    {[eq.brand, eq.model].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <EquipmentReports equipment={eq} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
