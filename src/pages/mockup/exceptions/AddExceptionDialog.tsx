import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info, X, Calendar } from "lucide-react";

export default function MockupAddExceptionDialog() {
  const [allDay, setAllDay] = useState(true);

  return (
    <div className="min-h-dvh bg-black/30 flex items-center justify-center px-4 py-8">

      {/* Dialog card */}
      <Card className="w-full max-w-sm shadow-2xl border-0">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Bloquear data na agenda</h2>
              <p className="text-xs text-gray-500">Defina o período e o tipo de bloqueio</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <CardContent className="px-5 py-5 space-y-5">

          {/* Date fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs font-medium text-gray-700">
                Data de início
              </Label>
              <Input
                id="start-date"
                type="date"
                defaultValue="2026-06-25"
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs font-medium text-gray-700">
                Data de fim
              </Label>
              <Input
                id="end-date"
                type="date"
                defaultValue="2026-06-25"
                className="text-sm h-9"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 -mt-3">
            Para bloquear um único dia, deixe igual à data de início.
          </p>

          {/* All-day switch */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">Bloquear o dia inteiro</p>
              <p className="text-xs text-gray-500">
                {allDay ? "Nenhum horário disponível" : "Definir faixa de horário"}
              </p>
            </div>
            <Switch checked={allDay} onCheckedChange={setAllDay} />
          </div>

          {/* Time range — shown only when allDay is OFF */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-time" className="text-xs font-medium text-gray-700">
                  Início
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  defaultValue="14:00"
                  className="text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time" className="text-xs font-medium text-gray-700">
                  Fim
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  defaultValue="16:00"
                  className="text-sm h-9"
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-medium text-gray-700">
              Motivo <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="reason"
              type="text"
              placeholder="Ex: Férias, feriado, consulta médica…"
              className="text-sm h-9"
            />
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Bloqueios novos passam a valer imediatamente para clientes que tentarem agendar.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-9 px-4 text-sm">
              Cancelar
            </Button>
            <Button size="sm" className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700">
              Salvar bloqueio
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* Toggle demo label */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <button
          onClick={() => setAllDay((v) => !v)}
          className="bg-white border shadow text-xs font-medium text-gray-600 px-3 py-1.5 rounded-full"
        >
          Toggle: dia inteiro está {allDay ? "LIGADO" : "DESLIGADO"} — clique para alternar
        </button>
      </div>
    </div>
  );
}
