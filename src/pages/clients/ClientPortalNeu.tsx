import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bell, Wind, Plus, FileText, Calendar, Phone, Mail, ExternalLink, Loader2, AlertCircle, CalendarPlus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  clientService,
  type IClientPortalResponse,
  type IPortalAppointment,
  type IPortalEquipment,
  type IPortalReport,
  type IPortalSubmission,
} from "@/services/client";
import { AddEquipmentDialog } from "./components/AddEquipmentDialog";
import { PortalReportsDialog } from "./components/PortalReportsDialog";

const NEU_BG = "#e4e9f2";
const NEU_SHADOW_OUT = "8px 8px 20px rgba(163, 177, 198, 0.55), -8px -8px 20px rgba(255, 255, 255, 0.95)";
const NEU_SHADOW_OUT_SM = "5px 5px 12px rgba(163, 177, 198, 0.45), -5px -5px 12px rgba(255, 255, 255, 0.9)";
const NEU_SHADOW_OUT_STRONG = "6px 6px 14px rgba(163, 177, 198, 0.6), -6px -6px 14px rgba(255, 255, 255, 0.95)";
const NEU_SHADOW_IN = "inset 4px 4px 10px rgba(163, 177, 198, 0.55), inset -4px -4px 10px rgba(255, 255, 255, 0.9)";
const NEU_SHADOW_PRESSED_SM = "inset 3px 3px 6px rgba(163, 177, 198, 0.55), inset -3px -3px 6px rgba(255, 255, 255, 0.95)";

function NeuCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl p-5 ${className}`} style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}>
      {children}
    </div>
  );
}

function NeuInset({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{ background: NEU_BG, boxShadow: NEU_SHADOW_IN }}>
      {children}
    </div>
  );
}

function NeuIconBox({ children, recessed = false }: { children: React.ReactNode; recessed?: boolean }) {
  return (
    <div
      className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500"
      style={{ background: NEU_BG, boxShadow: recessed ? NEU_SHADOW_PRESSED_SM : NEU_SHADOW_OUT_SM }}
    >
      {children}
    </div>
  );
}

function NeuButton({
  children,
  onClick,
  type = "button",
  accent = false,
  asChild = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  accent?: boolean;
  asChild?: boolean;
}) {
  const cls = `inline-flex items-center gap-1.5 font-medium px-3 py-1.5 text-xs rounded-full transition-all active:scale-[0.98] ${
    accent ? "text-amber-700" : "text-slate-600"
  }`;
  const style = { background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM };
  if (asChild) {
    return (
      <span className={cls} style={style}>
        {children}
      </span>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  );
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "green" | "amber" | "red" }) {
  const colors: Record<string, string> = {
    neutral: "text-slate-500",
    blue: "text-blue-600",
    green: "text-emerald-600",
    amber: "text-amber-700",
    red: "text-red-600",
  };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${colors[tone]}`}
      style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
    >
      {children}
    </span>
  );
}

const APPT_STATUS: Record<string, { label: string; tone: "blue" | "green" | "neutral" | "red" }> = {
  scheduled: { label: "Agendada", tone: "blue" },
  completed: { label: "Concluída", tone: "green" },
  canceled: { label: "Cancelada", tone: "neutral" },
  cancelled: { label: "Cancelada", tone: "red" },
  no_show: { label: "Não compareceu", tone: "red" },
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ---------- Lembrete de manutenção ----------
// Regra simples derivada do contrato real do portal:
// - usa a data do último appointment "completed" como referência de "última manutenção"
// - intervalo padrão de manutenção preventiva: 180 dias
// - severity: "overdue" quando nextDue < hoje · "due_soon" quando faltam ≤ 30 dias
// Equipamentos sem visita registrada NÃO geram alerta (segue critério da task: somente
// "vence em ≤30d" ou "atrasado").
const MAINTENANCE_INTERVAL_DAYS = 180;
const DUE_SOON_WINDOW_DAYS = 30;

type MaintSeverity = "overdue" | "due_soon";

interface MaintenanceAlert {
  equipment: IPortalEquipment;
  lastServiceAt: string;
  nextDueAt: string;
  daysUntilDue: number; // negativo = atrasado em N dias
  severity: MaintSeverity;
}

function computeMaintenanceAlerts(
  equipments: IPortalEquipment[],
  appointments: IPortalAppointment[],
): MaintenanceAlert[] {
  const now = Date.now();
  const dayMs = 86_400_000;

  const lastByEquipment = new Map<string, number>();
  for (const a of appointments) {
    if (a.status !== "completed") continue;
    const t = new Date(a.scheduledAt).getTime();
    if (Number.isNaN(t)) continue;
    for (const eqId of a.equipmentIds) {
      const prev = lastByEquipment.get(eqId);
      if (prev === undefined || t > prev) lastByEquipment.set(eqId, t);
    }
  }

  const alerts: MaintenanceAlert[] = [];
  for (const eq of equipments) {
    const last = lastByEquipment.get(eq.id);
    if (last === undefined) continue; // sem histórico = não dispara aviso
    const nextDueMs = last + MAINTENANCE_INTERVAL_DAYS * dayMs;
    const daysUntilDue = Math.round((nextDueMs - now) / dayMs);
    let severity: MaintSeverity | null = null;
    if (daysUntilDue < 0) severity = "overdue";
    else if (daysUntilDue <= DUE_SOON_WINDOW_DAYS) severity = "due_soon";
    if (!severity) continue;
    alerts.push({
      equipment: eq,
      lastServiceAt: new Date(last).toISOString(),
      nextDueAt: new Date(nextDueMs).toISOString(),
      daysUntilDue,
      severity,
    });
  }

  // Mais urgente primeiro: overdue antes de due_soon; depois mais dias atrasados
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "overdue" ? -1 : 1;
    return a.daysUntilDue - b.daysUntilDue;
  });
}

function maintenanceHeadline(a: MaintenanceAlert): string {
  const eqLabel = a.equipment.label || a.equipment.type || "Equipamento";
  if (a.severity === "overdue") {
    const dias = -a.daysUntilDue;
    return `${eqLabel}: manutenção atrasada há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  }
  return `${eqLabel}: manutenção vence em ${a.daysUntilDue} ${a.daysUntilDue === 1 ? "dia" : "dias"}`;
}

interface MaintenanceAlertCardProps {
  alerts: MaintenanceAlert[];
  publicToken: string;
  clientId: string;
}

function MaintenanceAlertCard({ alerts, publicToken, clientId }: MaintenanceAlertCardProps) {
  if (alerts.length === 0) return null;
  const top = alerts[0];
  const overdueCount = alerts.filter(a => a.severity === "overdue").length;
  const dueSoonCount = alerts.length - overdueCount;
  const tone = top.severity === "overdue" ? "red" : "amber";
  const toneText = tone === "red" ? "text-red-600" : "text-amber-700";

  const scheduleHref = `/providers/${publicToken}/clients/${clientId}/request?equipmentId=${top.equipment.id}`;

  return (
    <NeuCard className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center ${toneText}`}
          style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
        >
          <Bell className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] uppercase tracking-[0.18em] font-semibold ${toneText}`}>
            Aviso de manutenção
          </p>
          <p className="text-sm font-semibold text-slate-700 leading-tight mt-0.5">
            {maintenanceHeadline(top)}
          </p>
        </div>
        <StatusPill tone={tone}>
          {top.severity === "overdue" ? "Atrasada" : "Vence em breve"}
        </StatusPill>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Última manutenção em {fmtDate(top.lastServiceAt)}. Recomendamos um intervalo de{" "}
        {MAINTENANCE_INTERVAL_DAYS} dias entre visitas.
      </p>

      <Link
        to={scheduleHref}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98]"
        style={{
          background: "linear-gradient(145deg, #3b82f6, #2563eb)",
          boxShadow: NEU_SHADOW_OUT_STRONG,
        }}
      >
        <CalendarPlus className="w-3.5 h-3.5" /> Agendar agora
      </Link>

      {alerts.length > 1 && (
        <div
          className="rounded-2xl px-3 py-2 space-y-1.5"
          style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
        >
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            E também
          </p>
          {alerts.slice(1).map(a => (
            <div key={a.equipment.id} className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-600 truncate flex-1">
                {a.equipment.label || a.equipment.type}
              </p>
              <StatusPill tone={a.severity === "overdue" ? "red" : "amber"}>
                {a.severity === "overdue"
                  ? `${-a.daysUntilDue}d atrasada`
                  : `em ${a.daysUntilDue}d`}
              </StatusPill>
            </div>
          ))}
          <p className="text-[10px] text-slate-400 pt-1">
            {overdueCount > 0 && `${overdueCount} atrasada${overdueCount === 1 ? "" : "s"}`}
            {overdueCount > 0 && dueSoonCount > 0 && " · "}
            {dueSoonCount > 0 && `${dueSoonCount} vencendo em ≤30d`}
          </p>
        </div>
      )}
    </NeuCard>
  );
}

interface EquipmentRowProps {
  eq: IPortalEquipment;
  appointments: IPortalAppointment[];
  reports: IPortalReport[];
}

function EquipmentRow({ eq, appointments, reports }: EquipmentRowProps) {
  const eqReports = reports.filter(r => r.equipmentId === eq.id);
  const eqAppts = appointments.filter(a => a.equipmentIds.includes(eq.id));
  const pending = eqReports.filter(r => r.status === "sent").length;
  const eqLabel = eq.label || eq.type || "Equipamento";
  const eqSub = [eq.brand, eq.model].filter(Boolean).join(" · ");

  return (
    <NeuInset className="flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-500 shrink-0"
        style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
      >
        <Wind className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{eqLabel}</p>
        {eqSub && <p className="text-[11px] text-slate-500 mt-0.5">{eqSub}</p>}
        <p className="text-[11px] text-slate-400 mt-1.5">
          {eqAppts.length} visita(s) · {eqReports.length} laudo(s)
        </p>
      </div>
      <div className="relative">
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Ver laudos de ${eqLabel}`}
              className={`inline-flex items-center gap-1.5 font-medium px-3 py-1.5 text-xs rounded-full transition-all active:scale-[0.98] ${
                pending > 0 ? "text-amber-700" : "text-slate-600"
              }`}
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
            >
              <FileText className="w-3 h-3" />
              Laudos
              {pending > 0 && (
                <span
                  className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
                  style={{
                    background: "linear-gradient(145deg, #f59e0b, #d97706)",
                    boxShadow: "2px 2px 4px rgba(163, 177, 198, 0.55), -2px -2px 4px rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {pending}
                </span>
              )}
            </button>
          </DialogTrigger>
          <PortalReportsDialog equipment={eq} reports={eqReports} />
        </Dialog>
        {pending > 0 && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        )}
      </div>
    </NeuInset>
  );
}

interface SubmissionRowProps {
  submission: IPortalSubmission;
  equipments: IPortalEquipment[];
  appointments: IPortalAppointment[];
}

function SubmissionRow({ submission: s, equipments, appointments }: SubmissionRowProps) {
  const eq = s.equipmentId ? equipments.find(e => e.id === s.equipmentId) : null;
  const appt = appointments.find(a => a.submissionId === s.id) ?? null;
  const apptStatus = appt ? APPT_STATUS[appt.status] ?? { label: appt.status, tone: "neutral" as const } : null;
  const eqLabel = eq ? eq.label || eq.type || "Equipamento" : "Solicitação";

  return (
    <NeuInset className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700 truncate">{eqLabel}</p>
        <span className="text-[10px] text-slate-400 shrink-0">{fmtDateTime(s.createdAt)}</span>
      </div>
      {s.description && <p className="text-[11px] text-slate-500 leading-relaxed">{s.description}</p>}
      {appt && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-slate-400">Visita: {fmtDateTime(appt.scheduledAt)}</span>
          {apptStatus && <StatusPill tone={apptStatus.tone}>{apptStatus.label}</StatusPill>}
        </div>
      )}
      {s.photoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {s.photoUrls.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noopener noreferrer">
              <img src={u} alt="" className="rounded-lg w-full h-16 object-cover" style={{ boxShadow: NEU_SHADOW_PRESSED_SM }} />
            </a>
          ))}
        </div>
      )}
    </NeuInset>
  );
}

export function ClientPortalNeu() {
  const { publicToken, id } = useParams<{ publicToken: string; id: string }>();
  const [data, setData] = useState<IClientPortalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addEquipmentOpen, setAddEquipmentOpen] = useState(false);

  const maintenanceAlerts = useMemo(
    () => computeMaintenanceAlerts(data?.equipments ?? [], data?.appointments ?? []),
    [data?.equipments, data?.appointments],
  );

  useEffect(() => {
    if (!publicToken || !id) return;
    setLoading(true);
    clientService
      .getPortal(publicToken, id)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [publicToken, id]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: NEU_BG }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}>
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4" style={{ background: NEU_BG }}>
        <NeuCard className="text-center max-w-sm space-y-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto text-red-500"
            style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
          >
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-slate-700">Código inválido</h1>
          <p className="text-xs text-slate-500">
            O código informado não foi encontrado. Confira com seu prestador de serviço.
          </p>
        </NeuCard>
      </div>
    );
  }

  const { client, provider, equipments, appointments, submissions, reports } = data;
  const pendingReportsCount = reports.filter(r => r.status === "sent").length;
  const upcomingAppointments = [...appointments]
    .filter(a => a.status === "scheduled")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const providerLabel = provider.companyName || provider.name;

  return (
    <div className="min-h-dvh" style={{ background: NEU_BG }}>
      <div className="mx-auto max-w-md p-4 space-y-5 pb-10">
        {/* HERO */}
        <NeuCard className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">Olá,</p>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-blue-600"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
            >
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-700 leading-tight">{client.name}</h1>
          <div className="pt-1">
            <p className="text-xs text-slate-500">
              Atendido por <span className="font-semibold text-slate-700">{providerLabel}</span>
            </p>
            {provider.phone && <p className="text-xs text-slate-400 mt-0.5">{provider.phone}</p>}
          </div>

          {pendingReportsCount > 0 && (
            <div
              className="mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-amber-600"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
              >
                <Bell className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-amber-800 font-medium leading-tight">
                <span className="font-bold">
                  {pendingReportsCount} {pendingReportsCount === 1 ? "laudo" : "laudos"}
                </span>{" "}
                aguardando sua aprovação
              </p>
            </div>
          )}
        </NeuCard>

        {/* MAINTENANCE ALERTS */}
        {publicToken && id && (
          <MaintenanceAlertCard
            alerts={maintenanceAlerts}
            publicToken={publicToken}
            clientId={id}
          />
        )}

        {/* EQUIPMENTS */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-1 pb-3">
            <div className="flex items-center gap-2.5">
              <NeuIconBox>
                <Wind className="w-4 h-4" />
              </NeuIconBox>
              <div>
                <p className="text-sm font-semibold text-slate-700 leading-tight">Meus ar-condicionados</p>
                <p className="text-[11px] text-slate-400">
                  {equipments.length} {equipments.length === 1 ? "aparelho" : "aparelhos"}
                </p>
              </div>
            </div>
            <NeuButton onClick={() => setAddEquipmentOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </NeuButton>
          </div>

          <NeuCard>
            {equipments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-3">Nenhum equipamento cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {equipments.map(eq => (
                  <EquipmentRow key={eq.id} eq={eq} appointments={appointments} reports={reports} />
                ))}
              </div>
            )}
          </NeuCard>
        </div>

        {/* APPOINTMENTS */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-1 pb-3">
            <div className="flex items-center gap-2.5">
              <NeuIconBox>
                <Calendar className="w-4 h-4" />
              </NeuIconBox>
              <div>
                <p className="text-sm font-semibold text-slate-700 leading-tight">Visitas</p>
                <p className="text-[11px] text-slate-400">
                  {upcomingAppointments.length} {upcomingAppointments.length === 1 ? "agendada" : "agendadas"}
                </p>
              </div>
            </div>
            <Link
              to={`/providers/${publicToken}/clients/${id}/request`}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(145deg, #3b82f6, #2563eb)",
                boxShadow: NEU_SHADOW_OUT_STRONG,
              }}
            >
              <Plus className="w-3 h-3" /> Nova visita
            </Link>
          </div>

          <NeuCard>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-3">Nenhuma visita agendada.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map(a => {
                  const eq = a.equipmentIds.length > 0 ? equipments.find(e => e.id === a.equipmentIds[0]) : null;
                  const st = APPT_STATUS[a.status] ?? { label: a.status, tone: "neutral" as const };
                  return (
                    <NeuInset key={a.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-700">{fmtDateTime(a.scheduledAt)}</p>
                        <StatusPill tone={st.tone}>{st.label}</StatusPill>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {eq ? eq.label || eq.type || "Equipamento" : "Sem ar-condicionado vinculado"}
                      </p>
                      {a.notes && <p className="text-[11px] text-slate-400 italic">{a.notes}</p>}
                    </NeuInset>
                  );
                })}
              </div>
            )}
          </NeuCard>
        </div>

        {/* SUBMISSIONS */}
        {sortedSubmissions.length > 0 && (
          <NeuCard className="space-y-4">
            <div className="flex items-center gap-2.5">
              <NeuIconBox recessed>
                <ExternalLink className="w-4 h-4" />
              </NeuIconBox>
              <div>
                <p className="text-sm font-semibold text-slate-700 leading-tight">Minhas solicitações</p>
                <p className="text-[11px] text-slate-400">
                  {sortedSubmissions.length} {sortedSubmissions.length === 1 ? "registrada" : "registradas"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {sortedSubmissions.map(s => (
                <SubmissionRow key={s.id} submission={s} equipments={equipments} appointments={appointments} />
              ))}
            </div>
          </NeuCard>
        )}

        {/* FOOTER */}
        <div className="pt-4 pb-2 text-center space-y-2">
          {provider.phone && (
            <div
              className="inline-flex items-center gap-2 text-[11px] text-slate-500 px-3 py-1.5 rounded-full"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
            >
              <Phone className="w-3 h-3" /> {provider.phone}
            </div>
          )}
          {provider.email && (
            <div className="block">
              <div
                className="inline-flex items-center gap-2 text-[11px] text-slate-500 px-3 py-1.5 rounded-full"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
              >
                <Mail className="w-3 h-3" /> {provider.email}
              </div>
            </div>
          )}
        </div>
      </div>

      {publicToken && id && (
        <AddEquipmentDialog
          open={addEquipmentOpen}
          onClose={() => setAddEquipmentOpen(false)}
          publicToken={publicToken}
          clientId={id}
          onAdded={eq => setData(prev => (prev ? { ...prev, equipments: [...prev.equipments, eq] } : prev))}
        />
      )}
    </div>
  );
}

export default ClientPortalNeu;
