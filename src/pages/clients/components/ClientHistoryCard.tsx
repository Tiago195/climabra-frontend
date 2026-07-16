import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, StickyNote, Phone, MessageCircle, MessageCircleReply, CalendarCheck, FileText, Wallet, CalendarDays, AlertTriangle } from "lucide-react";
import { clientNoteService, type IClientNote } from "@/services/clientNote";
import { appointmentService } from "@/services/appointment";
import { reportService } from "@/services/report";
import { financeService } from "@/services/finance";
import type { NoteKind } from "@/services/enums";
import type { IEquipmentResponse } from "@/services/client";
import { formatCents, formatRelative } from "@/lib/utils";

type HistoryEventType = "note" | "call" | "whatsapp" | "whatsapp_in" | "visit_followup" | "report_sent" | "visit_completed" | "payment";

interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  at: string;       // ISO — usado pra ordenar e exibir a data relativa
  title: string;
  detail?: string;
}

const EVENT_META: Record<HistoryEventType, { label: string; icon: typeof History; color: string }> = {
  note:             { label: "Anotação",         icon: StickyNote,    color: "text-gray-500" },
  call:             { label: "Ligação",          icon: Phone,         color: "text-blue-500" },
  whatsapp:         { label: "WhatsApp",         icon: MessageCircle, color: "text-green-600" },
  whatsapp_in:      { label: "Mensagem recebida", icon: MessageCircleReply, color: "text-teal-600" },
  visit_followup:   { label: "Retorno de visita", icon: CalendarCheck, color: "text-amber-600" },
  report_sent:      { label: "Laudo enviado",    icon: FileText,      color: "text-indigo-500" },
  visit_completed:  { label: "Visita concluída", icon: CalendarDays,  color: "text-teal-600" },
  payment:          { label: "Pagamento",        icon: Wallet,        color: "text-emerald-600" },
};

const NOTE_TYPE: Record<NoteKind, HistoryEventType> = {
  note: "note",
  call: "call",
  whatsapp: "whatsapp",
  whatsapp_in: "whatsapp_in",
  visit_followup: "visit_followup",
};

interface Props {
  token: string;
  clientId: string;
  equipments: IEquipmentResponse[];
}

/**
 * Aba/bloco "Histórico" do ClientDetail (CRM F1, task 1.4): intercala notas com
 * eventos já existentes no sistema (laudo enviado, visita concluída, pagamento).
 * Só leitura, computado on-demand no front — nenhuma tabela/endpoint novo, já que
 * o dado de cada evento já é servido por outra tela (Anotações, laudos por
 * equipamento, agenda do provider e Financeiro).
 */
export function ClientHistoryCard({ token, clientId, equipments }: Props) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [partialError, setPartialError] = useState(false);
  const [totalError, setTotalError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setPartialError(false);
      setTotalError(false);
      try {
        const results = await Promise.allSettled([
          clientNoteService.list(token, clientId, 0, 50),
          appointmentService.list(token),
          financeService.payments(token, { clientId, status: "paid", size: 50 }),
          ...equipments.map(eq => reportService.listByEquipment(token, eq.id)),
        ]);

        const [notesResult, appointmentsResult, paymentsResult, ...reportResults] = results;
        const anyFailed = results.some(r => r.status === "rejected");
        const allFailed = results.every(r => r.status === "rejected");

        const noteEvents: HistoryEvent[] = notesResult.status === "fulfilled"
          ? notesResult.value.items.map((n: IClientNote) => ({
              id: `note-${n.id}`,
              type: NOTE_TYPE[n.kind],
              at: n.createdAt,
              title: EVENT_META[NOTE_TYPE[n.kind]].label,
              detail: n.content,
            }))
          : [];

        const visitEvents: HistoryEvent[] = appointmentsResult.status === "fulfilled"
          ? appointmentsResult.value
              .filter(row => row.client.id === clientId && row.appointment.status === "completed")
              .map(row => ({
                id: `visit-${row.appointment.id}`,
                type: "visit_completed" as const,
                at: row.appointment.scheduledDate,
                title: "Visita concluída",
                detail: row.equipments.map(e => e.label || e.type).filter(Boolean).join(", ") || undefined,
              }))
          : [];

        const reportEvents: HistoryEvent[] = reportResults
          .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof reportService.listByEquipment>>> =>
            r.status === "fulfilled")
          .flatMap(r => r.value)
          .filter(r => r.sentAt)
          .map(r => ({
            id: `report-${r.id}`,
            type: "report_sent" as const,
            at: r.sentAt as string,
            title: "Laudo enviado",
            detail: r.displayCode ? `Laudo ${r.displayCode}` : undefined,
          }));

        const paymentEvents: HistoryEvent[] = paymentsResult.status === "fulfilled"
          ? paymentsResult.value.items
              .filter(p => p.paidAt)
              .map(p => ({
                id: `payment-${p.paymentId}`,
                type: "payment" as const,
                at: p.paidAt as string,
                title: "Pagamento recebido",
                detail: formatCents(p.amountCents),
              }))
          : [];

        const all = [...noteEvents, ...visitEvents, ...reportEvents, ...paymentEvents]
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

        if (!cancelled) {
          setEvents(all);
          setTotalError(allFailed);
          setPartialError(anyFailed && !allFailed);
        }
      } catch {
        if (!cancelled) {
          setEvents([]);
          setTotalError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token && clientId) load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientId, equipments.length]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4 text-purple-500" /> Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : totalError ? (
          <p className="text-sm text-red-500 text-center py-2 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Não foi possível carregar o histórico.
          </p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">Nenhum evento registrado ainda.</p>
        ) : (
          <>
            {partialError && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1 mb-3">
                <AlertTriangle className="w-3 h-3" /> Não foi possível carregar parte do histórico.
              </p>
            )}
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {events.map(ev => {
                const meta = EVENT_META[ev.type];
                const Icon = meta.icon;
                return (
                  <li key={ev.id} className="ml-4">
                    <span className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full bg-white border ${meta.color}`}>
                      <Icon className="w-2.5 h-2.5" />
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-700">{meta.label}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{formatRelative(ev.at)}</span>
                    </div>
                    {ev.detail && (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{ev.detail}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
}
