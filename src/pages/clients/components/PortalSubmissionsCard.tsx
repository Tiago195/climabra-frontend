import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { IPortalSubmission, IPortalEquipment, IPortalAppointment } from "@/services/client";
import { formatScheduledShift } from "@/lib/shifts";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const APPOINTMENT_STATUS: Record<string, { label: string; className: string }> = {
  scheduled:  { label: "Agendada",  className: "bg-blue-100 text-blue-700" },
  completed:  { label: "Atendida",  className: "bg-green-100 text-green-700" },
  cancelled:  { label: "Cancelada", className: "bg-red-100 text-red-600" },
};

interface Props {
  submissions: IPortalSubmission[];
  equipments: IPortalEquipment[];
  appointments: IPortalAppointment[];
}

export function PortalSubmissionsCard({ submissions, equipments, appointments }: Props) {
  if (submissions.length === 0) return null;

  const equipmentById = new Map(equipments.map(e => [e.id, e]));
  const appointmentBySubmission = new Map(
    appointments.filter(a => a.submissionId).map(a => [a.submissionId!, a])
  );

  const sorted = [...submissions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="text-base font-semibold">Minhas solicitações ({submissions.length})</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map(s => {
          const eq = s.equipmentId ? equipmentById.get(s.equipmentId) : null;
          const appt = appointmentBySubmission.get(s.id) ?? null;
          const apptStatus = appt ? (APPOINTMENT_STATUS[appt.status] ?? { label: appt.status, className: "bg-gray-100 text-gray-600" }) : null;
          return (
            <div key={s.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {eq ? eq.label || eq.type || "Equipamento" : "Solicitação"}
                </p>
                <span className="text-xs text-gray-400 shrink-0">{fmt(s.createdAt)}</span>
              </div>
              {appt && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">
                    Visita: {formatScheduledShift(appt.scheduledDate, appt.shift)}
                  </span>
                  {apptStatus && (
                    <span className={`px-2 py-0.5 rounded-full font-medium ${apptStatus.className}`}>
                      {apptStatus.label}
                    </span>
                  )}
                </div>
              )}
              {s.description && <p className="text-xs text-gray-600">{s.description}</p>}
              {s.photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {s.photoUrls.map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer">
                      <img src={u} alt="" className="rounded border w-full h-20 object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
