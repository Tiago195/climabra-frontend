import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import type { IPortalAppointment, IPortalEquipment } from "@/services/client";

const STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Agendada", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Concluída", color: "bg-green-100 text-green-700" },
  canceled: { label: "Cancelada", color: "bg-gray-100 text-gray-600" },
  no_show: { label: "Não compareceu", color: "bg-red-100 text-red-600" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

interface Props {
  appointments: IPortalAppointment[];
  equipments: IPortalEquipment[];
  publicToken: string;
  clientId: string;
}

export function PortalAppointmentsCard({ appointments, equipments, publicToken, clientId }: Props) {
  const equipmentById = new Map(equipments.map(e => [e.id, e]));
  const sorted = [...appointments].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Visitas ({appointments.length})
        </CardTitle>
        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1">
          <Link to={`/providers/${publicToken}/clients/${clientId}/request`}>
            <Plus className="w-3.5 h-3.5" /> Nova visita
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-3">Nenhuma visita registrada.</p>
        ) : (
          sorted.map(a => {
            const eq = a.equipmentId ? equipmentById.get(a.equipmentId) : null;
            const st = STATUS[a.status] ?? { label: a.status, color: "bg-gray-100 text-gray-600" };
            return (
              <div key={a.id} className="border rounded-lg p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{fmt(a.scheduledAt)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {eq ? eq.label || eq.type || "Equipamento" : "Sem ar-condicionado vinculado"}
                  </p>
                  {a.notes && <p className="text-xs text-gray-400 mt-1">{a.notes}</p>}
                </div>
                <Badge className={`text-xs ${st.color}`}>{st.label}</Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
