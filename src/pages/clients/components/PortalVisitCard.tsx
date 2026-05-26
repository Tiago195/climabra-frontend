import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { AirVent, FileText } from "lucide-react";
import type { IPortalAppointment, IPortalEquipment, IPortalReport } from "@/services/client";
import type { ReportStatus } from "@/services/enums";
import { ShiftBadge } from "@/components/ShiftBadge";
import { SHIFT_LABELS, DAY_NAMES_SHORT, MONTH_NAMES_SHORT } from "@/lib/shifts";
import { EQUIPMENT_TYPE_LABELS } from "@/lib/equipment";

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Rascunho",
  sent: "Aguardando aprovação",
  approved: "Aprovado",
  completed: "Concluído",
};

const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-yellow-100 text-yellow-800",
  approved: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-700",
};

const PUBLIC_REPORT_STATUSES = new Set<ReportStatus>(["sent", "approved", "completed"]);

interface Props {
  appointment: IPortalAppointment;
  equipments: IPortalEquipment[];
  reports: IPortalReport[];
  tone: "future" | "past" | "canceled";
  /** Caminho relativo do portal — usado pra abrir o laudo público. */
  basePath: string;
}

/**
 * Card de visita do portal do cliente (canvas Portal A - Calendário).
 * `tone` controla cor do bloco da data e opacidade do card.
 */
export function PortalVisitCard({ appointment, equipments, reports, tone, basePath }: Props) {
  const d = new Date(`${appointment.scheduledDate}T00:00:00`);
  const equipmentById = new Map(equipments.map(e => [e.id, e]));
  const appointmentEqs = appointment.equipmentIds
    .map(id => equipmentById.get(id))
    .filter((e): e is IPortalEquipment => !!e);

  const dateBg =
    tone === "future" ? "bg-blue-50 text-blue-700"
      : tone === "past" ? "bg-green-50 text-green-700"
      : "bg-gray-100 text-gray-500";

  // Pega o report mais recente do equipamento. A API ainda não expõe
  // appointmentId no IPortalReport, então usamos o mais recente como aproximação.
  function reportFor(equipmentId: string): IPortalReport | undefined {
    const list = reports
      .filter(r => r.equipmentId === equipmentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list[0];
  }

  return (
    <Card className={tone === "canceled" ? "opacity-70" : ""}>
      <CardContent className="py-3 space-y-2">
        <div className="flex gap-3">
          <div className={`flex flex-col items-center justify-center rounded-lg w-12 py-1 shrink-0 ${dateBg}`}>
            <span className="text-[9px] uppercase font-bold opacity-70">{DAY_NAMES_SHORT[d.getDay()]}</span>
            <span className="text-lg font-bold leading-none">{d.getDate()}</span>
            <span className="text-[9px] opacity-70">{MONTH_NAMES_SHORT[d.getMonth()]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800 capitalize">
                {d.toLocaleDateString("pt-BR", { weekday: "long" })}
              </p>
              <ShiftBadge shift={appointment.shift} size="xs" />
            </div>
            <p className="text-[11px] text-gray-500">{SHIFT_LABELS[appointment.shift]}</p>
            {appointment.notes && tone === "future" && (
              <p className="text-[11px] text-gray-400 italic mt-0.5">{appointment.notes}</p>
            )}
          </div>
        </div>

        {appointmentEqs.length > 0 && (
          <div className="space-y-1 pt-1 border-t">
            {appointmentEqs.map(eq => {
              const r = reportFor(eq.id);
              const canOpen = r && PUBLIC_REPORT_STATUSES.has(r.status);
              const eqLabel = eq.label || EQUIPMENT_TYPE_LABELS[eq.type] || "Equipamento";
              return (
                <div key={eq.id} className="flex items-center gap-1.5 text-[11px]">
                  <AirVent className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="text-gray-700 truncate flex-1">{eqLabel}</span>
                  {r && canOpen ? (
                    <Link
                      to={`${basePath}equipment/${eq.id}/laudo/${r.publicToken}`}
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                    >
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${REPORT_STATUS_COLORS[r.status]}`}>
                        {REPORT_STATUS_LABELS[r.status]}
                      </span>
                      <FileText className="w-3 h-3" />
                    </Link>
                  ) : r ? (
                    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${REPORT_STATUS_COLORS[r.status]}`}>
                      {REPORT_STATUS_LABELS[r.status]}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">sem laudo</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
