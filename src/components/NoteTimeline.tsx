/* eslint-disable react-refresh/only-export-components */
import {
  StickyNote, Phone, MessageCircle, MessageCircleReply, CalendarCheck, Bell, Pencil, Trash2,
} from "lucide-react";
import type { IClientNote } from "@/services/clientNote";
import type { NoteKind } from "@/services/enums";
import { formatRelative } from "@/lib/utils";

/**
 * Metadados (rótulo/ícone/cor) de cada tipo de nota — fonte ÚNICA, compartilhada pela timeline do
 * cliente (ClientNotesCard) e do lead (Bloco B — F3). `whatsapp_in` (mensagem recebida) é visual
 * distinto da nota manual `whatsapp`: ícone de resposta + cor teal + rótulo "Mensagem recebida".
 */
export const NOTE_KIND_META: Record<NoteKind, { label: string; icon: typeof StickyNote; color: string }> = {
  note:            { label: "Anotação",          icon: StickyNote,          color: "text-gray-500" },
  call:            { label: "Ligação",           icon: Phone,               color: "text-blue-500" },
  whatsapp:        { label: "WhatsApp",          icon: MessageCircle,       color: "text-green-600" },
  visit_followup:  { label: "Retorno de visita", icon: CalendarCheck,       color: "text-amber-600" },
  whatsapp_in:     { label: "Mensagem recebida", icon: MessageCircleReply,  color: "text-teal-600" },
};

interface NoteTimelineProps {
  notes: IClientNote[];
  /** Se informado, mostra o botão "Editar" em cada nota (timeline do cliente). */
  onEdit?: (note: IClientNote) => void;
  /** Se informado, mostra o botão "Excluir" em cada nota (timeline do cliente). */
  onDelete?: (noteId: string) => void;
  /** Texto do estado vazio. */
  emptyLabel?: string;
}

/**
 * Timeline de notas (só apresentação) reutilizada pela aba de Anotações do cliente e pela conversa
 * do lead. Read-only quando `onEdit`/`onDelete` não são passados (caso do lead no v1). O markup de
 * cada item é o esperado pelos E2E de notas (`div.border.rounded-lg`, rótulo exato, título Editar/
 * Excluir), então mudanças aqui devem preservá-lo.
 */
export function NoteTimeline({ notes, onEdit, onDelete, emptyLabel }: NoteTimelineProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-2">
        {emptyLabel ?? "Nenhuma anotação ainda."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map(note => {
        const meta = NOTE_KIND_META[note.kind];
        const Icon = meta.icon;
        return (
          <div key={note.id} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-start gap-2">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-600">{meta.label}</span>
                  <span className="text-[11px] text-gray-400 shrink-0">{formatRelative(note.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words mt-0.5">{note.content}</p>
                {note.remindAt && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-1">
                    <Bell className="w-3 h-3" /> Lembrete: {new Date(note.remindAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
              {(onEdit || onDelete) && (
                <div className="flex gap-1 shrink-0">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(note)}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(note.id)}
                      className="p-1.5 rounded hover:bg-gray-200 text-red-500"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
