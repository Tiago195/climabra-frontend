import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Plus, AirVent, FileText, CheckCircle2, Clock, Phone, Mail } from "lucide-react";
import {
  PROVIDER,
  EQUIPMENTS,
  APPOINTMENTS,
  MockupShell,
  ShiftBadge,
  SHIFT_LABELS,
  EQUIPMENT_TYPE_LABELS,
  DAY_NAMES_SHORT,
  MONTH_NAMES_SHORT,
  TODAY,
} from "./_shared";

const CLIENT_ID = "c3";

interface TimelineEvent {
  date: string;
  kind: "appointment" | "report";
  label: string;
  sub: string;
  badge?: React.ReactNode;
  pastFuture: "past" | "today" | "future";
}

export default function ClientPortalTimeline() {
  const clientName = "Carla Mendes";
  const eqs = EQUIPMENTS.filter(e => e.clientId === CLIENT_ID);
  const appts = APPOINTMENTS.filter(a => a.clientId === CLIENT_ID);
  const upcoming = appts.filter(a => a.status === "scheduled" && a.scheduledDate >= TODAY);
  const past = appts.filter(a => a.status === "completed" || a.scheduledDate < TODAY).slice(0, 3);
  const pendingReports = appts.flatMap(a => a.reports).filter(r => r.status === "sent" || r.status === "approved").length;

  const events: TimelineEvent[] = [
    ...upcoming.map(a => ({
      date: a.scheduledDate,
      kind: "appointment" as const,
      label: `Visita técnica · ${a.equipmentIds.length} equipamento${a.equipmentIds.length > 1 ? "s" : ""}`,
      sub: `Turno da ${SHIFT_LABELS[a.shift].toLowerCase()}`,
      badge: <ShiftBadge shift={a.shift} size="xs" />,
      pastFuture: a.scheduledDate === TODAY ? "today" as const : "future" as const,
    })),
    ...past.map(a => ({
      date: a.scheduledDate,
      kind: "appointment" as const,
      label: a.status === "completed" ? "Visita concluída" : "Visita anterior",
      sub: `${a.equipmentIds.length} equipamento${a.equipmentIds.length > 1 ? "s" : ""} · ${SHIFT_LABELS[a.shift].toLowerCase()}`,
      pastFuture: "past" as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <MockupShell title={`Olá, ${clientName.split(" ")[0]}`} subtitle="Variante B — Portal cronológico">
      {/* Provider header */}
      <Card>
        <CardContent className="py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            {PROVIDER.companyName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Atendido por</p>
            <p className="text-sm font-semibold text-gray-800">{PROVIDER.companyName}</p>
          </div>
          {pendingReports > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
              <Bell className="w-3 h-3" /> {pendingReports}
            </span>
          )}
        </CardContent>
      </Card>

      <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 gap-2">
        <Plus className="w-4 h-4" /> Solicitar nova visita
      </Button>

      {/* Equipamentos — chips horizontais */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Meus equipamentos</p>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {eqs.map(eq => (
            <div key={eq.id} className="shrink-0 w-32 bg-white border border-gray-200 rounded-lg p-2.5">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <AirVent className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-gray-800 truncate">{eq.label}</p>
              <p className="text-[10px] text-gray-500 truncate">{EQUIPMENT_TYPE_LABELS[eq.type]}</p>
              <p className="text-[10px] text-gray-400 truncate">{eq.brand}</p>
            </div>
          ))}
          <button className="shrink-0 w-32 border-2 border-dashed border-gray-200 rounded-lg p-2.5 text-gray-400 flex flex-col items-center justify-center gap-1 hover:border-blue-300 hover:text-blue-600">
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Timeline cronológico */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Histórico</p>
        <div className="relative pl-8">
          <div className="absolute left-3.5 top-1 bottom-1 w-px bg-gray-200" />
          <div className="space-y-3">
            {events.map((ev, i) => {
              const d = new Date(`${ev.date}T00:00:00`);
              const dotColor =
                ev.pastFuture === "today" ? "bg-blue-600 ring-4 ring-blue-100" :
                ev.pastFuture === "future" ? "bg-blue-500" :
                "bg-gray-300";
              return (
                <div key={i} className="relative">
                  <div className={`absolute -left-[26px] top-3 w-3 h-3 rounded-full ${dotColor}`} />
                  <p className="text-[10px] uppercase font-semibold text-gray-400 mb-1">
                    {ev.pastFuture === "today" ? "Hoje" : `${d.getDate()} de ${MONTH_NAMES_SHORT[d.getMonth()]} · ${DAY_NAMES_SHORT[d.getDay()]}`}
                  </p>
                  <Card className={ev.pastFuture === "past" ? "opacity-75" : ""}>
                    <CardContent className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">{ev.label}</p>
                        {ev.badge}
                      </div>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        {ev.pastFuture === "past" ? (
                          <><CheckCircle2 className="w-3 h-3 text-green-600" />{ev.sub}</>
                        ) : (
                          <><Clock className="w-3 h-3" />{ev.sub}</>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Laudos pendentes */}
      {pendingReports > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="py-3 flex items-start gap-2">
            <Bell className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Laudo aguardando sua aprovação</p>
              <p className="text-[11px] text-amber-700">Toque para revisar e aprovar os itens propostos.</p>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 h-7 text-xs gap-1 mt-2">
                <FileText className="w-3 h-3" /> Ver laudo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-3 flex items-center justify-around text-[11px] text-gray-600">
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {PROVIDER.phone}</span>
          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {PROVIDER.email}</span>
        </CardContent>
      </Card>

      <div className="pb-4" />
    </MockupShell>
  );
}
