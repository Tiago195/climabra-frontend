import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Ban, Clock, X } from "lucide-react";
import {
  CompactDaySummary,
  InfoCard,
  MOCK_EXCEPTIONS,
  PageHeader,
  PageShell,
  formatRange,
  formatTimeRange,
} from "./_shared";

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_INITIALS = ["D","S","T","Q","Q","S","S"];

function buildBlockedMap(year: number, month: number) {
  const map = new Map<number, { full: boolean; partial: boolean; reasons: string[] }>();
  for (const e of MOCK_EXCEPTIONS) {
    const [sy, sm, sd] = e.startDate.split("-").map(Number);
    const [ey, em, ed] = e.endDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        const existing = map.get(day) ?? { full: false, partial: false, reasons: [] };
        const full = !e.startTime || !e.endTime;
        map.set(day, {
          full: existing.full || full,
          partial: existing.partial || !full,
          reasons: [...existing.reasons, e.reason ?? "Bloqueio"],
        });
      }
    }
  }
  return map;
}

export default function ExceptionsV1Calendar() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);
  const [selectedDay, setSelectedDay] = useState<number | null>(28);

  const blocked = buildBlockedMap(year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prev = () => (month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1));
  const next = () => (month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1));

  const selectedInfo = selectedDay ? blocked.get(selectedDay) : undefined;

  return (
    <PageShell>
      <PageHeader />
      <InfoCard />
      <CompactDaySummary />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Exceções</CardTitle>
            <Button size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Nova
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Toque numa data para bloquear ou ver detalhes</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={prev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-sm font-semibold text-gray-700">
              {MONTH_NAMES[month]} {year}
            </p>
            <Button variant="ghost" size="sm" onClick={next}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAY_INITIALS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const info = blocked.get(day);
              const isSelected = selectedDay === day;
              const base = "w-full aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-all relative";
              let cls = "text-gray-700 hover:bg-gray-100";
              if (info?.full) cls = "bg-rose-100 text-rose-700 hover:bg-rose-200";
              else if (info?.partial) cls = "bg-amber-100 text-amber-700 hover:bg-amber-200";
              const ring = isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "";
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`${base} ${cls} ${ring}`}
                >
                  {day}
                  {info?.partial && !info.full && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-100 border border-rose-200" /> Dia inteiro
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Faixa horária
            </span>
          </div>

          {selectedDay && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  {String(selectedDay).padStart(2, "0")} de {MONTH_NAMES[month].toLowerCase()}
                </p>
                {!selectedInfo && (
                  <button className="text-xs text-blue-600 font-medium">+ Bloquear</button>
                )}
              </div>
              {!selectedInfo && (
                <p className="text-xs text-gray-400">Nenhum bloqueio neste dia.</p>
              )}
              {selectedInfo?.reasons.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {selectedInfo.full ? (
                      <Ban className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span className="text-sm text-gray-700">{r}</span>
                  </div>
                  <button className="text-gray-400 hover:text-rose-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Próximos bloqueios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MOCK_EXCEPTIONS.slice(0, 3).map(e => (
            <div key={e.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{formatRange(e.startDate, e.endDate)}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{formatTimeRange(e.startTime, e.endTime)}</span>
              </div>
              <span className="text-gray-500 truncate max-w-[120px]">{e.reason ?? "—"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
