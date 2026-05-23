import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CalendarDays } from "lucide-react";

export interface MockException {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export const MOCK_EXCEPTIONS: MockException[] = [
  { id: "e1", startDate: "2026-05-25", endDate: "2026-05-25", startTime: null, endTime: null, reason: "Feriado municipal" },
  { id: "e2", startDate: "2026-05-28", endDate: "2026-05-28", startTime: "14:00:00", endTime: "16:00:00", reason: "Consulta médica" },
  { id: "e3", startDate: "2026-06-08", endDate: "2026-06-15", startTime: null, endTime: null, reason: "Férias" },
  { id: "e4", startDate: "2026-06-22", endDate: "2026-06-26", startTime: "14:00:00", endTime: "17:00:00", reason: "Curso técnico" },
  { id: "e5", startDate: "2026-07-02", endDate: "2026-07-02", startTime: null, endTime: null, reason: null },
];

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Configurar Agenda</h1>
      <p className="text-gray-500 text-sm">Defina seus dias e horários de atendimento</p>
    </div>
  );
}

export function InfoCard() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="py-4 flex items-start gap-3">
        <CalendarDays className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Como funciona</p>
          <p className="text-sm text-blue-700">
            Configure os dias da semana e adicione exceções para feriados, férias ou outros bloqueios pontuais.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompactDaySummary() {
  const active = [1, 2, 3, 4, 5];
  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Dias da semana</p>
          <button className="text-xs text-blue-600 font-medium">Expandir</button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((d, i) => {
            const on = active.includes(i);
            return (
              <div
                key={d}
                className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium ${
                  on ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-400"
                }`}
              >
                <span>{d.slice(0, 3)}</span>
                <span className={`text-[10px] ${on ? "text-blue-500" : "text-gray-300"}`}>
                  {on ? "8-18h" : "off"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Slot padrão</span>
            <span className="text-sm font-semibold text-gray-700">60 min</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked />
            <span className="text-xs text-gray-500">Aceitando agendamentos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function formatRange(startDate: string, endDate: string) {
  const fmt = (s: string) => {
    const [, m, d] = s.split("-");
    return `${d}/${m}`;
  };
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

export function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime || !endTime) return "Dia inteiro";
  return `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`;
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
        {children}
      </div>
    </div>
  );
}
