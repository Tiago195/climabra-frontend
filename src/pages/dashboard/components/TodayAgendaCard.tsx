import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Sunset, Moon, MapPin, Loader2, CalendarDays } from "lucide-react";
import type { IAppointmentDetailResponse } from "@/services/appointment";
import type { IClientResponse } from "@/services/client";
import type { Shift } from "@/services/enums";

type RowStatus = "done" | "in_progress" | "scheduled" | "canceled";

const STATUS_META: Record<RowStatus, { label: string; cls: string }> = {
  done:        { label: "Concluído", cls: "bg-green-100 text-green-700" },
  in_progress: { label: "Em curso",  cls: "bg-blue-100 text-blue-700" },
  scheduled:   { label: "Agendado",  cls: "bg-gray-100 text-gray-600" },
  canceled:    { label: "Cancelado", cls: "bg-gray-100 text-gray-400" },
};

const PERIODS = [
  { id: "morning",   label: "Manhã", hint: "06h–12h", icon: Sun },
  { id: "afternoon", label: "Tarde", hint: "12h–18h", icon: Sunset },
  { id: "night",     label: "Noite", hint: "18h–22h", icon: Moon },
] as const;

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function currentShift(): Shift {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "night";
}

function rowStatus(a: IAppointmentDetailResponse): RowStatus {
  const st = a.appointment.status;
  if (st === "completed") return "done";
  if (st === "canceled") return "canceled";
  // "Em curso" inferido de um laudo com serviço já iniciado (serviceStartedAt).
  if (a.reports?.some(r => r.serviceStartedAt && r.status !== "completed")) return "in_progress";
  return "scheduled";
}

function serviceLabel(a: IAppointmentDetailResponse): string {
  return (
    a.submission?.problemType ||
    a.submission?.description ||
    a.appointment.notes ||
    a.equipments.map(e => e.label || e.type).filter(Boolean).join(", ") ||
    "Visita técnica"
  );
}

/**
 * Agenda de hoje agrupada por turno (manhã/tarde/noite), reusando o idioma de
 * timeline das solicitações. "Agora" destaca o turno corrente; "Em curso" vem de
 * um laudo com {@code serviceStartedAt}. (Sem legs de deslocamento/duração.)
 */
export function TodayAgendaCard({
  appointments, clientsById,
}: {
  appointments: IAppointmentDetailResponse[];
  clientsById: Map<string, IClientResponse>;
}) {
  const [filter, setFilter] = useState<"all" | Shift>("all");
  const today = toISO(new Date());
  const nowShift = currentShift();

  const todays = useMemo(
    () => appointments.filter(a => a.appointment.scheduledDate === today),
    [appointments, today],
  );

  const byPeriod = useMemo(() => {
    const groups: Record<Shift, IAppointmentDetailResponse[]> = { morning: [], afternoon: [], night: [] };
    for (const a of todays) groups[a.appointment.shift]?.push(a);
    return groups;
  }, [todays]);

  const counts = {
    done: todays.filter(a => rowStatus(a) === "done").length,
    inProgress: todays.filter(a => rowStatus(a) === "in_progress").length,
    scheduled: todays.filter(a => rowStatus(a) === "scheduled").length,
  };

  const dateLabel = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  const visiblePeriods = filter === "all" ? PERIODS : PERIODS.filter(p => p.id === filter);

  return (
    <Card>
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              Agenda de hoje <span className="text-gray-400 font-normal text-sm">· {dateLabel}</span>
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              {todays.length === 0
                ? "Nenhuma visita para hoje"
                : `${counts.done} concluídas · ${counts.inProgress} em curso · ${counts.scheduled} restantes`}
            </p>
          </div>
        </div>
        {todays.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Tudo</FilterChip>
            {PERIODS.map(p => (
              <FilterChip key={p.id} active={filter === p.id} onClick={() => setFilter(p.id)}>
                {p.label} <span className="text-gray-400 ml-1">{byPeriod[p.id].length}</span>
              </FilterChip>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {todays.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sem visitas agendadas para hoje</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 -mx-1">
            {visiblePeriods.map(period => (
              <PeriodSection
                key={period.id}
                period={period}
                items={byPeriod[period.id]}
                isNow={period.id === nowShift}
                clientsById={clientsById}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md transition-colors ${
        active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function PeriodSection({
  period, items, isNow, clientsById,
}: {
  period: (typeof PERIODS)[number];
  items: IAppointmentDetailResponse[];
  isNow: boolean;
  clientsById: Map<string, IClientResponse>;
}) {
  const Icon = period.icon;
  const done = items.filter(a => rowStatus(a) === "done").length;
  const inProgress = items.filter(a => rowStatus(a) === "in_progress").length;

  return (
    <section className={`py-2.5 px-1 ${isNow ? "bg-blue-50/50" : ""}`}>
      <header className="flex items-center gap-2.5 px-1 mb-2">
        <span className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
          isNow ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
        }`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-800 flex items-center gap-1.5">
            {period.label}
            {isNow && <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">Agora</Badge>}
          </p>
          <p className="text-[11px] text-gray-400">{period.hint}</p>
        </div>
        <div className="text-[11px] text-gray-500 text-right shrink-0">
          {items.length === 0 ? (
            <span className="text-gray-400">sem visitas</span>
          ) : (
            <>
              <b className="text-gray-700">{items.length}</b> {items.length === 1 ? "visita" : "visitas"}
              {done > 0 && <span className="text-gray-400"> · {done} concluída{done > 1 ? "s" : ""}</span>}
              {inProgress > 0 && <span className="text-gray-400"> · {inProgress} em curso</span>}
            </>
          )}
        </div>
      </header>
      {items.length === 0 ? (
        <p className="text-[11px] text-gray-400 px-1 pl-10">Nada agendado neste turno.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((a, i) => (
            <AgendaRow key={a.appointment.id} a={a} index={i + 1} client={clientsById.get(a.client.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AgendaRow({
  a, index, client,
}: {
  a: IAppointmentDetailResponse;
  index: number;
  client?: IClientResponse;
}) {
  const status = rowStatus(a);
  const meta = STATUS_META[status];
  const neighborhood = client?.neighborhood;
  const address = client ? [client.street, client.streetNumber].filter(Boolean).join(", ") : "";

  return (
    <li className="flex items-start gap-2.5 rounded-md px-2.5 py-2 bg-gray-50/60 ring-1 ring-gray-100">
      <span className="text-[10px] font-bold text-blue-500 mt-0.5 shrink-0 w-4 text-center">{index}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-gray-800 truncate">{a.client.name}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5 flex-wrap">
          <span className="truncate">{serviceLabel(a)}</span>
          {(neighborhood || address) && (
            <>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-0.5 min-w-0">
                <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                <span className="truncate">
                  {neighborhood && <b className="text-gray-700 font-semibold">{neighborhood}</b>}
                  {neighborhood && address && " · "}{address}
                </span>
              </span>
            </>
          )}
        </div>
      </div>
      <Badge className={`${meta.cls} text-[10px] shrink-0 gap-1`}>
        {status === "in_progress" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
        {meta.label}
      </Badge>
    </li>
  );
}
