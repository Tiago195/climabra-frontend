import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trash2, Plus, CalendarX } from "lucide-react";

interface MockException {
  id: string;
  label: string;
  sub: string;
  reason: string | null;
  full: boolean;
}

const EXCEPTIONS: MockException[] = [
  {
    id: "e1",
    label: "8 a 15 de jun de 2026",
    sub: "Dia inteiro",
    reason: "Férias",
    full: true,
  },
  {
    id: "e2",
    label: "25 de jun de 2026",
    sub: "Dia inteiro",
    reason: "Feriado municipal",
    full: true,
  },
  {
    id: "e3",
    label: "1 de jul de 2026",
    sub: "14:00 às 16:00",
    reason: "Consulta médica",
    full: false,
  },
  {
    id: "e4",
    label: "10 de jul de 2026",
    sub: "08:00 às 11:00",
    reason: "Revisão do carro",
    full: false,
  },
  {
    id: "e5",
    label: "18 e 19 de jul de 2026",
    sub: "Dia inteiro",
    reason: "Viagem de fim de semana",
    full: true,
  },
];

export default function MockupExceptionsList() {
  const [items, setItems] = useState(EXCEPTIONS);
  const [showEmpty, setShowEmpty] = useState(false);

  const remove = (id: string) => setItems((prev) => prev.filter((e) => e.id !== id));
  const displayed = showEmpty ? [] : items;

  return (
    <div className="min-h-dvh bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto space-y-4">

        {/* Page context label */}
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
            /dashboard/availability
          </p>
          <h1 className="text-xl font-bold text-gray-800">Configurar Agenda</h1>
        </div>

        {/* Demo toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmpty(false)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              !showEmpty
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Com exceções
          </button>
          <button
            onClick={() => setShowEmpty(true)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              showEmpty
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Estado vazio
          </button>
        </div>

        {/* ─── ExceptionsList Card ─── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Próximas exceções</CardTitle>
                {!showEmpty && (
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {displayed.length}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold px-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova exceção
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* ── Empty state ── */}
            {displayed.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <CalendarX className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Nenhuma exceção cadastrada</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px] leading-relaxed">
                  Clique no calendário acima ou em "+ Nova exceção" para começar.
                </p>
                <Button
                  size="sm"
                  className="mt-4 h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar primeira exceção
                </Button>
              </div>
            )}

            {/* ── List ── */}
            {displayed.length > 0 && (
              <div className="space-y-1 -mx-2">
                {displayed.map((e, i) => (
                  <div key={e.id}>
                    <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 group transition-colors">
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          e.full
                            ? "bg-rose-50 text-rose-500"
                            : "bg-purple-50 text-purple-500"
                        }`}
                      >
                        {e.full ? (
                          <Calendar className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {e.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {e.sub}
                          {e.reason && (
                            <>
                              {" "}
                              <span className="text-gray-300">•</span> {e.reason}
                            </>
                          )}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => remove(e.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Remover exceção"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {i < displayed.length - 1 && (
                      <div className="ml-11 border-b border-gray-100" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-gray-400">
          Passe o mouse sobre um item para ver o botão remover
        </p>
      </div>
    </div>
  );
}
