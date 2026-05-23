import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Ban, Clock, X, ChevronRight } from "lucide-react";
import {
  CompactDaySummary,
  InfoCard,
  MOCK_EXCEPTIONS,
  PageHeader,
  PageShell,
  formatTimeRange,
} from "./_shared";

const DAY_NAMES = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTH_NAMES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildBlockedDayMap() {
  const map = new Map<string, { full: boolean; partial: boolean; exceptions: typeof MOCK_EXCEPTIONS }>();
  for (const e of MOCK_EXCEPTIONS) {
    const [sy, sm, sd] = e.startDate.split("-").map(Number);
    const [ey, em, ed] = e.endDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    const full = !e.startTime || !e.endTime;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = toKey(d);
      const existing = map.get(key) ?? { full: false, partial: false, exceptions: [] };
      map.set(key, {
        full: existing.full || full,
        partial: existing.partial || !full,
        exceptions: [...existing.exceptions, e],
      });
    }
  }
  return map;
}

export default function ExceptionsV3Timeline() {
  const blocked = buildBlockedDayMap();
  const start = new Date(2026, 4, 23);
  const days = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const [selectedKey, setSelectedKey] = useState<string>(toKey(new Date(2026, 4, 28)));

  const selectedDate = days.find(d => toKey(d) === selectedKey)!;
  const selectedInfo = blocked.get(selectedKey);

  return (
    <PageShell>
      <PageHeader />
      <InfoCard />
      <CompactDaySummary />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Próximos 60 dias</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Deslize para ver, toque para bloquear</p>
            </div>
            <Button size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="-mx-6 px-6 overflow-x-auto">
            <div className="flex gap-1.5 pb-2 min-w-max">
              {days.map(d => {
                const key = toKey(d);
                const info = blocked.get(key);
                const isSelected = key === selectedKey;
                const isFirstOfMonth = d.getDate() === 1 || key === toKey(days[0]);
                let bg = "bg-gray-50 text-gray-700 hover:bg-gray-100";
                if (info?.full) bg = "bg-rose-500 text-white hover:bg-rose-600";
                else if (info?.partial) bg = "bg-amber-400 text-white hover:bg-amber-500";
                const ring = isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "";
                return (
                  <div key={key} className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-semibold text-gray-400 mb-1 h-3">
                      {isFirstOfMonth ? MONTH_NAMES[d.getMonth()] : ""}
                    </span>
                    <button
                      onClick={() => setSelectedKey(key)}
                      className={`w-9 h-14 rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all ${bg} ${ring}`}
                    >
                      <span className="text-[10px] opacity-80">{DAY_NAMES[d.getDay()]}</span>
                      <span className="text-sm">{d.getDate()}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500" /> Bloqueado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" /> Faixa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-100 border" /> Livre
            </span>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  {DAY_NAMES[selectedDate.getDay()]}
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {selectedDate.getDate()} de {MONTH_NAMES[selectedDate.getMonth()]}
                </p>
              </div>
              {!selectedInfo && (
                <button className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1">
                  Bloquear este dia <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {!selectedInfo && (
              <p className="text-sm text-gray-400">Sem bloqueios — agenda aberta neste dia.</p>
            )}

            {selectedInfo?.exceptions.map(e => {
              const fullDay = !e.startTime || !e.endTime;
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5"
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                      fullDay ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {fullDay ? <Ban className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {e.reason ?? "Sem motivo"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fullDay ? "Dia inteiro" : formatTimeRange(e.startTime, e.endTime)}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-rose-500 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
