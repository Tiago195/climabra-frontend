import { Droplets, Wrench, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { CLIENTS, EQUIPMENTS, PROVIDER, TODAY, EQUIPMENT_TYPE_LABELS } from "../agenda-turnos/_shared";

export { CLIENTS, EQUIPMENTS, PROVIDER, TODAY, EQUIPMENT_TYPE_LABELS };

// ---------- Tipos ----------
export type MaintenanceKind = "cleaning" | "preventive" | "sanitization" | "gas";

export type Severity = "ok" | "due_soon" | "overdue" | "never";

export interface MaintenanceEvent {
  id: string;
  equipmentId: string;
  kind: MaintenanceKind;
  doneAt: string; // YYYY-MM-DD
  technicianName: string;
  notes?: string;
}

export interface MaintenanceStatus {
  kind: MaintenanceKind;
  lastDoneAt: string | null;
  nextDueAt: string | null;
  daysOverdue: number | null; // >0 = atrasado · ≤0 = faltam X dias · null = nunca feito
  severity: Severity;
}

// ---------- Constantes ----------
export const MAINTENANCE_KINDS: MaintenanceKind[] = ["cleaning", "preventive", "sanitization", "gas"];

export const MAINTENANCE_INTERVALS_DAYS: Record<MaintenanceKind, number> = {
  cleaning: 90,
  preventive: 180,
  sanitization: 365,
  gas: 365,
};

export const MAINTENANCE_LABELS: Record<MaintenanceKind, string> = {
  cleaning: "Limpeza de filtros",
  preventive: "Manut. preventiva",
  sanitization: "Higienização",
  gas: "Gás / elétrica",
};

export const MAINTENANCE_LABELS_SHORT: Record<MaintenanceKind, string> = {
  cleaning: "Limpeza",
  preventive: "Preventiva",
  sanitization: "Higien.",
  gas: "Gás",
};

export const MAINTENANCE_ICONS: Record<MaintenanceKind, LucideIcon> = {
  cleaning: Droplets,
  preventive: Wrench,
  sanitization: ShieldCheck,
  gas: Zap,
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  ok: "em dia",
  due_soon: "vence em breve",
  overdue: "atrasado",
  never: "nunca feito",
};

export const SEVERITY_COLORS: Record<Severity, { dot: string; chip: string; border: string; text: string }> = {
  ok:       { dot: "bg-green-500",  chip: "bg-green-50 text-green-700",   border: "border-green-200",  text: "text-green-700" },
  due_soon: { dot: "bg-amber-500",  chip: "bg-amber-50 text-amber-700",   border: "border-amber-200",  text: "text-amber-700" },
  overdue:  { dot: "bg-red-500",    chip: "bg-red-50 text-red-700",       border: "border-red-200",    text: "text-red-700" },
  never:    { dot: "bg-gray-300",   chip: "bg-gray-100 text-gray-600",    border: "border-gray-200",   text: "text-gray-600" },
};

// ---------- Helpers de data ----------
function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}
export function daysBetween(fromISO: string, toISO_: string): number {
  const ms = parseISO(toISO_).getTime() - parseISO(fromISO).getTime();
  return Math.round(ms / 86_400_000);
}
export function formatRelative(daysOverdue: number | null): string {
  if (daysOverdue === null) return "—";
  if (daysOverdue > 0) return `há ${daysOverdue}d`;
  if (daysOverdue === 0) return "hoje";
  return `em ${-daysOverdue}d`;
}
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

// ---------- Mock: histórico por equipamento ----------
// today = 2026-05-26. Geramos `lastDoneAt` derivado das severidades desejadas.
// negativo no offset = data passada; null = nunca feito.
type SeverityPlan = Record<MaintenanceKind, number | null>;
// regra:
//   null            → never
//   offset positivo → daysOverdue = offset (atrasado)
//   offset 0..-30   → due_soon (vence em ≤30d)
//   offset < -30    → ok
const PLAN: Record<string, SeverityPlan> = {
  e1:  { cleaning:  25, preventive: -60, sanitization: null, gas: -200 }, // 1 atrasado · nunca higien.
  e2:  { cleaning:  10, preventive:   5, sanitization: -120, gas: null }, // atrasado/quase
  e3:  { cleaning:  60, preventive: null, sanitization:  90, gas: 200 },  // 3 atrasados — crítico
  e4:  { cleaning: -40, preventive: -10, sanitization: -200, gas: -150 }, // todo em dia, preventiva quase
  e5:  { cleaning: -50, preventive: -90, sanitization: -15, gas: null },  // higien. quase vencer
  e7:  { cleaning: null, preventive: null, sanitization: null, gas: null }, // novinho — nunca feito
  e8:  { cleaning:   5, preventive: -45, sanitization: -100, gas: -25 },  // limpeza atrasada/gás quase
  e9:  { cleaning: -20, preventive:  30, sanitization: null, gas: -100 }, // preventiva atrasada
};

const TECHS = ["João C.", "Marcos L.", "Patrícia R.", "Diego S."];

function lastDoneFromOffset(kind: MaintenanceKind, offset: number | null): string | null {
  if (offset === null) return null;
  // nextDue = lastDone + interval ; daysOverdue = today - nextDue = offset
  // ⇒ lastDone = today - interval - offset
  return addDays(TODAY, -MAINTENANCE_INTERVALS_DAYS[kind] - offset);
}

export const EQUIPMENT_HISTORY: MaintenanceEvent[] = (() => {
  const out: MaintenanceEvent[] = [];
  let idCounter = 1;
  Object.entries(PLAN).forEach(([eqId, plan]) => {
    MAINTENANCE_KINDS.forEach(kind => {
      const lastDone = lastDoneFromOffset(kind, plan[kind]);
      if (!lastDone) return;
      // evento mais recente
      out.push({
        id: `ev-${idCounter++}`,
        equipmentId: eqId,
        kind,
        doneAt: lastDone,
        technicianName: TECHS[idCounter % TECHS.length],
      });
      // ocasionalmente, um evento anterior (1 ciclo antes) para encher a timeline
      if (idCounter % 2 === 0) {
        out.push({
          id: `ev-${idCounter++}`,
          equipmentId: eqId,
          kind,
          doneAt: addDays(lastDone, -MAINTENANCE_INTERVALS_DAYS[kind]),
          technicianName: TECHS[(idCounter + 1) % TECHS.length],
        });
      }
    });
  });
  return out;
})();

// só inclui equipamentos que têm "plano" (8 de 12)
export const TRACKED_EQUIPMENT_IDS = Object.keys(PLAN);
export const TRACKED_EQUIPMENTS = EQUIPMENTS.filter(e => TRACKED_EQUIPMENT_IDS.includes(e.id));

// ---------- Helpers de status ----------
export function severityOf(daysOverdue: number | null): Severity {
  if (daysOverdue === null) return "never";
  if (daysOverdue > 0) return "overdue";
  if (daysOverdue >= -30) return "due_soon";
  return "ok";
}

export function eventsFor(equipmentId: string, kind?: MaintenanceKind): MaintenanceEvent[] {
  return EQUIPMENT_HISTORY
    .filter(e => e.equipmentId === equipmentId && (!kind || e.kind === kind))
    .sort((a, b) => b.doneAt.localeCompare(a.doneAt));
}

export function statusFor(equipmentId: string, kind: MaintenanceKind): MaintenanceStatus {
  const last = eventsFor(equipmentId, kind)[0]?.doneAt ?? null;
  if (!last) {
    return { kind, lastDoneAt: null, nextDueAt: null, daysOverdue: null, severity: "never" };
  }
  const nextDueAt = addDays(last, MAINTENANCE_INTERVALS_DAYS[kind]);
  const daysOverdue = daysBetween(nextDueAt, TODAY); // se today > nextDue → positivo
  return { kind, lastDoneAt: last, nextDueAt, daysOverdue, severity: severityOf(daysOverdue) };
}

export function computeAllStatus(equipmentId: string): MaintenanceStatus[] {
  return MAINTENANCE_KINDS.map(k => statusFor(equipmentId, k));
}

const SEVERITY_RANK: Record<Severity, number> = { overdue: 3, never: 2, due_soon: 1, ok: 0 };

export function worstSeverity(statuses: MaintenanceStatus[]): Severity {
  return statuses.reduce<Severity>((acc, s) => SEVERITY_RANK[s.severity] > SEVERITY_RANK[acc] ? s.severity : acc, "ok");
}

export function mostCritical(statuses: MaintenanceStatus[]): MaintenanceStatus {
  return [...statuses].sort((a, b) => {
    const r = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (r !== 0) return r;
    return (b.daysOverdue ?? -9999) - (a.daysOverdue ?? -9999);
  })[0];
}

export function clientById(id: string) {
  return CLIENTS.find(c => c.id === id);
}

// ---------- Shells ----------
export function MockupShellWide({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        <header>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{subtitle}</p>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </header>
        {children}
      </div>
    </div>
  );
}
