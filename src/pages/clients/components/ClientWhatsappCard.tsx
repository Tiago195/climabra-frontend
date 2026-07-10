import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { MessageCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { notificationService, type IMessageTemplate } from "@/services/notification";
import { NOTIFICATION_TYPE_META } from "@/services/enums";
import { getApiErrorMessage } from "@/services/apiError";

interface Props {
  token: string;
  clientId: string;
  clientName: string;
  optedOut: boolean;
}

/**
 * Ação manual "Enviar WhatsApp" ao cliente (CRM F3 — task 3.6). Texto livre, com atalho para
 * partir de um template. Registra em `notifications` no backend (não vira anotação). Respeita o
 * opt-out do cliente — se ativo, o envio é pulado e avisamos.
 */
export function ClientWhatsappCard({ token, clientId, clientName, optedOut }: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [templates, setTemplates] = useState<IMessageTemplate[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    notificationService.listTemplates(token).then(setTemplates).catch(() => {});
  }, [open, token]);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const { status } = await notificationService.sendWhatsapp(token, clientId, body.trim());
      if (status === "sent") {
        toast.success("Mensagem enviada!");
        setOpen(false);
        setBody("");
      } else if (status === "skipped") {
        toast.warning("Não enviado: o cliente optou por não receber mensagens.");
      } else {
        toast.error("Falha ao enviar. Tente novamente.");
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao enviar a mensagem"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">Enviar WhatsApp</h3>
          <p className="text-xs text-gray-500">Mensagem avulsa para {clientName}.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="shrink-0">
          <MessageCircle className="w-4 h-4 mr-1.5" /> Enviar
        </Button>
      </CardContent>

      <ResponsiveModal open={open} onOpenChange={setOpen} title="Enviar WhatsApp">
        <div className="space-y-3">
          {optedOut && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 text-amber-800 text-xs p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Este cliente optou por não receber mensagens automáticas. O envio será pulado.</span>
            </div>
          )}

          {templates.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-gray-500">Partir de um modelo:</p>
              <div className="flex flex-wrap gap-1.5">
                {templates.map(t => (
                  <Badge
                    key={t.type}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100 text-[11px]"
                    onClick={() => setBody(t.body)}
                  >
                    {NOTIFICATION_TYPE_META[t.type].label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            placeholder="Escreva a mensagem... Você pode usar {nome} e {prestador}."
            className="text-sm"
          />
          <p className="text-[11px] text-gray-400">Variáveis: {"{nome}"}, {"{prestador}"}.</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={send} disabled={sending || !body.trim()}>
            {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar mensagem
          </Button>
        </div>
      </ResponsiveModal>
    </Card>
  );
}
