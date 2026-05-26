import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Sunrise, Sun, Moon } from "lucide-react";
import type { IPortalAppointment, IPortalEquipment } from "@/services/client";
import type { Shift } from "@/services/enums";
import {
  SHIFT_LABELS,
  DEFAULT_SHIFT_HOURS,
  formatDateBr,
  trimTime,
  compareScheduledShift,
} from "@/lib/shifts";

const STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Agendada", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Concluída", color: "bg-green-100 text-green-700" },
  canceled: { label: "Cancelada", color: "bg-gray-100 text-gray-600" },
  no_show: { label: "Não compareceu", color: "bg-red-100 text-red-600" },
};

const SHIFT_ICONS: Record<Shift, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
};

interface Props {
  appointments: IPortalAppointment[];
  equipments: IPortalEquipment[];
  publicToken: string;
  clientId: string;
}

export function PortalAppointmentsCard({ appointments, equipments, publicToken, clientId }: Props) {
  const equipmentById = new Map(equipments.map(e => [e.id, e]));
  // Mais recente primeiro
  const sorted = [...appointments]
    .filter(a => a.status === "scheduled")
    .sort((a, b) => -compareScheduledShift(a, b));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Visitas ({sorted.length})
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
            const linkedEquipments = a.equipmentIds.map(id => equipmentById.get(id)).filter(Boolean);
            const st = STATUS[a.status] ?? { label: a.status, color: "bg-gray-100 text-gray-600" };
            const ShiftIcon = SHIFT_ICONS[a.shift];
            const hours = DEFAULT_SHIFT_HOURS[a.shift];
            return (
              <div key={a.id} className="border rounded-lg p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{formatDateBr(a.scheduledDate)}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <ShiftIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{SHIFT_LABELS[a.shift]}</span>
                    <span className="text-gray-400">
                      {trimTime(hours.startTime)}–{trimTime(hours.endTime)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {linkedEquipments.length > 0
                      ? linkedEquipments.map(eq => eq!.label || eq!.type || "Equipamento").join(", ")
                      : "Sem equipamento vinculado"}
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
