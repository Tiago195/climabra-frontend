import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const DAY_INITIALS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

interface MockBlock {
  date: string;
  full: boolean;
  reason: string;
}

const BLOCKS: MockBlock[] = [
  { date: "2026-06-01", full: false, reason: "Consulta médica 14h–16h" },
  { date: "2026-06-08", full: true,  reason: "Férias" },
  { date: "2026-06-09", full: true,  reason: "Férias" },
  { date: "2026-06-10", full: true,  reason: "Férias" },
  { date: "2026-06-11", full: true,  reason: "Férias" },
  { date: "2026-06-12", full: true,  reason: "Férias" },
  { date: "2026-06-13", full: true,  reason: "Férias" },
  { date: "2026-06-14", full: true,  reason: "Férias" },
  { date: "2026-06-20", full: false, reason: "Curso técnico 14h–17h" },
  { date: "2026-06-21", full: false, reason: "Curso técnico 14h–17h" },
  { date: "2026-06-25", full: true,  reason: "Feriado municipal" },
];

function blockOf(year: number, month: number, day: number) {
  const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return BLOCKS.find((b) => b.date === key) ?? null;
}

export default function MockupCalendarCard() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [hovered, setHovered] = useState<{ day: number; block: MockBlock } | null>(null);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const isTodayVisible = today.getFullYear() === year && today.getMonth() === month;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prev = () =>
    month === 0 ? (setYear((y) => y - 1), setMonth(11)) : setMonth((m) => m - 1);
  const next = () =>
    month === 11 ? (setYear((y) => y + 1), setMonth(0)) : setMonth((m) => m + 1);

  return (
    <div className="min-h-dvh bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto space-y-4">

        {/* Page context label */}
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
            /dashboard/availability
          </p>
          <h1 className="text-xl font-bold text-gray-800">Configurar Agenda</h1>
          <p className="text-sm text-gray-500">Dias da semana + exceções</p>
        </div>

        {/* Stub DayCards */}
        {["Segunda-feira","Quarta-feira","Sexta-feira"].map((d) => (
          <Card key={d} className="border-blue-200 opacity-50 pointer-events-none">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{d}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">08:00 – 18:00</span>
                  <div className="w-8 h-4 bg-blue-500 rounded-full" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        <p className="text-xs text-center text-gray-400">↑ DayCards existentes (inalterados)</p>

        {/* ─── ExceptionsCalendarCard ─── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Exceções e dias bloqueados</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Bloqueie feriados, férias ou horários pontuais
                </p>
              </div>
              <Button size="sm" className="shrink-0 h-8 gap-1 bg-blue-600 hover:bg-blue-700 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Nova exceção
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={prev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <p className="text-sm font-semibold text-gray-700">
                {MONTH_NAMES[month]} {year}
              </p>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={next}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Day initials header */}
            <div className="grid grid-cols-7">
              {DAY_INITIALS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-y-1 relative">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`e-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const block = blockOf(year, month, day);
                const key = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isToday = isTodayVisible && key === todayKey;

                let cellCls =
                  "relative mx-auto w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-default";

                if (block?.full) {
                  cellCls += " bg-rose-100 text-rose-700";
                } else if (block && !block.full) {
                  cellCls += " bg-purple-100 text-purple-700";
                } else {
                  cellCls += " text-gray-600 hover:bg-gray-100";
                }

                if (isToday) {
                  cellCls += " ring-2 ring-blue-500 ring-offset-1";
                }

                return (
                  <div key={day} className="flex flex-col items-center">
                    <button
                      className={cellCls}
                      onMouseEnter={() => block && setHovered({ day, block })}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {day}
                      {block && !block.full && (
                        <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-purple-500" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Tooltip */}
            {hovered && (
              <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 text-center">
                <span className="font-semibold">
                  {hovered.day} de {MONTH_NAMES[month].toLowerCase()}
                </span>
                <br />
                {hovered.block.reason}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 pt-1 border-t text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300 shrink-0" />
                Dia inteiro bloqueado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-100 border border-purple-300 shrink-0" />
                Faixa horária
              </span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
