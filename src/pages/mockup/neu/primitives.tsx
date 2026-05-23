import type { ReactNode } from "react";

export const NEU_BG = "#e4e9f2";
export const NEU_SHADOW_OUT =
  "8px 8px 20px rgba(163, 177, 198, 0.55), -8px -8px 20px rgba(255, 255, 255, 0.95)";
export const NEU_SHADOW_OUT_SM =
  "5px 5px 12px rgba(163, 177, 198, 0.45), -5px -5px 12px rgba(255, 255, 255, 0.9)";
export const NEU_SHADOW_IN =
  "inset 4px 4px 10px rgba(163, 177, 198, 0.55), inset -4px -4px 10px rgba(255, 255, 255, 0.9)";
export const NEU_SHADOW_PRESSED_SM =
  "inset 3px 3px 6px rgba(163, 177, 198, 0.55), inset -3px -3px 6px rgba(255, 255, 255, 0.95)";

export const PRIMARY_GRADIENT = "linear-gradient(145deg, #3b82f6, #2563eb)";
export const PRIMARY_SHADOW =
  "6px 6px 14px rgba(163, 177, 198, 0.6), -6px -6px 14px rgba(255, 255, 255, 0.95)";

export const mock = {
  client: { name: "Marina Albuquerque" },
  provider: {
    companyName: "FrioBem Climatização",
    phone: "(11) 99876-5432",
    email: "contato@friobem.com.br",
  },
  equipments: [
    { id: "1", label: "Sala de estar", brand: "LG", model: "DualCool 12000 BTU", visits: 4, reports: 3, pending: 1 },
    { id: "2", label: "Quarto principal", brand: "Samsung", model: "WindFree 9000 BTU", visits: 2, reports: 2, pending: 0 },
    { id: "3", label: "Home office", brand: "Electrolux", model: "Inverter 12000 BTU", visits: 1, reports: 1, pending: 0 },
    { id: "4", label: "Cozinha", brand: "Midea", model: "Xtreme Save 9000 BTU", visits: 1, reports: 0, pending: 0 },
  ],
  appointments: [
    { id: "a1", date: "28/05 às 14:00", equipment: "Sala de estar", status: "Agendada", notes: "Limpeza completa + checagem de gás" },
    { id: "a2", date: "02/06 às 09:30", equipment: "Home office", status: "Agendada", notes: null as string | null },
    { id: "a3", date: "15/06 às 10:00", equipment: "Quarto principal", status: "Pendente", notes: "Aguardando confirmação do horário" },
  ],
  submissions: [
    { id: "s1", equipment: "Sala de estar", createdAt: "21/05 às 10:12", description: "Está fazendo barulho ao ligar e pingando água.", visitDate: "28/05 às 14:00", visitStatus: "Agendada" },
    { id: "s2", equipment: "Cozinha", createdAt: "19/05 às 16:40", description: "Não está gelando como antes.", visitDate: "—", visitStatus: "Em análise" },
  ],
  pendingReportsCount: 1,
};

export function NeuCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl p-6 ${className}`} style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}>
      {children}
    </div>
  );
}

export function NeuInset({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{ background: NEU_BG, boxShadow: NEU_SHADOW_IN }}>
      {children}
    </div>
  );
}

export function NeuRaisedSm({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}>
      {children}
    </div>
  );
}

export function NeuButton({
  children,
  size = "md",
  accent = false,
}: {
  children: ReactNode;
  size?: "sm" | "md";
  accent?: boolean;
}) {
  const padding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const radius = size === "sm" ? "rounded-full" : "rounded-2xl";
  const color = accent ? "text-amber-700" : "text-slate-600";
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 font-medium ${padding} ${radius} ${color} transition-all active:scale-[0.98]`}
      style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
    >
      {children}
    </button>
  );
}

export function NeuPrimaryButton({ children, size = "md" }: { children: ReactNode; size?: "sm" | "md" }) {
  const padding = size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full ${padding} font-semibold text-white transition-all active:scale-[0.98]`}
      style={{ background: PRIMARY_GRADIENT, boxShadow: PRIMARY_SHADOW }}
    >
      {children}
    </button>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber";
}) {
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

export function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500"
          style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 leading-tight">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
