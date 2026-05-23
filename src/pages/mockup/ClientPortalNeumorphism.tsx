import { Bell, Wind, Plus, FileText, Calendar, Phone, Mail, ExternalLink } from "lucide-react";

const NEU_BG = "#e4e9f2";
const NEU_SHADOW_OUT =
  "8px 8px 20px rgba(163, 177, 198, 0.55), -8px -8px 20px rgba(255, 255, 255, 0.95)";
const NEU_SHADOW_OUT_SM =
  "5px 5px 12px rgba(163, 177, 198, 0.45), -5px -5px 12px rgba(255, 255, 255, 0.9)";
const NEU_SHADOW_IN =
  "inset 4px 4px 10px rgba(163, 177, 198, 0.55), inset -4px -4px 10px rgba(255, 255, 255, 0.9)";
const NEU_SHADOW_PRESSED_SM =
  "inset 3px 3px 6px rgba(163, 177, 198, 0.55), inset -3px -3px 6px rgba(255, 255, 255, 0.95)";

const mock = {
  client: { name: "Marina Albuquerque" },
  provider: { companyName: "FrioBem Climatização", phone: "(11) 99876-5432", email: "contato@friobem.com.br" },
  equipments: [
    { id: "1", label: "Sala de estar", brand: "LG", model: "DualCool 12000 BTU", visits: 4, reports: 3, pending: 1 },
    { id: "2", label: "Quarto principal", brand: "Samsung", model: "WindFree 9000 BTU", visits: 2, reports: 2, pending: 0 },
    { id: "3", label: "Home office", brand: "Electrolux", model: "Inverter 12000 BTU", visits: 1, reports: 1, pending: 0 },
  ],
  appointments: [
    { id: "a1", date: "28/05 às 14:00", equipment: "Sala de estar", status: "Agendada", notes: "Limpeza completa + checagem de gás" },
    { id: "a2", date: "02/06 às 09:30", equipment: "Home office", status: "Agendada", notes: null },
  ],
  submissions: [
    { id: "s1", equipment: "Sala de estar", createdAt: "21/05 às 10:12", description: "Está fazendo barulho ao ligar e pingando água.", visitDate: "28/05 às 14:00", visitStatus: "Agendada" },
  ],
  pendingReportsCount: 1,
};

function NeuCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl p-5 ${className}`}
      style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}
    >
      {children}
    </div>
  );
}

function NeuInset({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{ background: NEU_BG, boxShadow: NEU_SHADOW_IN }}
    >
      {children}
    </div>
  );
}

function NeuButton({
  children,
  variant = "default",
  size = "md",
  accent = false,
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "ghost";
  size?: "sm" | "md";
  accent?: boolean;
}) {
  const padding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const radius = size === "sm" ? "rounded-full" : "rounded-2xl";
  const baseColor =
    variant === "primary"
      ? "text-blue-600"
      : accent
      ? "text-amber-700"
      : "text-slate-600";
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 font-medium ${padding} ${radius} ${baseColor} transition-all active:scale-[0.98]`}
      style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
    >
      {children}
    </button>
  );
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "green" | "amber" }) {
  const colors: Record<string, string> = {
    neutral: "text-slate-500",
    blue: "text-blue-600",
    green: "text-emerald-600",
    amber: "text-amber-700",
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

export function ClientPortalNeumorphism() {
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
          <h1 className="text-2xl font-bold text-slate-700 leading-tight">{mock.client.name}</h1>
          <div className="pt-1">
            <p className="text-xs text-slate-500">
              Atendido por <span className="font-semibold text-slate-700">{mock.provider.companyName}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{mock.provider.phone}</p>
          </div>

          {mock.pendingReportsCount > 0 && (
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
                <span className="font-bold">{mock.pendingReportsCount} laudo</span> aguardando sua aprovação
              </p>
            </div>
          )}
        </NeuCard>

        {/* EQUIPMENTS */}
        <div className="relative pt-2">
          <div className="flex items-center justify-between px-1 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
              >
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 leading-tight">Meus ar-condicionados</p>
                <p className="text-[11px] text-slate-400">{mock.equipments.length} aparelhos</p>
              </div>
            </div>
            <NeuButton size="sm">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </NeuButton>
          </div>

        <NeuCard className="space-y-4">
          <div className="space-y-3">
            {mock.equipments.map((eq) => (
              <NeuInset key={eq.id} className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-500 shrink-0"
                  style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
                >
                  <Wind className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{eq.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {eq.brand} · {eq.model}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {eq.visits} visita(s) · {eq.reports} laudo(s)
                  </p>
                </div>
                <div className="relative">
                  <NeuButton size="sm" accent={eq.pending > 0}>
                    <FileText className="w-3 h-3" />
                    Laudos
                    {eq.pending > 0 && (
                      <span
                        className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
                        style={{
                          background: "linear-gradient(145deg, #f59e0b, #d97706)",
                          boxShadow: "2px 2px 4px rgba(163, 177, 198, 0.55), -2px -2px 4px rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        {eq.pending}
                      </span>
                    )}
                  </NeuButton>
                  {eq.pending > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                  )}
                </div>
              </NeuInset>
            ))}
          </div>
        </NeuCard>
        </div>

        {/* APPOINTMENTS */}
        <div className="relative pt-2">
          <div className="flex items-center justify-between px-1 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
              >
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 leading-tight">Visitas</p>
                <p className="text-[11px] text-slate-400">{mock.appointments.length} agendadas</p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(145deg, #3b82f6, #2563eb)",
                boxShadow:
                  "6px 6px 14px rgba(163, 177, 198, 0.6), -6px -6px 14px rgba(255, 255, 255, 0.95)",
              }}
            >
              <Plus className="w-3 h-3" /> Nova visita
            </button>
          </div>

          <NeuCard>
            <div className="space-y-3">
              {mock.appointments.map((a) => (
                <NeuInset key={a.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">{a.date}</p>
                    <StatusPill tone="blue">{a.status}</StatusPill>
                  </div>
                  <p className="text-[11px] text-slate-500">{a.equipment}</p>
                  {a.notes && <p className="text-[11px] text-slate-400 italic">{a.notes}</p>}
                </NeuInset>
              ))}
            </div>
          </NeuCard>
        </div>

        {/* SUBMISSIONS */}
        <NeuCard className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
            >
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 leading-tight">Minhas solicitações</p>
              <p className="text-[11px] text-slate-400">{mock.submissions.length} em andamento</p>
            </div>
          </div>

          <div className="space-y-3">
            {mock.submissions.map((s) => (
              <NeuInset key={s.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700">{s.equipment}</p>
                  <span className="text-[10px] text-slate-400 shrink-0">{s.createdAt}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{s.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400">Visita: {s.visitDate}</span>
                  <StatusPill tone="blue">{s.visitStatus}</StatusPill>
                </div>
              </NeuInset>
            ))}
          </div>
        </NeuCard>

        {/* FOOTER */}
        <div className="pt-4 pb-2 text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 px-3 py-1.5 rounded-full"
            style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}>
            <Phone className="w-3 h-3" /> {mock.provider.phone}
          </div>
          <div className="block">
            <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 px-3 py-1.5 rounded-full"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}>
              <Mail className="w-3 h-3" /> {mock.provider.email}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientPortalNeumorphism;
