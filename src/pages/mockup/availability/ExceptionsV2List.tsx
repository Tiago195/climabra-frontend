import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Ban, Clock, CalendarRange } from "lucide-react";
import {
  CompactDaySummary,
  InfoCard,
  MOCK_EXCEPTIONS,
  PageHeader,
  PageShell,
  formatRange,
  formatTimeRange,
} from "./_shared";

function monthLabel(date: string) {
  const [, m] = date.split("-");
  const names = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return names[parseInt(m, 10) - 1];
}

function dayNum(date: string) {
  return date.split("-")[2];
}

function isMultiDay(e: { startDate: string; endDate: string }) {
  return e.startDate !== e.endDate;
}

export default function ExceptionsV2List() {
  const grouped = new Map<string, typeof MOCK_EXCEPTIONS>();
  for (const e of MOCK_EXCEPTIONS) {
    const key = `${monthLabel(e.startDate)} 2026`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  }

  return (
    <PageShell>
      <PageHeader />
      <InfoCard />
      <CompactDaySummary />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Exceções agendadas</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">{MOCK_EXCEPTIONS.length} bloqueios futuros</p>
            </div>
            <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Nova exceção
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {Array.from(grouped.entries()).map(([monthKey, items]) => (
            <div key={monthKey} className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 px-1">
                {monthKey}
              </p>
              {items.map(e => {
                const fullDay = !e.startTime || !e.endTime;
                const multi = isMultiDay(e);
                return (
                  <div
                    key={e.id}
                    className="flex gap-3 bg-white border rounded-xl p-3 hover:border-gray-300 transition-colors"
                  >
                    <div
                      className={`shrink-0 w-12 rounded-lg flex flex-col items-center justify-center py-1 ${
                        fullDay ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span className="text-lg font-bold leading-none">{dayNum(e.startDate)}</span>
                      <span className="text-[10px] uppercase mt-0.5">{monthLabel(e.startDate)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {multi && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            <CalendarRange className="w-3 h-3" />
                            Intervalo
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            fullDay
                              ? "text-rose-700 bg-rose-50"
                              : "text-amber-700 bg-amber-50"
                          }`}
                        >
                          {fullDay ? <Ban className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {fullDay ? "Dia inteiro" : formatTimeRange(e.startTime, e.endTime)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1 truncate">
                        {e.reason ?? "Sem motivo informado"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {multi ? formatRange(e.startDate, e.endDate) : "Dia único"}
                      </p>
                    </div>
                    <button
                      className="self-start p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                      aria-label="Remover exceção"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Bloquear um período rápido</p>
            <p className="text-xs text-gray-600">Toque para adicionar uma nova exceção</p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
