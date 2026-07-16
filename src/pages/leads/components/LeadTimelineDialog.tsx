import { useEffect, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { NoteTimeline } from "@/components/NoteTimeline";
import { leadService, type ILeadResponse } from "@/services/lead";
import type { IClientNote } from "@/services/clientNote";
import { getApiErrorMessage } from "@/services/apiError";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  lead: ILeadResponse | null;
}

/**
 * Conversa/timeline do lead (Bloco B — F3), só leitura. Lista as mensagens recebidas
 * (`whatsapp_in`) e demais notas do lead, reusando o mesmo componente da timeline do cliente
 * ({@link NoteTimeline}). Carrega ao abrir; erro vira mensagem explícita (nunca "vazio" disfarçado).
 */
export function LeadTimelineDialog({ open, onOpenChange, token, lead }: Props) {
  const [notes, setNotes] = useState<IClientNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !lead) return;
    let cancelled = false;

    async function load(leadId: string) {
      setLoading(true);
      setError(null);
      try {
        const page = await leadService.notes(token, leadId);
        if (!cancelled) setNotes(page.items);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "Erro ao carregar a conversa"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load(lead.id);
    return () => { cancelled = true; };
  }, [open, lead, token]);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={lead?.name ? `Conversa — ${lead.name}` : "Conversa"}
      description={lead?.phone}
    >
      <div className="mt-2" data-testid="lead-timeline">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 text-center py-2 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </p>
        ) : (
          <NoteTimeline notes={notes} emptyLabel="Nenhuma mensagem recebida ainda." />
        )}
      </div>
    </ResponsiveModal>
  );
}
