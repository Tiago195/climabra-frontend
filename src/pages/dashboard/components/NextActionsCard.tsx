import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox, FileText, Wallet, Bell, CalendarClock, ChevronDown, ChevronUp,
  PartyPopper, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { formatCents, formatRelative } from "@/lib/utils";
import { nextActionsService, type INextAction } from "@/services/nextActions";
import type { NextActionType, NextActionUrgency } from "@/services/enums";

/** Quantos itens ficam visíveis antes do "ver todas" (lista completa vem cap. em 50 do back). */
const COLLAPSED_LIMIT = 5;

const TYPE_ICON: Record<NextActionType, React.ComponentType<{ className?: string }>> = {
  open_submission: Inbox,
  report_sent: FileText,
  report_awaiting_payment: Wallet,
  note_reminder: Bell,
  appointment_today: CalendarClock,
};

const URGENCY_TONE: Record<NextActionUrgency, { bg: string; text: string; badge: string }> = {
  overdue: { bg: "bg-red-50", text: "text-red-600", badge: "bg-red-100 text-red-700" },
  today: { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
  waiting: { bg: "bg-amber-50", text: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
};

const URGENCY_LABEL: Record<NextActionUrgency, string> = {
  overdue: "Atrasado",
  today: "Hoje",
  waiting: "Aguardando",
};

/**
 * Card "Próximas ações" (CRM F4) — topo do Dashboard. Agrega solicitações sem
 * laudo, laudos aguardando o cliente, lembretes de nota vencidos e visitas de
 * hoje num só lugar, com ação direta por item. Lista compacta (até
 * {@link COLLAPSED_LIMIT}) com "ver todas" quando há mais.
 */
export function NextActionsCard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [actions, setActions] = useState<INextAction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!token) return;
    nextActionsService.get(token)
      .then((data) => setActions(data.actions))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  const openAction = (action: INextAction) => {
    if (action.reportId) {
      navigate(`/dashboard/reports/${action.reportId}`);
    } else if (action.type === "note_reminder" && action.clientId) {
      navigate(`/dashboard/clients/${action.clientId}`);
    } else if (action.type === "appointment_today") {
      navigate("/dashboard/agenda?tab=rota");
    } else if (action.type === "open_submission") {
      navigate("/dashboard/agenda?tab=calendario");
    } else if (action.clientId) {
      navigate(`/dashboard/clients/${action.clientId}`);
    }
  };

  if (loading) return <Skeleton className="h-40" />;

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center gap-3 text-gray-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">Não foi possível carregar as próximas ações.</p>
        </CardContent>
      </Card>
    );
  }

  const list = actions ?? [];
  const visible = expanded ? list : list.slice(0, COLLAPSED_LIMIT);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Próximas ações</CardTitle>
          {list.length > 0 && (
            <span className="text-xs text-gray-400">{list.length} pendente{list.length > 1 ? "s" : ""}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {list.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <PartyPopper className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-gray-600">Tudo em dia 🎉</p>
            <p className="text-xs text-gray-400 mt-0.5">Nenhuma ação pendente no momento.</p>
          </div>
        ) : (
          <>
            <ul className="space-y-1.5">
              {visible.map((action, i) => (
                <ActionRow key={`${action.type}-${action.reportId ?? action.submissionId ?? action.noteId ?? action.appointmentId ?? i}`}
                  action={action} onOpen={() => openAction(action)} />
              ))}
            </ul>
            {list.length > COLLAPSED_LIMIT && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full text-xs text-blue-600 gap-1"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <>Ver menos <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Ver todas ({list.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActionRow({ action, onOpen }: { action: INextAction; onOpen: () => void }) {
  const Icon = TYPE_ICON[action.type];
  const tone = URGENCY_TONE[action.urgency];
  const age = formatRelative(action.baseAt);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50 transition-colors text-left"
      >
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone.bg} ${tone.text}`}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-medium text-gray-800 truncate">
              {action.title ?? "Cliente"}
            </p>
            <span className={`text-[10px] px-1.5 py-0 rounded-full shrink-0 font-medium ${tone.badge}`}>
              {URGENCY_LABEL[action.urgency]}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5 flex-wrap">
            <span className="truncate">{action.description}</span>
            {age && (
              <>
                <span className="text-gray-300">•</span>
                <span className="shrink-0">{age}</span>
              </>
            )}
          </div>
        </div>
        {action.valueCents != null && action.valueCents > 0 && (
          <span className="text-[12px] font-semibold text-gray-700 shrink-0">
            {formatCents(action.valueCents)}
          </span>
        )}
      </button>
    </li>
  );
}
