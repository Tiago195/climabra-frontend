import { Sun, Sunset, Moon } from "lucide-react";

export type Shift = "morning" | "afternoon" | "night";
export type ApptStatus = "scheduled" | "completed" | "canceled" | "no_show";
export type ReportStatus = "draft" | "sent" | "approved" | "completed";

export const SHIFT_LABELS: Record<Shift, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
};

export const SHIFT_TIMES: Record<Shift, string> = {
  morning: "08:00 – 12:00",
  afternoon: "13:00 – 18:00",
  night: "18:00 – 22:00",
};

export const SHIFT_ICONS = {
  morning: Sun,
  afternoon: Sunset,
  night: Moon,
};

export const SHIFT_COLORS: Record<Shift, { bg: string; text: string; ring: string; chip: string }> = {
  morning:   { bg: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200",  chip: "bg-amber-100 text-amber-800" },
  afternoon: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", chip: "bg-orange-100 text-orange-800" },
  night:     { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", chip: "bg-indigo-100 text-indigo-800" },
};

export interface MockEquipment {
  id: string;
  clientId: string;
  type: "split" | "janela" | "cassete" | "piso_teto" | "central" | "portatil";
  brand: string;
  model: string;
  label: string;
}

export interface MockClient {
  id: string;
  name: string;
  phone: string;
  street: string;
  number: number;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
}

export interface MockAppointment {
  id: string;
  clientId: string;
  equipmentIds: string[];
  scheduledDate: string; // YYYY-MM-DD
  shift: Shift;
  status: ApptStatus;
  notes?: string;
  submission?: { description: string; problemType?: string; photoCount?: number };
  reports: { id: string; equipmentId: string; status: ReportStatus }[];
}

export interface MockSlot {
  shift: Shift;
  startTime: string;
  endTime: string;
  capacity: number;
  available: number;
  blocked: boolean;
}

export interface MockAvailability {
  dayOfWeek: number; // 0-6
  shift: Shift;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
}

export interface MockException {
  id: string;
  startDate: string;
  endDate: string;
  shifts: Shift[]; // empty = dia inteiro
  reason: string;
}

// Provider base = ponto central (Centro de São Paulo)
export const PROVIDER = {
  id: "prov-1",
  name: "João Climatec",
  companyName: "ClimaTec Refrigeração",
  phone: "(11) 98765-4321",
  email: "joao@climatec.com.br",
  baseAddress: "Rua Augusta, 1500 — Consolação, São Paulo/SP",
  lat: -23.5557,
  lng: -46.6614,
};

export const CLIENTS: MockClient[] = [
  { id: "c1", name: "Ana Beatriz Souza",   phone: "(11) 9 1234-1001", street: "R. Augusta",       number: 1820, neighborhood: "Consolação", city: "São Paulo", lat: -23.5572, lng: -46.6620 },
  { id: "c2", name: "Bruno Almeida",       phone: "(11) 9 1234-1002", street: "R. Haddock Lobo",  number:  450, neighborhood: "Cerqueira César", city: "São Paulo", lat: -23.5618, lng: -46.6675 },
  { id: "c3", name: "Carla Mendes",        phone: "(11) 9 1234-1003", street: "Av. Paulista",     number: 2200, neighborhood: "Bela Vista",  city: "São Paulo", lat: -23.5631, lng: -46.6544 },
  { id: "c4", name: "Diego Ramos",         phone: "(11) 9 1234-1004", street: "R. Oscar Freire",  number:  900, neighborhood: "Jardins",     city: "São Paulo", lat: -23.5641, lng: -46.6712 },
  { id: "c5", name: "Eliana Tavares",      phone: "(11) 9 1234-1005", street: "R. Pamplona",      number:  600, neighborhood: "Jardins",     city: "São Paulo", lat: -23.5689, lng: -46.6580 },
  { id: "c6", name: "Felipe Carvalho",     phone: "(11) 9 1234-1006", street: "Av. Brigadeiro",   number: 1700, neighborhood: "Jardim Paulista", city: "São Paulo", lat: -23.5750, lng: -46.6520 },
  { id: "c7", name: "Gabriela Pinto",      phone: "(11) 9 1234-1007", street: "R. Estados Unidos", number: 320, neighborhood: "Jardins",     city: "São Paulo", lat: -23.5703, lng: -46.6690 },
  { id: "c8", name: "Henrique Lima",       phone: "(11) 9 1234-1008", street: "R. dos Pinheiros", number: 880,  neighborhood: "Pinheiros",   city: "São Paulo", lat: -23.5640, lng: -46.6900 },
];

export const EQUIPMENTS: MockEquipment[] = [
  { id: "e1",  clientId: "c1", type: "split",    brand: "LG",        model: "DualCool 12k", label: "Sala" },
  { id: "e2",  clientId: "c1", type: "split",    brand: "LG",        model: "DualCool 9k",  label: "Quarto" },
  { id: "e3",  clientId: "c2", type: "janela",   brand: "Consul",    model: "CCB07",        label: "Escritório" },
  { id: "e4",  clientId: "c3", type: "central",  brand: "Daikin",    model: "VRV-IV",       label: "Recepção" },
  { id: "e5",  clientId: "c3", type: "cassete",  brand: "Daikin",    model: "FXFQ",         label: "Reunião 1" },
  { id: "e6",  clientId: "c3", type: "cassete",  brand: "Daikin",    model: "FXFQ",         label: "Reunião 2" },
  { id: "e7",  clientId: "c4", type: "split",    brand: "Samsung",   model: "WindFree",     label: "Sala" },
  { id: "e8",  clientId: "c5", type: "piso_teto",brand: "Springer",  model: "Maxiflex 36k", label: "Loja" },
  { id: "e9",  clientId: "c6", type: "split",    brand: "Electrolux",model: "EI09R",        label: "Suíte" },
  { id: "e10", clientId: "c6", type: "split",    brand: "Electrolux",model: "EI09R",        label: "Quarto 2" },
  { id: "e11", clientId: "c7", type: "portatil", brand: "Philco",    model: "PAC12000",     label: "Home office" },
  { id: "e12", clientId: "c8", type: "split",    brand: "Midea",     model: "Xtreme 18k",   label: "Sala" },
];

// Datas de referência centradas em 2026-05-26 (today)
export const TODAY = "2026-05-26";

export const APPOINTMENTS: MockAppointment[] = [
  // HOJE — terça 26/05 (parcialmente em andamento, mix de estados de laudo)
  {
    id: "a1", clientId: "c1", equipmentIds: ["e1", "e2"],
    scheduledDate: "2026-05-26", shift: "morning", status: "scheduled",
    notes: "Cliente preferiu manhã cedo",
    submission: { description: "Os dois aparelhos param de gelar depois de 1h ligados.", problemType: "nao_gela", photoCount: 3 },
    reports: [
      { id: "r1a", equipmentId: "e1", status: "completed" },
      { id: "r1b", equipmentId: "e2", status: "draft" },
    ],
  },
  {
    id: "a2", clientId: "c3", equipmentIds: ["e4", "e5", "e6"],
    scheduledDate: "2026-05-26", shift: "afternoon", status: "scheduled",
    notes: "Empresa — entrada pelo subsolo",
    submission: { description: "Manutenção preventiva trimestral dos 3 equipamentos.", problemType: "manutencao", photoCount: 0 },
    reports: [
      { id: "r2a", equipmentId: "e4", status: "completed" },
      { id: "r2b", equipmentId: "e5", status: "completed" },
      { id: "r2c", equipmentId: "e6", status: "completed" },
    ], // todos completos → "Concluir" habilita
  },
  {
    id: "a3", clientId: "c2", equipmentIds: ["e3"],
    scheduledDate: "2026-05-26", shift: "afternoon", status: "scheduled",
    submission: { description: "Aparelho fazendo barulho alto ao ligar.", problemType: "barulho", photoCount: 2 },
    reports: [],
  },
  // QUARTA 27/05
  {
    id: "a4", clientId: "c4", equipmentIds: ["e7"],
    scheduledDate: "2026-05-27", shift: "morning", status: "scheduled",
    reports: [{ id: "r4", equipmentId: "e7", status: "sent" }],
  },
  {
    id: "a5", clientId: "c5", equipmentIds: ["e8"],
    scheduledDate: "2026-05-27", shift: "afternoon", status: "scheduled",
    submission: { description: "Vazando água pela parte da frente.", problemType: "vazamento", photoCount: 4 },
    reports: [{ id: "r5", equipmentId: "e8", status: "approved" }],
  },
  {
    id: "a6", clientId: "c8", equipmentIds: ["e12"],
    scheduledDate: "2026-05-27", shift: "night", status: "scheduled",
    notes: "Cliente só pode após 19h",
    reports: [],
  },
  // QUINTA 28/05
  {
    id: "a7", clientId: "c6", equipmentIds: ["e9", "e10"],
    scheduledDate: "2026-05-28", shift: "morning", status: "scheduled",
    reports: [
      { id: "r7a", equipmentId: "e9", status: "completed" },
      { id: "r7b", equipmentId: "e10", status: "draft" },
    ],
  },
  {
    id: "a8", clientId: "c7", equipmentIds: ["e11"],
    scheduledDate: "2026-05-28", shift: "afternoon", status: "scheduled",
    reports: [],
  },
  // SEXTA 29/05 + futuro "depois"
  {
    id: "a12", clientId: "c7", equipmentIds: ["e11"],
    scheduledDate: "2026-05-29", shift: "morning", status: "scheduled",
    submission: { description: "Aparelho novo precisa de instalação.", problemType: "instalacao", photoCount: 1 },
    reports: [],
  },
  {
    id: "a13", clientId: "c8", equipmentIds: ["e12"],
    scheduledDate: "2026-05-30", shift: "morning", status: "scheduled",
    notes: "Sábado pela manhã",
    reports: [],
  },
  {
    id: "a14", clientId: "c5", equipmentIds: ["e8"],
    scheduledDate: "2026-06-01", shift: "afternoon", status: "scheduled",
    reports: [],
  },
  {
    id: "a15", clientId: "c1", equipmentIds: ["e1", "e2"],
    scheduledDate: "2026-06-02", shift: "night", status: "scheduled",
    notes: "Após expediente do cliente",
    reports: [],
  },
  // PASSADO
  {
    id: "a9", clientId: "c1", equipmentIds: ["e1"],
    scheduledDate: "2026-05-19", shift: "morning", status: "completed",
    reports: [{ id: "r9", equipmentId: "e1", status: "completed" }],
  },
  {
    id: "a10", clientId: "c4", equipmentIds: ["e7"],
    scheduledDate: "2026-05-15", shift: "afternoon", status: "completed",
    reports: [{ id: "r10", equipmentId: "e7", status: "completed" }],
  },
  {
    id: "a11", clientId: "c2", equipmentIds: ["e3"],
    scheduledDate: "2026-05-12", shift: "morning", status: "canceled",
    reports: [],
  },
];

// Pode marcar visita como concluída quando há um laudo por equipamento e todos estão completed
export function canConclude(a: MockAppointment): boolean {
  if (a.equipmentIds.length === 0) return false;
  if (a.reports.length < a.equipmentIds.length) return false;
  return a.equipmentIds.every(eqId =>
    a.reports.some(r => r.equipmentId === eqId && r.status === "completed")
  );
}

export function reportForEquipment(a: MockAppointment, equipmentId: string) {
  return a.reports.find(r => r.equipmentId === equipmentId);
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  completed: "Concluído",
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  approved: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-700",
};

// Agenda configurada: seg–sex 3 turnos, sáb só manhã, dom inativo
export const AVAILABILITY: MockAvailability[] = [
  // Segunda
  { dayOfWeek: 1, shift: "morning",   startTime: "08:00", endTime: "12:00", capacity: 3, isActive: true },
  { dayOfWeek: 1, shift: "afternoon", startTime: "13:00", endTime: "18:00", capacity: 5, isActive: true },
  { dayOfWeek: 1, shift: "night",     startTime: "18:00", endTime: "22:00", capacity: 2, isActive: true },
  // Terça
  { dayOfWeek: 2, shift: "morning",   startTime: "08:00", endTime: "12:00", capacity: 3, isActive: true },
  { dayOfWeek: 2, shift: "afternoon", startTime: "13:00", endTime: "18:00", capacity: 5, isActive: true },
  { dayOfWeek: 2, shift: "night",     startTime: "18:00", endTime: "22:00", capacity: 2, isActive: true },
  // Quarta
  { dayOfWeek: 3, shift: "morning",   startTime: "08:00", endTime: "12:00", capacity: 3, isActive: true },
  { dayOfWeek: 3, shift: "afternoon", startTime: "13:00", endTime: "18:00", capacity: 5, isActive: true },
  { dayOfWeek: 3, shift: "night",     startTime: "18:00", endTime: "22:00", capacity: 2, isActive: true },
  // Quinta
  { dayOfWeek: 4, shift: "morning",   startTime: "08:00", endTime: "12:00", capacity: 3, isActive: true },
  { dayOfWeek: 4, shift: "afternoon", startTime: "13:00", endTime: "18:00", capacity: 5, isActive: true },
  { dayOfWeek: 4, shift: "night",     startTime: "18:00", endTime: "22:00", capacity: 2, isActive: true },
  // Sexta
  { dayOfWeek: 5, shift: "morning",   startTime: "08:00", endTime: "12:00", capacity: 3, isActive: true },
  { dayOfWeek: 5, shift: "afternoon", startTime: "13:00", endTime: "18:00", capacity: 5, isActive: true },
  { dayOfWeek: 5, shift: "night",     startTime: "18:00", endTime: "22:00", capacity: 2, isActive: false },
  // Sábado — só manhã
  { dayOfWeek: 6, shift: "morning",   startTime: "09:00", endTime: "13:00", capacity: 2, isActive: true },
];

export const EXCEPTIONS: MockException[] = [
  { id: "ex1", startDate: "2026-05-29", endDate: "2026-05-29", shifts: ["afternoon"], reason: "Consulta médica" },
  { id: "ex2", startDate: "2026-06-08", endDate: "2026-06-12", shifts: [], reason: "Férias" },
  { id: "ex3", startDate: "2026-06-22", endDate: "2026-06-22", shifts: ["night"], reason: "Curso técnico" },
];

// Slots disponíveis por dia (uso em "novo agendamento")
export function slotsForDate(dateISO: string): MockSlot[] {
  const dow = new Date(`${dateISO}T00:00:00`).getDay();
  const dayAvails = AVAILABILITY.filter(a => a.dayOfWeek === dow && a.isActive);
  return dayAvails.map(a => {
    const usage = APPOINTMENTS.filter(
      ap => ap.scheduledDate === dateISO && ap.shift === a.shift && ap.status === "scheduled"
    ).length;
    const ex = EXCEPTIONS.find(e =>
      dateISO >= e.startDate && dateISO <= e.endDate &&
      (e.shifts.length === 0 || e.shifts.includes(a.shift))
    );
    return {
      shift: a.shift,
      startTime: a.startTime,
      endTime: a.endTime,
      capacity: a.capacity,
      available: Math.max(0, a.capacity - usage),
      blocked: !!ex,
    };
  });
}

// Início e fim de cada turno em minutos a partir da meia-noite
export const SHIFT_START_MIN: Record<Shift, number> = {
  morning: 8 * 60,
  afternoon: 13 * 60,
  night: 18 * 60,
};
export const SHIFT_END_MIN: Record<Shift, number> = {
  morning: 12 * 60,
  afternoon: 18 * 60,
  night: 22 * 60,
};

// Velocidade média de deslocamento em SP (km/h) — chute conservador, considera trânsito urbano
export const AVG_SPEED_KMH = 25;

// Duração estimada do serviço por nº de equipamentos
// 30 min de setup/atendimento + 25 min por equipamento
export function estimateServiceMinutes(equipmentCount: number): number {
  const n = Math.max(1, equipmentCount);
  return 30 + n * 25;
}

export function travelMinutes(km: number): number {
  return (km / AVG_SPEED_KMH) * 60;
}

export function formatHm(totalMin: number): string {
  const safe = Math.max(0, totalMin);
  const h = Math.floor(safe / 60);
  const m = Math.round(safe % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Distância haversine entre duas coordenadas (km)
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  split: "Split", janela: "Janela", central: "Central", cassete: "Cassete",
  piso_teto: "Piso-teto", portatil: "Portátil",
};

export const PROBLEM_TYPE_LABELS: Record<string, string> = {
  nao_gela: "Não está gelando", barulho: "Fazendo barulho", vazamento: "Vazando água",
  nao_liga: "Não liga", manutencao: "Manutenção preventiva", instalacao: "Instalação", outro: "Outro",
};

export function clientById(id: string) {
  return CLIENTS.find(c => c.id === id)!;
}
export function equipmentById(id: string) {
  return EQUIPMENTS.find(e => e.id === id)!;
}

export const MONTH_NAMES_LONG = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
export const MONTH_NAMES_SHORT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
export const DAY_NAMES_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export function MockupShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <header>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{subtitle}</p>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </header>
        {children}
      </div>
    </div>
  );
}

export function ShiftBadge({ shift, size = "sm" }: { shift: Shift; size?: "xs" | "sm" }) {
  const c = SHIFT_COLORS[shift];
  const Icon = SHIFT_ICONS[shift];
  const sz = size === "xs" ? "text-[10px] px-1.5 py-0.5 gap-0.5" : "text-xs px-2 py-0.5 gap-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${c.chip} ${sz}`}>
      <Icon className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {SHIFT_LABELS[shift]}
    </span>
  );
}
