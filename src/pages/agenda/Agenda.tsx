import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Settings, CalendarDays, History, Route as RouteIcon,
  ChevronLeft, ChevronRight, X, AlertTriangle,
} from "lucide-react";
import { MonthCalendar } from "@/components/MonthCalendar";
import type { ICalendarDay } from "@/services/agenda";
import type { Shift } from "@/services/enums";
import { futureBucketFor } from "@/lib/shifts";
import { DaySheet } from "./components/DaySheet";
import { AddExceptionDialog } from "./disponibilidade/components/AddExceptionDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext";
import { useRequireAccess } from "@/components/SubscriptionGate";
import {
  appointmentService,
  isReportDeliverableForVisit,
  type IAppointmentDetailResponse,
  type IAppointmentInfo,
  type IAppointmentReportInfo,
} from "@/services/appointment";
import { clientService, type IClientResponse } from "@/services/client";
import { reportService } from "@/services/report";
import { NewAppointmentDialog } from "../request/components/NewAppointmentDialog";
import { AppointmentTimelineView } from "../request/components/AppointmentTimelineView";
import { AppointmentHistoryView } from "../request/components/AppointmentHistoryView";
import { RouteDayView } from "../request/components/RouteDayView";
import { getApiErrorMessage } from "@/services/apiError";

// Segmentos da Agenda unificada (H1). Valor persiste na URL (`?tab=`) para deep link.
//   rota       → visão Rota do dia (RouteDayView), com seletor de dia ‹‹ HOJE ››
//   calendario → lista das próximas visitas (AppointmentTimelineView); o calendário do mês é H3
//   historico  → visitas passadas (AppointmentHistoryView)
type Tab = "rota" | "calendario" | "historico";
const TABS: Tab[] = ["rota", "calendario", "historico"];
const isTab = (v: string | null): v is Tab => v != null && (TABS as string[]).includes(v);

const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const shiftISO = (iso: string, days: number) => {
  const [y, m, dd] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, dd);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const formatDayLabel = (iso: string) => {
  const [y, m, dd] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, dd);
  return d
    .toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    .replace(".", "");
};

export function Agenda() {
  const navigate = useNavigate();
  const { token, provider } = useAuth();
  const requireAccess = useRequireAccess();
  const [searchParams, setSearchParams] = useSearchParams();

  const [appointments, setAppointments] = useState<IAppointmentDetailResponse[]>([]);
  const [clients, setClients] = useState<IClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creatingReportFor, setCreatingReportFor] = useState<string | null>(null);
  // Dia exibido no segmento Rota (D2b). Começa em hoje; setas ‹ › navegam.
  const [routeDate, setRouteDate] = useState(() => todayISO());
  // Dia selecionado no calendário do mês (H3) — filtra a lista de visitas abaixo.
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  // Sheet do dia (H4/T4.1) — abre ao tocar num dia do calendário.
  // "Aberto" e "dados" são estados SEPARADOS (mesmo padrão do dialogOpen/newVisitInitial
  // abaixo): fechar só derruba `daySheetOpen`, nunca `daySheetData` — assim o `DaySheet`
  // segue recebendo `date`/`day` válidos enquanto a animação de saída roda, sem "piscar"
  // vazio no meio do fade-out.
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [daySheetData, setDaySheetData] = useState<{ date: string; day: ICalendarDay | null } | null>(null);
  const closeDaySheet = () => setDaySheetOpen(false);
  // Pré-seleção do NewAppointmentDialog vinda do sheet (H4/T4.2); null = fluxo comum do header.
  const [newVisitInitial, setNewVisitInitial] = useState<{ date: string; shift?: Shift } | null>(null);
  // Fluxo "Bloquear este dia" (H4/T4.3) — data + nº de visitas em conflito (D6). Mesmo
  // padrão acima: `blockDayOpen` separado de `blockDayData` para não piscar o aviso de
  // conflito durante o fade-out do AddExceptionDialog.
  const [blockDayOpen, setBlockDayOpen] = useState(false);
  const [blockDayData, setBlockDayData] = useState<{ date: string; conflictCount: number } | null>(null);
  const closeBlockDay = () => setBlockDayOpen(false);
  // Força o calendário a recarregar após criar visita / bloqueio (sem remontar).
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  const today = useMemo(() => todayISO(), []);

  useEffect(() => {
    if (!token) return;
    Promise.all([appointmentService.list(token), clientService.list(token)])
      .then(([appts, cls]) => { setAppointments(appts); setClients(cls); })
      .catch(e => toast.error(getApiErrorMessage(e, "Erro ao carregar dados")))
      .finally(() => setLoading(false));
  }, [token]);

  const clientsById = useMemo(
    () => new Map(clients.map(c => [c.id, c])),
    [clients]
  );

  // Contadores dos segmentos:
  //   - rota       = visitas agendadas para HOJE (base da regra D2 do default)
  //   - calendario = todas as visitas agendadas (status "scheduled"), independente da data
  //   - historico  = completed | canceled | no_show
  const calendarioCount = appointments.filter(a => a.appointment.status === "scheduled").length;
  const historicoCount = appointments.length - calendarioCount;
  const todayCount = appointments.filter(
    a => a.appointment.status === "scheduled" && a.appointment.scheduledDate === today
  ).length;

  // D2: segmento default quando não há `?tab=` — Rota se há visita hoje, senão Calendário.
  // Só decide depois do load (antes disso todos os contadores são 0).
  const defaultTab: Tab = todayCount > 0 ? "rota" : "calendario";
  const paramTab = searchParams.get("tab");
  const activeTab: Tab = isTab(paramTab) ? paramTab : defaultTab;

  const selectTab = (tab: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const openNewVisit = (initial: { date: string; shift?: Shift } | null) => {
    requireAccess(() => {
      if (!provider?.publicToken) {
        toast.error("Provider sem token público — recarregue a página");
        return;
      }
      setNewVisitInitial(initial);
      setDialogOpen(true);
    });
  };

  // "+ Nova visita" do header — sem pré-seleção de dia.
  const handleNewClick = () => openNewVisit(null);

  const handleAppointmentCreated = (appt: IAppointmentDetailResponse) => {
    setAppointments(prev => [appt, ...prev]);
    setCalendarRefresh(n => n + 1);
  };

  // Visita movida de turno na rota — reflete a mudança na lista.
  const handleApptMoved = (updated: IAppointmentDetailResponse) => {
    setAppointments(prev => prev.map(row => row.appointment.id === updated.appointment.id ? updated : row));
  };

  // Nº de visitas ainda `scheduled` num dia — alimenta o aviso de conflito ao bloquear (D6).
  const scheduledCountOn = (date: string) =>
    appointments.filter(
      a => a.appointment.status === "scheduled" && a.appointment.scheduledDate === date
    ).length;

  // Toque no dia do calendário (H4): abre o sheet do dia. O filtro da lista continua
  // acessível DENTRO do sheet ("Ver na lista"), mantendo o chip/UX do H3.
  const handleCalendarDayClick = (date: string, day: ICalendarDay | null) => {
    setDaySheetData({ date, day });
    setDaySheetOpen(true);
  };

  // "Ver na lista" (dentro do sheet): fecha o sheet, aplica o filtro do dia e rola até a lista.
  const handleOpenInList = (date: string) => {
    closeDaySheet();
    setSelectedCalendarDay(date);
    requestAnimationFrame(() => timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // Long-press no dia (T4.4) ou "Bloquear este dia" no sheet (T4.3) → fluxo de bloqueio.
  // Dia já passado não entra no fluxo de bloqueio — não faz sentido bloquear o passado.
  const handleBlockDay = (date: string) => {
    closeDaySheet();
    if (date < today) {
      toast.info("Dia já passou — não é possível bloquear.");
      return;
    }
    setBlockDayData({ date, conflictCount: scheduledCountOn(date) });
    setBlockDayOpen(true);
  };

  // Ao navegar o mês, o filtro por dia deixa de fazer sentido — limpa.
  const handleCalendarMonthChange = () => setSelectedCalendarDay(null);

  // Rola até a seção "Pendente" da lista (banner âmbar — H5/T5.1).
  const scrollToPending = () => {
    setSelectedCalendarDay(null); // pendentes podem estar fora do dia filtrado
    requestAnimationFrame(() => {
      const el = document.getElementById("agenda-pending-section");
      (el ?? timelineRef.current)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Visitas pendentes = agendadas com data vencida (mesma regra do bucket "Pendente").
  const pendingCount = appointments.filter(
    a => a.appointment.status === "scheduled" && futureBucketFor(a.appointment.scheduledDate, today) === "pending"
  ).length;

  // Lista de visitas abaixo do calendário, filtrada pelo dia selecionado (se houver).
  const calendarAppointments = selectedCalendarDay
    ? appointments.filter(a => a.appointment.scheduledDate === selectedCalendarDay)
    : appointments;

  const handleComplete = async (appt: IAppointmentInfo, reports: IAppointmentReportInfo[]) => {
    if (!token) return;
    if (reports.length === 0) {
      toast.warning("Crie um laudo para cada equipamento antes de concluir");
      return;
    }
    if (!reports.every(isReportDeliverableForVisit)) {
      toast.warning(
        appt.visitType === "execution"
          ? "Finalize o laudo (fotos antes/depois) antes de concluir a visita"
          : "Aguarde o cliente aprovar o orçamento de todos os laudos"
      );
      return;
    }
    try {
      await appointmentService.complete(token, appt.id);
      setAppointments(prev => prev.map(row =>
        row.appointment.id === appt.id
          ? { ...row, appointment: { ...row.appointment, status: "completed" } }
          : row
      ));
      toast.success("Visita marcada como concluída!");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível concluir"));
    }
  };

  const handleCancel = async (id: string) => {
    if (!token) return;
    try {
      await appointmentService.cancel(token, id);
      setAppointments(prev => prev.map(row =>
        row.appointment.id === id
          ? { ...row, appointment: { ...row.appointment, status: "canceled" } }
          : row
      ));
      toast.success("Agendamento cancelado.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao cancelar agendamento"));
    }
  };

  const handleCreateReport = async (appt: IAppointmentInfo, equipmentId: string) => {
    if (!token) return;
    setCreatingReportFor(equipmentId);
    try {
      const report = await reportService.create(token, {
        equipmentId,
        appointmentId: appt.id,
        items: [{ description: "Inspeção geral" }],
      });
      navigate(`/dashboard/reports/${report.id}`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao criar laudo"));
    } finally {
      setCreatingReportFor(null);
    }
  };

  // Subtítulo: "N em aberto · N pendentes" (pendentes só quando > 0) — H5.
  const subtitle = activeTab === "historico"
    ? `${historicoCount} visita${historicoCount === 1 ? "" : "s"} no histórico`
    : `${calendarioCount} em aberto${pendingCount > 0 ? ` · ${pendingCount} pendente${pendingCount === 1 ? "" : "s"}` : ""}`;

  const segments: { tab: Tab; label: string; count: number; Icon: typeof RouteIcon }[] = [
    { tab: "rota", label: "Rota", count: todayCount, Icon: RouteIcon },
    { tab: "calendario", label: "Calendário", count: calendarioCount, Icon: CalendarDays },
    { tab: "historico", label: "Histórico", count: historicoCount, Icon: History },
  ];

  const isRouteToday = routeDate === today;

  return (
    // A visão Rota (mapa + plano lado a lado no desktop) precisa de mais largura.
    <div className={`${activeTab === "rota" ? "max-w-6xl" : "max-w-3xl"} mx-auto space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 text-sm truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label="Disponibilidade"
            title="Disponibilidade"
            onClick={() => navigate("/dashboard/agenda/disponibilidade")}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9" onClick={handleNewClick}>
            <Plus className="w-3.5 h-3.5" /> Nova visita
          </Button>
        </div>
      </div>

      {/* Segmented control Rota / Calendário / Histórico */}
      <div className="inline-flex rounded-lg bg-gray-100 p-0.5 w-full">
        {segments.map(({ tab, label, count, Icon }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => selectTab(tab)}
              className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 px-1 transition ${
                active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 hidden sm:inline-block" />
              <span className="truncate">{label}</span>
              <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold shrink-0 ${
                active
                  ? (tab === "historico" ? "bg-gray-700 text-white" : "bg-blue-100 text-blue-700")
                  : "bg-gray-200 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === "historico" ? (
        <AppointmentHistoryView
          appointments={appointments}
          clientsById={clientsById}
        />
      ) : activeTab === "calendario" ? (
        <div className="space-y-4">
          {/* Banner âmbar de pendências (H5/T5.1) — rola até a seção "Pendente". */}
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={scrollToPending}
              className="w-full flex items-center gap-2.5 text-left rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 hover:bg-amber-100 transition"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="flex-1 min-w-0 text-sm">
                <span className="font-semibold text-amber-800">
                  {pendingCount} visita{pendingCount > 1 ? "s" : ""} pendente{pendingCount > 1 ? "s" : ""}
                </span>
                <span className="text-amber-700"> — data já passou sem conclusão.</span>
              </span>
              <span className="text-xs font-semibold text-amber-700 shrink-0">Ver →</span>
            </button>
          )}

          {/* Calendário do mês (H3) — colapsável no topo; toque abre o sheet do dia (H4). */}
          <MonthCalendar
            token={token!}
            selectedDate={selectedCalendarDay}
            onDayClick={handleCalendarDayClick}
            onDayLongPress={handleBlockDay}
            onMonthChange={handleCalendarMonthChange}
            refreshToken={calendarRefresh}
          />

          {/* Indicador do filtro ativo por dia. */}
          {selectedCalendarDay && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full pl-3 pr-1.5 py-1">
                Filtrando por {formatDayLabel(selectedCalendarDay)}
                <button
                  type="button"
                  aria-label="Limpar filtro do dia"
                  onClick={() => setSelectedCalendarDay(null)}
                  className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          <div ref={timelineRef}>
            <AppointmentTimelineView
              token={token!}
              appointments={calendarAppointments}
              clientsById={clientsById}
              creatingReportFor={creatingReportFor}
              onCreateReport={handleCreateReport}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Seletor de dia ‹‹ HOJE ›› (D2b) — navega a rota de qualquer dia. */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Dia anterior"
              onClick={() => setRouteDate(d => shiftISO(d, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <button
              type="button"
              onClick={() => setRouteDate(today)}
              className={`min-w-[9rem] h-9 px-3 rounded-md text-sm font-semibold capitalize transition ${
                isRouteToday
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title={isRouteToday ? "Hoje" : "Voltar para hoje"}
            >
              {isRouteToday ? "Hoje" : formatDayLabel(routeDate)}
            </button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Próximo dia"
              onClick={() => setRouteDate(d => shiftISO(d, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <RouteDayView
            token={token!}
            date={routeDate}
            appointments={appointments}
            clientsById={clientsById}
            creatingReportFor={creatingReportFor}
            onCreateReport={handleCreateReport}
            onComplete={handleComplete}
            onCancel={handleCancel}
            onApptMoved={handleApptMoved}
          />
        </div>
      )}

      {token && provider?.publicToken && (
        <NewAppointmentDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          token={token}
          publicToken={provider.publicToken}
          clients={clients}
          appointments={appointments}
          onCreated={handleAppointmentCreated}
          initialDate={newVisitInitial?.date}
          initialShift={newVisitInitial?.shift}
        />
      )}

      {/* Sheet do dia (H4/T4.1) */}
      <DaySheet
        open={daySheetOpen}
        date={daySheetData?.date ?? null}
        today={today}
        day={daySheetData?.day ?? null}
        appointments={appointments}
        onClose={closeDaySheet}
        onNewVisit={(date, shift) => { closeDaySheet(); openNewVisit({ date, shift }); }}
        onBlockDay={handleBlockDay}
        onOpenInList={handleOpenInList}
      />

      {/* Fluxo "Bloquear este dia" (H4/T4.3) — aviso de conflito quando há visitas no dia (D6). */}
      <AddExceptionDialog
        open={blockDayOpen}
        onOpenChange={open => { if (!open) closeBlockDay(); }}
        initialDate={blockDayData?.date}
        conflictCount={blockDayData?.conflictCount}
        onCreated={() => { closeBlockDay(); setCalendarRefresh(n => n + 1); }}
      />
    </div>
  );
}
