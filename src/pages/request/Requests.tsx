import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, User, Clock, CheckCircle2, XCircle, Plus, Loader2, AirVent, Camera, FileText, ChevronDown, ChevronUp, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext";
import { useRequireProfile } from "@/components/CompleteProfileDialog";
import { appointmentService, type IAppointmentDetailResponse, type IAppointmentInfo, type IAppointmentReportInfo, type IAppointmentEquipmentInfo } from "@/services/appointment";
import { clientService, type IClientResponse } from "@/services/client";
import { reportService } from "@/services/report";
import { availabilityService, type AvailabilityDTO } from "@/services/availability";

type Filter = "all" | "scheduled" | "completed" | "canceled";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Todos",
  scheduled: "Agendados",
  completed: "Concluídos",
  canceled: "Cancelados",
};

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  split: "Split", janela: "Janela", central: "Central", cassete: "Cassete",
  piso_teto: "Piso-teto", portatil: "Portátil",
};

const PROBLEM_TYPE_LABELS: Record<string, string> = {
  nao_gela: "Não está gelando", barulho: "Fazendo barulho", vazamento: "Vazando água",
  nao_liga: "Não liga", manutencao: "Manutenção preventiva", instalacao: "Instalação", outro: "Outro",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  scheduled: { label: "Agendado", icon: Clock, color: "text-blue-600 bg-blue-50" },
  completed: { label: "Concluído", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  canceled: { label: "Cancelado", icon: XCircle, color: "text-gray-500 bg-gray-50" },
  no_show: { label: "Não compareceu", icon: XCircle, color: "text-red-600 bg-red-50" },
};

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const fmtDateLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function Requests() {
  const navigate = useNavigate();
  const { token, provider } = useAuth();
  const requireProfile = useRequireProfile();

  const [appointments, setAppointments] = useState<IAppointmentDetailResponse[]>([]);
  const [clients, setClients] = useState<IClientResponse[]>([]);
  const [clientEquipments, setClientEquipments] = useState<IAppointmentEquipmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ clientId: "", date: "", slot: "", notes: "", customTime: "" });
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [available, setAvailable] = useState<AvailabilityDTO[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creatingReportFor, setCreatingReportFor] = useState<string | null>(null);
  const [offAgendaConfirmed, setOffAgendaConfirmed] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [useCustomTime, setUseCustomTime] = useState(false);
  const activeDays: number[] = available
  .filter((a) => a.isActive)
  .map((a) => a.dayOfWeek);
  const selectedDateObj = form.date ? new Date(`${form.date}T00:00:00`) : null;
  const dateIsOffAgenda = !!selectedDateObj && !activeDays.includes(selectedDateObj.getDay());
  const usingCustomTime = useCustomTime || dateIsOffAgenda;
  const scheduledAtISO = (() => {
    if (usingCustomTime) {
      if (!form.date || !form.customTime) return "";
      return new Date(`${form.date}T${form.customTime}:00`).toISOString();
    }
    return form.slot;
  })();
  
  useEffect(() => {
    if (!token) return;
    Promise.all([appointmentService.list(token), clientService.list(token), availabilityService.list(token)])
      .then(([appts, cls, availables]) => { setAppointments(appts); setClients(cls); setAvailable(availables) })
      .catch(() => toast.error("Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !form.clientId) return;
    clientService.findById(token, form.clientId)
      .then(detail => setClientEquipments(detail.equipments))
      .catch(() => setClientEquipments([]));
  }, [token, form.clientId]);

  useEffect(() => {
    if (!provider?.publicToken || !form.date || !token) return;
    const publicToken = provider.publicToken;
    const date = form.date;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setAvailableSlots([]);
      try {
        const { slots } = await availabilityService.getSignUpSlots(publicToken, date);
        setAvailableSlots(slots ?? []);
      } catch {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    void fetchSlots();
  }, [provider?.publicToken, form.date]);

  const closeDialog = () => {
    setOpen(false);
    setForm({ clientId: "", date: "", slot: "", notes: "", customTime: "" });
    setSelectedEquipmentIds([]);
    setAvailableSlots([]);
    setUseCustomTime(false);
    setOffAgendaConfirmed(false);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleCreate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!token || !form.clientId || !scheduledAtISO) return;
    setSubmitting(true);
    try {
      const appt = await appointmentService.create(token, {
        clientId: form.clientId,
        equipmentIds: selectedEquipmentIds.length > 0 ? selectedEquipmentIds : undefined,
        scheduledAt: scheduledAtISO,
        notes: form.notes || undefined,
      });
      setAppointments(prev => [appt, ...prev]);
      closeDialog();
      toast.success("Solicitação criada com sucesso!");
    } catch {
      toast.error("Erro ao criar solicitação");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (appt: IAppointmentInfo, reports: IAppointmentReportInfo[]) => {
    if (!token) return;
    if (reports.length === 0) {
      toast.warning("Crie um laudo para cada equipamento antes de concluir");
      return;
    }
    if (!reports.every(r => r.status === "completed")) {
      toast.warning("Aguarde todos os laudos serem aprovados pelo cliente");
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
    } catch {
      toast.error("Não foi possível concluir");
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
    } catch {
      toast.error("Erro ao cancelar agendamento");
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
    } catch {
      toast.error("Erro ao criar laudo");
    } finally {
      setCreatingReportFor(null);
    }
  };

  const formatSlotTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const filtered = appointments
    .filter(row => filter === "all" || row.appointment.status === filter)
    .sort((a, b) =>
      new Date(b.appointment.scheduledAt).getTime() - new Date(a.appointment.scheduledAt).getTime()
    );


  const hasAnyAvailability = activeDays.length > 0;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1);
  };

  const needsConfirmation = !!form.date && (dateIsOffAgenda || useCustomTime);
  const canSubmit = !!form.clientId && !!scheduledAtISO && (!needsConfirmation || offAgendaConfirmed);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitações</h1>
          <p className="text-gray-500 text-sm">{appointments.length} agendamentos no total</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={() => requireProfile(() => { setOpen(true); })}
        >
          <Plus className="w-4 h-4" /> Nova solicitação
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-blue-600 hover:bg-blue-700" : ""}>
            {FILTER_LABELS[f]}
          </Button>
        ))}
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">Nenhuma solicitação</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === "all"
                ? "Crie uma solicitação ou aguarde clientes agendarem pelo link"
                : `Nenhum agendamento ${FILTER_LABELS[filter].toLowerCase()}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(row => {
            const { appointment: appt, client, equipments, submission, reports } = row;
            const conf = STATUS_CONFIG[appt.status] ?? { label: appt.status, icon: Clock, color: "text-gray-500 bg-gray-50" };
            const Icon = conf.icon;
            const isScheduled = appt.status === "scheduled";
            const isUpcoming = isScheduled && new Date(appt.scheduledAt) >= new Date();
            const canComplete = reports.length > 0 && reports.every(r => r.status === "completed");
            const completeTitle = reports.length === 0
              ? "Crie um laudo para cada equipamento antes de concluir"
              : !canComplete
              ? "Aguarde todos os laudos serem aprovados"
              : "Concluir visita";
            const isExpanded = expanded[appt.id];
            const photos = submission?.photoUrls ?? [];
            const hasSubmissionInfo = submission?.description || photos.length > 0 || submission?.problemType;

            return (
              <Card key={appt.id} className={isUpcoming ? "border-blue-200" : ""}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${conf.color}`}>
                          <Icon className="w-3 h-3" /> {conf.label}
                        </span>
                        {appt.equipmentIds.length === 0 && isScheduled && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full font-medium">
                            <AlertCircle className="w-3 h-3" /> Sem equipamento vinculado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <User className="w-4 h-4 text-gray-400" /> {client.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        {new Date(appt.scheduledAt).toLocaleDateString("pt-BR", {
                          weekday: "long", day: "2-digit", month: "long",
                          year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                      {equipments.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          {equipments.map(eq => {
                            const eqReport = reports.find(r => r.equipmentId === eq.id);
                            return (
                              <div key={eq.id} className="flex items-center gap-2 text-sm text-gray-700">
                                <AirVent className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="font-medium">
                                  {eq.label || EQUIPMENT_TYPE_LABELS[eq.type] || "Equipamento"}
                                </span>
                                {(eq.brand || eq.model) && (
                                  <span className="text-gray-400 text-xs">
                                    {[eq.brand, eq.model].filter(Boolean).join(" ")}
                                  </span>
                                )}
                                {isScheduled && (
                                  eqReport ? (
                                    <Button size="sm" variant="outline" className="text-xs h-6 px-2 ml-1"
                                      onClick={() => navigate(`/dashboard/reports/${eqReport.id}`)}>
                                      <FileText className="w-3 h-3 mr-1" /> Ver laudo
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="outline" className="text-xs h-6 px-2 ml-1"
                                      onClick={() => handleCreateReport(appt, eq.id)}
                                      disabled={creatingReportFor === eq.id}>
                                      {creatingReportFor === eq.id
                                        ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        : <FileText className="w-3 h-3 mr-1" />}
                                      Criar laudo
                                    </Button>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {appt.notes && <p className="text-xs text-gray-400 mt-1">{appt.notes}</p>}
                    </div>

                    {isScheduled && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs"
                          onClick={() => handleComplete(appt, reports)}
                          disabled={!canComplete}
                          title={completeTitle}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Concluir
                        </Button>
                        <Button size="sm" variant="outline"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleCancel(appt.id)}>
                          <XCircle className="w-3 h-3 mr-1" /> Cancelar
                        </Button>
                      </div>
                    )}
                  </div>

                  {hasSubmissionInfo && (
                    <div className="border-t pt-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(p => ({ ...p, [appt.id]: !p[appt.id] }))}
                        className="flex items-center gap-2 text-xs font-medium text-blue-700 hover:text-blue-800"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Informações enviadas pelo cliente
                        {photos.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-gray-500 font-normal">
                            <Camera className="w-3 h-3" /> {photos.length} foto{photos.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {submission?.problemType && (
                            <div className="text-xs">
                              <span className="text-gray-500">Tipo do problema: </span>
                              <span className="font-medium text-gray-800">
                                {PROBLEM_TYPE_LABELS[submission.problemType] || submission.problemType}
                              </span>
                            </div>
                          )}
                          {submission?.description && (
                            <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 whitespace-pre-wrap">
                              {submission.description}
                            </div>
                          )}
                          {photos.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                              {photos.map((url, idx) => (
                                <button key={idx} type="button" onClick={() => setPhotoModal(url)}
                                  className="aspect-square rounded-md overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400 transition-all">
                                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) closeDialog(); else setOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova solicitação</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.clientId}
                onChange={e => { setForm(p => ({ ...p, clientId: e.target.value })); setSelectedEquipmentIds([]); }}
                required
              >
                <option value="">Selecionar cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                ))}
              </select>
            </div>

            {form.clientId && (
              <div className="space-y-2">
                <Label>Equipamentos</Label>
                {clientEquipments.length === 0 ? (
                  <p className="text-xs text-gray-400">Este cliente ainda não tem equipamentos cadastrados.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {clientEquipments.filter(Boolean).map(eq => eq && (
                      <label
                        key={eq.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                          selectedEquipmentIds.includes(eq.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEquipmentIds.includes(eq.id)}
                          onChange={() => setSelectedEquipmentIds(prev =>
                            prev.includes(eq.id) ? prev.filter(x => x !== eq.id) : [...prev, eq.id]
                          )}
                          className="accent-blue-600"
                        />
                        <span className="text-sm text-gray-800">
                          {eq.label || EQUIPMENT_TYPE_LABELS[eq.type] || "Equipamento"}
                          {(eq.brand || eq.model) && (
                            <span className="text-gray-400 ml-1">
                              — {[eq.brand, eq.model].filter(Boolean).join(" ")}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
                <Label>Data *</Label>
                {!hasAnyAvailability ? (
                  <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Você ainda não configurou sua agenda. Acesse sua {" "}
                      <button
                        type="button"
                        onClick={() => { closeDialog(); navigate("/dashboard/availability"); }}
                        className="underline font-medium"
                      >
                        Agenda
                      </button>
                      {" "}para definir os dias e horários de atendimento.
                    </span>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Button type="button" variant="ghost" size="sm" onClick={prevMonth} className="h-7 w-7 p-0">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-gray-700">
                        {MONTH_NAMES[viewMonth]} {viewYear}
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {DAY_NAMES.map(d => (
                        <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstWeekday }, (_, i) => <div key={`e-${i}`} />)}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const d = new Date(viewYear, viewMonth, day);
                        const dateStr = fmtDateLocal(d);
                        const past = d < todayMidnight;
                        const unavailable = !activeDays.includes(d.getDay());
                        const selected = form.date === dateStr;
                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={past}
                            onClick={() => {
                              setForm(p => ({ ...p, date: dateStr, slot: "", customTime: "" }));
                              setOffAgendaConfirmed(false);
                            }}
                            className={`aspect-square rounded-full text-xs font-medium transition-colors flex items-center justify-center ${
                              selected
                                ? unavailable
                                  ? "bg-amber-500 text-white"
                                  : "bg-blue-600 text-white"
                                : past
                                  ? "text-gray-300 cursor-not-allowed"
                                  : unavailable
                                    ? "text-gray-400 bg-gray-50 hover:bg-amber-50 line-through"
                                    : "hover:bg-blue-50 text-gray-700"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>


              {form.date && (
                <div className="space-y-2">
                  <Label>Horário *</Label>
                  {usingCustomTime ? (
                    <Input
                      type="time"
                      value={form.customTime}
                      onChange={e => setForm(p => ({ ...p, customTime: e.target.value }))}
                      required
                    />
                  ) : loadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" /> Buscando horários disponíveis...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">
                      Nenhum horário livre nesse dia. Use a opção <span className="font-medium">Outro horário</span> abaixo.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {availableSlots.map(s => {
                        const selected = form.slot === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setForm(p => ({ ...p, slot: s }))}
                            className={`text-sm py-2 rounded-md border transition-colors ${
                              selected
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                          >
                            {formatSlotTime(s)}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!dateIsOffAgenda && (
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomTime(v => {
                          const next = !v;
                          if (next) setForm(p => ({ ...p, slot: "" }));
                          else { setForm(p => ({ ...p, customTime: "" })); setOffAgendaConfirmed(false); }
                          return next;
                        });
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {useCustomTime ? "← Voltar para horários disponíveis" : "Outro horário (fora da agenda)"}
                    </button>
                  )}

                  {needsConfirmation && (
                    <label className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offAgendaConfirmed}
                        onChange={e => setOffAgendaConfirmed(e.target.checked)}
                        className="mt-0.5 shrink-0 accent-amber-600"
                      />
                      <span>
                        {dateIsOffAgenda
                          ? "Confirmo que normalmente não atendo nesse dia da semana, mas quero agendar mesmo assim."
                          : "Confirmo que esse horário está fora da minha agenda habitual."}
                      </span>
                    </label>
                  )}
                </div>
              )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input placeholder="Ex: manutenção preventiva..." value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!canSubmit}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Criar solicitação
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!photoModal} onOpenChange={() => setPhotoModal(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only"><DialogTitle>Foto</DialogTitle></DialogHeader>
          {photoModal && (
            <img src={photoModal} alt="Foto ampliada" className="w-full h-auto rounded max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
