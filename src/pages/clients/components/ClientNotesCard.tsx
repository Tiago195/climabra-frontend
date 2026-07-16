import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StickyNote, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { clientNoteService, type IClientNote } from "@/services/clientNote";
import type { NoteKind } from "@/services/enums";
import { NoteTimeline, NOTE_KIND_META } from "@/components/NoteTimeline";
import { getApiErrorMessage } from "@/services/apiError";

// Tipos selecionáveis no composer — `whatsapp_in` (mensagem recebida) é gerado pelo webhook,
// nunca escolhido à mão, então fica fora do dropdown (mas é renderizado na timeline).
const COMPOSER_KINDS: NoteKind[] = ["note", "call", "whatsapp", "visit_followup"];

/** dd/mm/aaaa HH:mm para o input datetime-local. */
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Converte o valor "naive" do input datetime-local ("YYYY-MM-DDTHH:mm") na
 * string enviada ao backend ("YYYY-MM-DDTHH:mm:ss"). O backend usa
 * LocalDateTime (sem timezone) — enviar como ISO com "Z" faria o Jackson
 * gravar o horário UTC como se fosse local, deslocando o lembrete.
 */
function toNaiveLocalDateTime(inputValue: string): string {
  return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
}

interface Props {
  token: string;
  clientId: string;
}

/** Seção "Anotações" do ClientDetail: composer + timeline (CRM F1, task 1.3). */
export function ClientNotesCard({ token, clientId }: Props) {
  const [notes, setNotes] = useState<IClientNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [kind, setKind] = useState<NoteKind>("note");
  const [remindAt, setRemindAt] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<IClientNote | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editKind, setEditKind] = useState<NoteKind>("note");
  const [editRemindAt, setEditRemindAt] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const load = () => {
    setLoading(true);
    clientNoteService.list(token, clientId)
      .then(page => setNotes(page.items))
      .catch(e => toast.error(getApiErrorMessage(e, "Erro ao carregar anotações")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientId]);

  const handleCreate = async () => {
    if (!content.trim()) {
      toast.error("Escreva algo antes de salvar");
      return;
    }
    setSaving(true);
    try {
      const created = await clientNoteService.create(token, clientId, {
        content: content.trim(),
        kind,
        remindAt: remindAt ? toNaiveLocalDateTime(remindAt) : undefined,
      });
      setNotes(prev => [created, ...prev]);
      setContent("");
      setKind("note");
      setRemindAt("");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao salvar anotação"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (note: IClientNote) => {
    setEditing(note);
    setEditContent(note.content);
    setEditKind(note.kind);
    setEditRemindAt(toLocalInputValue(note.remindAt));
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setEditSaving(true);
    try {
      const clearRemindAt = !editRemindAt && !!editing.remindAt;
      const updated = await clientNoteService.update(token, clientId, editing.id, {
        content: editContent.trim(),
        kind: editKind,
        remindAt: editRemindAt ? toNaiveLocalDateTime(editRemindAt) : undefined,
        ...(clearRemindAt ? { clearRemindAt: true } : {}),
      });
      setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
      setEditing(null);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao atualizar anotação"));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await clientNoteService.remove(token, clientId, noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao excluir anotação"));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-500" /> Anotações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Composer */}
        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Ex: Cliente ligou pedindo orçamento de manutenção..."
            rows={3}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={kind} onValueChange={v => setKind(v as NoteKind)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPOSER_KINDS.map(k => (
                  <SelectItem key={k} value={k}>{NOTE_KIND_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={remindAt}
              onChange={e => setRemindAt(e.target.value)}
              className="w-full sm:w-56"
              title="Lembrete (opcional)"
            />
            <Button onClick={handleCreate} disabled={saving} className="w-full sm:w-auto sm:ml-auto">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <NoteTimeline notes={notes} onEdit={openEdit} onDelete={handleDelete} />
        )}
      </CardContent>

      <ResponsiveModal
        open={!!editing}
        onOpenChange={next => { if (!next) setEditing(null); }}
        title="Editar anotação"
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Conteúdo</Label>
            <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} />
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={editKind} onValueChange={v => setEditKind(v as NoteKind)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPOSER_KINDS.map(k => (
                  <SelectItem key={k} value={k}>{NOTE_KIND_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Lembrete (opcional)</Label>
            <Input type="datetime-local" value={editRemindAt} onChange={e => setEditRemindAt(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={editSaving}>
            {editSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </ResponsiveModal>
    </Card>
  );
}
