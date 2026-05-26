import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Plus, AirVent, FileText, CalendarDays, Phone, Mail } from "lucide-react";
import {
  PROVIDER,
  EQUIPMENTS,
  APPOINTMENTS,
  MockupShell,
  ShiftBadge,
  SHIFT_LABELS,
  EQUIPMENT_TYPE_LABELS,
  MONTH_NAMES_LONG,
  DAY_NAMES_SHORT,
  TODAY,
} from "./_shared";

const CLIENT_ID = "c3";

export default function ClientPortalCalendar() {
  const clientName = "Carla Mendes";
  const eqs = EQUIPMENTS.filter(e => e.clientId === CLIENT_ID);
  const appts = APPOINTMENTS.filter(a => a.clientId === CLIENT_ID);
  const upcoming = appts.filter(a => a.status === "scheduled" && a.scheduledDate >= TODAY);
  const pendingReports = appts.flatMap(a => a.reports).filter(r => r.status === "sent" || r.status === "approved").length;

  // Highlight datas das próximas visitas no calendário
  const year = 2026, month = 4;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const dateKey = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const apptDays = new Set(upcoming.map(a => parseInt(a.scheduledDate.split("-")[2])));

  return (
    <MockupShell title={`Olá, ${clientName.split(" ")[0]}`} subtitle="Variante A — Portal com calendário">
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
              <Bell className="w-3 h-3" /> {pendingReports} laudo
            </span>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 gap-2">
        <Plus className="w-4 h-4" /> Solicitar nova visita
      </Button>

      {/* Calendário */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600">{MONTH_NAMES_LONG[month]} {year}</p>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES_SHORT.map(d => <div key={d} className="text-center text-[10px] text-gray-400 py-0.5">{d}</div>)}
            {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const key = dateKey(day);
              const has = apptDays.has(day);
              const isToday = key === TODAY;
              return (
                <div key={day} className="aspect-square flex flex-col items-center justify-center text-xs">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full font-medium ${
                    has ? "bg-blue-600 text-white font-bold" :
                    isToday ? "ring-2 ring-blue-300 text-blue-700" :
                    "text-gray-700"
                  }`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-500 text-center">Dias destacados = visitas agendadas</p>
        </CardContent>
      </Card>

      {/* Próximas visitas */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
          Próximas visitas ({upcoming.length})
        </p>
        {upcoming.map(a => {
          const d = new Date(`${a.scheduledDate}T00:00:00`);
          return (
            <Card key={a.id}>
              <CardContent className="py-3 flex gap-3">
                <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg w-12 py-1 shrink-0">
                  <span className="text-[9px] uppercase font-bold text-blue-500">{DAY_NAMES_SHORT[d.getDay()]}</span>
                  <span className="text-lg font-bold text-blue-900 leading-none">{d.getDate()}</span>
                  <span className="text-[9px] text-blue-500">{MONTH_NAMES_LONG[d.getMonth()].slice(0,3).toLowerCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">
                      {d.toLocaleDateString("pt-BR", { weekday: "long" })}
                    </p>
                    <ShiftBadge shift={a.shift} size="xs" />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {SHIFT_LABELS[a.shift]} · {a.equipmentIds.length} equipamento{a.equipmentIds.length > 1 ? "s" : ""}
                  </p>
                  {a.notes && <p className="text-[11px] text-gray-400 italic mt-1">{a.notes}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Meus equipamentos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meus equipamentos</p>
          <button className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {eqs.map(eq => (
            <Card key={eq.id}>
              <CardContent className="py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                    <AirVent className="w-4 h-4" />
                  </div>
                  <FileText className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 truncate">{eq.label}</p>
                  <p className="text-[10px] text-gray-500">{EQUIPMENT_TYPE_LABELS[eq.type]} · {eq.brand}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer contact */}
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
