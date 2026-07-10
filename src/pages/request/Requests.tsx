import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, List, CalendarDays, History, Ban, Route as RouteIcon,
} from "lucide-react";
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
import { NewAppointmentDialog } from "./components/NewAppointmentDialog";
import { AppointmentTimelineView } from "./components/AppointmentTimelineView";
import { AppointmentHistoryView } from "./components/AppointmentHistoryView";
import { RouteDayView } from "./components/RouteDayView";
import { getApiErrorMessage } from "@/services/apiError";

type Tab = "future" | "past";
// "map" foi fundido em "route" (retrabalho pós-feedback: mapa + plano numa visão só).
type ViewMode = "timeline" | "route";

export function Requests() {
  const navigate = useNavigate();
  const { token, provider } = useAuth();
  const requireAccess = useRequireAccess();

  const [appointments, setAppointments] = useState<IAppointmentDetailResponse[]>([]);
  const [clients, setClients] = useState<IClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("future");
  const [view, setView] = useState<ViewMode>("timeline");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const [creatingReportFor, setCreatingReportFor] = useState<string | null>(null);

  void photoModal; void setPhotoModal;

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

  // Contagens das duas abas — regra de negócio:
  //   - "future" = scheduled (independente da data; pendente fica aqui)
  //   - "past"   = completed | canceled | no_show
  const futureCount = appointments.filter(a => a.appointment.status === "scheduled").length;
  const pastCount = appointments.length - futureCount;

  const handleNewClick = () => {
    requireAccess(() => {
      if (!provider?.publicToken) {
        toast.error("Provider sem token público — recarregue a página");
        return;
      }
      setDialogOpen(true);
    });
  };

  const handleAppointmentCreated = (appt: IAppointmentDetailResponse) => {
    setAppointments(prev => [appt, ...prev]);
  };

  // Visita movida de turno na rota — reflete a mudança na lista (Timeline/Dashboard/Mapa).
  const handleApptMoved = (updated: IAppointmentDetailResponse) => {
    setAppointments(prev => prev.map(row => row.appointment.id === updated.appointment.id ? updated : row));
  };

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

  const isPastTab = tab === "past";
  // No tab Passadas, força view=timeline
  const effectiveView: ViewMode = isPastTab ? "timeline" : view;

  return (
    // A visão Rota (mapa + plano lado a lado no desktop) precisa de mais largura que as demais.
    <div className={`${effectiveView === "route" ? "max-w-6xl" : "max-w-3xl"} mx-auto space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitações</h1>
          <p className="text-gray-500 text-sm">
            {isPastTab
              ? `${pastCount} visita${pastCount === 1 ? "" : "s"} no histórico`
              : `${futureCount} visita${futureCount === 1 ? "" : "s"} em aberto`}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9" onClick={handleNewClick}>
          <Plus className="w-3.5 h-3.5" /> Nova
        </Button>
      </div>

      {/* Tab Próximas / Passadas */}
      <div className="inline-flex rounded-lg bg-gray-100 p-0.5 w-full">
        <button
          type="button"
          onClick={() => setTab("future")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 transition ${
            tab === "future" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Próximas
          <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${
            tab === "future" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
          }`}>
            {futureCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setTab("past"); setView("timeline"); }}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 transition ${
            tab === "past" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Passadas
          <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${
            tab === "past" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-500"
          }`}>
            {pastCount}
          </span>
        </button>
      </div>

      {/* Toggle Timeline / Mapa — só faz sentido em Próximas */}
      <div className="inline-flex rounded-lg bg-gray-100 p-0.5 w-full">
        <button
          type="button"
          onClick={() => setView("timeline")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 transition ${
            effectiveView === "timeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <List className="w-3.5 h-3.5" /> Lista
        </button>
        <button
          type="button"
          onClick={() => !isPastTab && setView("route")}
          disabled={isPastTab}
          title={isPastTab ? "Disponível só para próximas" : undefined}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md py-1.5 transition ${
            effectiveView === "route" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          } ${isPastTab ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {isPastTab ? <Ban className="w-3.5 h-3.5" /> : <RouteIcon className="w-3.5 h-3.5" />}
          Rota
        </button>
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
      ) : isPastTab ? (
        <AppointmentHistoryView
          appointments={appointments}
          clientsById={clientsById}
        />
      ) : effectiveView === "timeline" ? (
        <AppointmentTimelineView
          token={token!}
          appointments={appointments}
          clientsById={clientsById}
          creatingReportFor={creatingReportFor}
          onCreateReport={handleCreateReport}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      ) : (
        <RouteDayView
          token={token!}
          appointments={appointments}
          clientsById={clientsById}
          creatingReportFor={creatingReportFor}
          onCreateReport={handleCreateReport}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onApptMoved={handleApptMoved}
        />
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
        />
      )}

      <ResponsiveModal
        open={!!photoModal}
        onOpenChange={o => !o && setPhotoModal(null)}
        size="2xl"
        title="Foto"
      >
          {photoModal && (
            <img src={photoModal} alt="Foto ampliada" className="w-full h-auto rounded max-h-[80vh] object-contain" />
          )}
      </ResponsiveModal>
    </div>
  );
}
