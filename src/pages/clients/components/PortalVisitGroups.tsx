import { Clock, CheckCircle2, XCircle } from "lucide-react";
import type { IPortalAppointment, IPortalEquipment, IPortalReport } from "@/services/client";
import { PortalVisitCard } from "./PortalVisitCard";
import { compareScheduledShift } from "@/lib/shifts";

interface Props {
  appointments: IPortalAppointment[];
  equipments: IPortalEquipment[];
  reports: IPortalReport[];
  basePath: string;
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Agrupa as visitas do portal em três blocos: Agendadas (futuras),
 * Concluídas (passadas) e Canceladas. Adaptação do canvas Portal A - Calendário.
 */
export function PortalVisitGroups({ appointments, equipments, reports, basePath }: Props) {
  const today = todayISO();

  const upcoming = appointments
    .filter(a => a.status === "scheduled" && a.scheduledDate >= today)
    .sort((a, b) => compareScheduledShift(a, b));
  const completed = appointments
    .filter(a => a.status === "completed")
    .sort((a, b) => -compareScheduledShift(a, b));
  const canceled = appointments
    .filter(a => a.status === "canceled")
    .sort((a, b) => -compareScheduledShift(a, b));

  if (upcoming.length === 0 && completed.length === 0 && canceled.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide px-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Agendadas ({upcoming.length})
          </p>
          {upcoming.map(a => (
            <PortalVisitCard
              key={a.id}
              appointment={a}
              equipments={equipments}
              reports={reports}
              tone="future"
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide px-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Concluídas ({completed.length})
          </p>
          {completed.map(a => (
            <PortalVisitCard
              key={a.id}
              appointment={a}
              equipments={equipments}
              reports={reports}
              tone="past"
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {canceled.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Canceladas ({canceled.length})
          </p>
          {canceled.map(a => (
            <PortalVisitCard
              key={a.id}
              appointment={a}
              equipments={equipments}
              reports={reports}
              tone="canceled"
              basePath={basePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}
