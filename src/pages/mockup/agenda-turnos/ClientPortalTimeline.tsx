import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Bell, Plus, AirVent, FileText, CheckCircle2, Clock, Phone, Mail, Users } from "lucide-react";
import {
  PROVIDER,
  EQUIPMENTS,
  APPOINTMENTS,
  MockupShell,
  ShiftBadge,
  SHIFT_LABELS,
  SHIFT_COLORS,
  SHIFT_ICONS,
  EQUIPMENT_TYPE_LABELS,
  DAY_NAMES_SHORT,
  MONTH_NAMES_SHORT,
  TODAY,
  slotsForDate,
  reportForEquipment,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  type Shift,
} from "./_shared";

const CLIENT_ID = "c3";

interface UpcomingSlot { date: string; shift: Shift; startTime: string; endTime: string; available: number; capacity: number; }

function buildUpcoming(): UpcomingSlot[] {
  const out: UpcomingSlot[] = [];
  const start = new Date(`${TODAY}T00:00:00`);
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    for (const s of slotsForDate(iso)) {
      if (s.blocked || s.available === 0) continue;
      out.push({ date: iso, shift: s.shift, startTime: s.startTime, endTime: s.endTime, available: s.available, capacity: s.capacity });
    }
  }
  return out.slice(0, 12);
}

export default function ClientPortalTimeline() {
  const clientName = "Carla Mendes";
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ date: string; shift: Shift } | null>(null);
  const upcomingSlots = buildUpcoming();
  const eqs = EQUIPMENTS.filter(e => e.clientId === CLIENT_ID);
  const appts = APPOINTMENTS.filter(a => a.clientId === CLIENT_ID);
  const upcoming = appts.filter(a => a.status === "scheduled" && a.scheduledDate >= TODAY);
  const past = appts.filter(a => a.status === "completed" || a.scheduledDate < TODAY).slice(0, 3);
  const pendingReports = appts.flatMap(a => a.reports).filter(r => r.status === "sent" || r.status === "approved").length;

  const allAppts = [...upcoming, ...past].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

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

      <Button onClick={() => setOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 h-11 gap-2">
        <Plus className="w-4 h-4" /> Solicitar nova visita
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Próximos turnos disponíveis</DialogTitle>
            <DialogDescription>Escolha um turno em uma das próximas datas com vaga.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {upcomingSlots.map(s => {
              const d = new Date(`${s.date}T00:00:00`);
              const c = SHIFT_COLORS[s.shift];
              const Icon = SHIFT_ICONS[s.shift];
              const isPicked = picked?.date === s.date && picked?.shift === s.shift;
              return (
                <button
                  key={`${s.date}-${s.shift}`}
                  onClick={() => setPicked({ date: s.date, shift: s.shift })}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                    isPicked ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center w-11 py-1 bg-white border border-gray-200 rounded">
                    <span className="text-[9px] uppercase font-bold text-gray-400">{DAY_NAMES_SHORT[d.getDay()]}</span>
                    <span className="text-sm font-bold text-gray-900 leading-none">{d.getDate()}</span>
                    <span className="text-[9px] text-gray-400">{MONTH_NAMES_SHORT[d.getMonth()]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded ${c.bg} ${c.text} flex items-center justify-center`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{SHIFT_LABELS[s.shift]}</p>
                      <span className="text-[11px] text-gray-500">{s.startTime}–{s.endTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="font-semibold text-gray-700">{s.available}/{s.capacity}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!picked} onClick={() => setOpen(false)}>
              Solicitar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Timeline cronológico com equipamentos e laudos */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">Histórico</p>
        <div className="relative pl-8">
          <div className="absolute left-3.5 top-1 bottom-1 w-px bg-gray-200" />
          <div className="space-y-3">
            {allAppts.map(a => {
              const d = new Date(`${a.scheduledDate}T00:00:00`);
              const isPast = a.scheduledDate < TODAY || a.status === "completed";
              const isToday = a.scheduledDate === TODAY;
              const dotColor = isToday ? "bg-blue-600 ring-4 ring-blue-100"
                : isPast ? "bg-gray-300" : "bg-blue-500";
              const eqs = a.equipmentIds.map(id => EQUIPMENTS.find(e => e.id === id)!);
              return (
                <div key={a.id} className="relative">
                  <div className={`absolute -left-[26px] top-3 w-3 h-3 rounded-full ${dotColor}`} />
                  <p className="text-[10px] uppercase font-semibold text-gray-400 mb-1">
                    {isToday ? "Hoje" : `${d.getDate()} de ${MONTH_NAMES_SHORT[d.getMonth()]} · ${DAY_NAMES_SHORT[d.getDay()]}`}
                  </p>
                  <Card className={isPast ? "opacity-90" : ""}>
                    <CardContent className="py-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {isPast ? "Visita realizada" : "Visita agendada"}
                        </p>
                        <ShiftBadge shift={a.shift} size="xs" />
                      </div>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        {isPast ? (
                          <><CheckCircle2 className="w-3 h-3 text-green-600" /> Turno da {SHIFT_LABELS[a.shift].toLowerCase()}</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Turno da {SHIFT_LABELS[a.shift].toLowerCase()}</>
                        )}
                      </p>
                      {/* Equipamentos + link de laudo */}
                      <div className="space-y-1 pt-1 border-t">
                        {eqs.map(eq => {
                          const r = reportForEquipment(a, eq.id);
                          return (
                            <div key={eq.id} className="flex items-center gap-1.5 text-[11px]">
                              <AirVent className="w-3 h-3 text-blue-500 shrink-0" />
                              <span className="text-gray-700 truncate flex-1">{eq.label}</span>
                              {r ? (
                                <button className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                                  <span className={`text-[9px] px-1 py-0.5 rounded ${REPORT_STATUS_COLORS[r.status]}`}>
                                    {REPORT_STATUS_LABELS[r.status]}
                                  </span>
                                  <FileText className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400">sem laudo</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
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
