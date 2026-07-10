import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, MessageSquareText, Loader2, RotateCcw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext";
import {
  notificationService,
  type IMessageTemplate,
  type INotificationPref,
} from "@/services/notification";
import { NOTIFICATION_TYPE_META, type NotificationType } from "@/services/enums";
import { getApiErrorMessage } from "@/services/apiError";

const VARIABLES_HINT = "Variáveis: {nome}, {prestador}, {valor}, {data}, {link}";

/**
 * Seção de Notificações do Settings (CRM F3 — tasks 3.5/3.6): liga/desliga cada tipo de
 * mensagem automática e permite editar/restaurar o texto de cada template. Mobile-first.
 */
export function NotificationsSection() {
  const { token } = useAuth();
  const [prefs, setPrefs] = useState<INotificationPref[] | null>(null);
  const [templates, setTemplates] = useState<IMessageTemplate[] | null>(null);
  const [savingPref, setSavingPref] = useState<NotificationType | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([notificationService.listPrefs(token), notificationService.listTemplates(token)])
      .then(([p, t]) => {
        setPrefs(p);
        setTemplates(t);
      })
      .catch(e => toast.error(getApiErrorMessage(e, "Erro ao carregar notificações")));
  }, [token]);

  const togglePref = async (type: NotificationType, enabled: boolean) => {
    if (!token || !prefs) return;
    const prev = prefs;
    setPrefs(prefs.map(p => (p.type === type ? { ...p, enabled } : p))); // otimista
    setSavingPref(type);
    try {
      await notificationService.setPref(token, type, enabled);
    } catch (e) {
      setPrefs(prev);
      toast.error(getApiErrorMessage(e, "Não foi possível salvar"));
    } finally {
      setSavingPref(null);
    }
  };

  const onTemplateSaved = (t: IMessageTemplate) =>
    setTemplates(prev => (prev ? prev.map(x => (x.type === t.type ? t : x)) : prev));

  if (!prefs || !templates) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Mensagens automáticas (WhatsApp)</h3>
          </div>
          <p className="text-xs text-gray-500">
            Escolha quais avisos são enviados automaticamente. Clientes que optaram por não receber
            nunca são notificados.
          </p>
          <div className="divide-y">
            {prefs.map(pref => {
              const meta = NOTIFICATION_TYPE_META[pref.type];
              return (
                <div key={pref.type} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                    <p className="text-xs text-gray-500">{meta.desc}</p>
                  </div>
                  <Switch
                    checked={pref.enabled}
                    disabled={savingPref === pref.type}
                    onCheckedChange={v => togglePref(pref.type, v)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Textos das mensagens</h3>
          </div>
          <p className="text-xs text-gray-500">
            Personalize cada mensagem. {VARIABLES_HINT}.
          </p>
          <div className="space-y-2">
            {templates.map(t => (
              <TemplateEditor key={t.type} template={t} onSaved={onTemplateSaved} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateEditor({
  template,
  onSaved,
}: {
  template: IMessageTemplate;
  onSaved: (t: IMessageTemplate) => void;
}) {
  const { token } = useAuth();
  const meta = NOTIFICATION_TYPE_META[template.type];
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(template.body);
  const [busy, setBusy] = useState(false);

  useEffect(() => setBody(template.body), [template.body]);

  const dirty = body.trim() !== template.body.trim();

  const save = async () => {
    if (!token || !body.trim()) return;
    setBusy(true);
    try {
      const saved = await notificationService.saveTemplate(token, template.type, body.trim());
      onSaved(saved);
      toast.success("Texto salvo!");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao salvar o texto"));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const reset = await notificationService.resetTemplate(token, template.type);
      onSaved(reset);
      setBody(reset.body);
      toast.success("Texto padrão restaurado");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao restaurar"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border rounded-md">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="min-w-0">
          <span className="text-sm font-medium text-gray-900">{meta.label}</span>
          {template.custom && (
            <span className="ml-2 text-[10px] text-blue-600 align-middle">personalizado</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={restore}
              disabled={busy || !template.custom}
              className="text-gray-500"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restaurar padrão
            </Button>
            <Button
              size="sm"
              onClick={save}
              disabled={busy || !dirty || !body.trim()}
              className="sm:ml-auto"
            >
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
