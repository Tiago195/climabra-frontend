import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext";
import { reportService, type IReportDetailResponse, type IReportItemResponse } from "@/services/report";
import { uploadService } from "@/services/upload";
import { ArrowLeft, Plus, Trash2, Camera, Send, CheckCircle2, Copy, Loader2, ExternalLink } from "lucide-react";

const STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-gray-200 text-gray-700" },
  sent: { label: "Aguardando aprovação", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprovado pelo cliente", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
};

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  split: "Split", janela: "Janela", central: "Central",
  cassete: "Cassete", piso_teto: "Piso-teto", portatil: "Portátil",
};

export function ReportEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, provider } = useAuth();

  const [detail, setDetail] = useState<IReportDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    reportService.getDetail(token, id)
      .then(setDetail)
      .catch(() => toast.error("Erro ao carregar laudo"))
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleAddItem = async () => {
    if (!token || !id || !newItem.trim()) return;
    setAddingItem(true);
    try {
      const updated = await reportService.addItem(token, id, newItem.trim());
      setDetail(updated);
      setNewItem("");
    } catch {
      toast.error("Erro ao adicionar item");
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!token || !id) return;
    try {
      setDetail(await reportService.deleteItem(token, id, itemId));
    } catch {
      toast.error("Erro ao remover item");
    }
  };

  const handleItemUpdated = (updated: IReportDetailResponse) => {
    setDetail(updated);
  };

  const handleSend = async () => {
    if (!token || !id) return;
    setSending(true);
    try {
      setDetail(await reportService.send(token, id));
      toast.success("Pré-laudo enviado ao cliente!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar laudo";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleComplete = async () => {
    if (!token || !id) return;
    setCompleting(true);
    try {
      setDetail(await reportService.complete(token, id));
      toast.success("Laudo finalizado!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao finalizar laudo";
      toast.error(msg);
    } finally {
      setCompleting(false);
    }
  };

  const copyLink = (publicLink: string) => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!detail) return null;

  const { report, items, equipment, client } = detail;
  const status = STATUS[report.status] ?? { label: report.status, color: "bg-gray-100" };
  const isDraft = report.status === "draft";
  const canExecute = report.status === "approved";
  const isCompleted = report.status === "completed";
  const activeItems = items.filter(i => !i.rejected);
  const itemsCompleted = activeItems.filter(i => i.photoBefore && i.photoAfter).length;
  const publicLink = `${window.location.origin}/providers/${provider?.publicToken}/clients/${client.id}/equipment/${equipment.id}/laudo/${report.publicToken}`;

  const equipLabel = equipment.label
    || EQUIPMENT_TYPE_LABELS[equipment.type]
    || equipment.type
    || "Equipamento";

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <Badge className={status.color}>{status.label}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Laudo</CardTitle>
          <p className="text-sm text-gray-500">
            {client.name} · {equipLabel}
            {equipment.brand ? ` · ${equipment.brand}` : ""}
            {equipment.model ? ` ${equipment.model}` : ""}
          </p>
        </CardHeader>
        {!isDraft && (
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-700">Link público para o cliente</p>
              <div className="flex gap-2">
                <Input value={publicLink} readOnly className="text-xs font-mono bg-white" />
                <Button size="sm" variant="outline" onClick={() => copyLink(publicLink)}>
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a href={publicLink} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline"><ExternalLink className="w-4 h-4" /></Button>
                </a>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Itens do serviço {!isDraft && `(${itemsCompleted}/${activeItems.length} concluídos)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum item ainda. Adicione abaixo.</p>
          )}
          {items.map((item, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              index={idx + 1}
              isDraft={isDraft}
              canExecute={canExecute}
              isCompleted={isCompleted}
              token={token!}
              reportId={id!}
              onDelete={() => handleDeleteItem(item.id)}
              onUpdated={handleItemUpdated}
            />
          ))}

          {isDraft && (
            <div className="flex gap-2 pt-2">
              <Input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                placeholder="Ex: Trocar capacitor da unidade externa"
                onKeyDown={e => { if (e.key === "Enter" && newItem.trim()) handleAddItem(); }}
              />
              <Button onClick={handleAddItem} disabled={!newItem.trim() || addingItem}>
                {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isDraft && items.length > 0 && (
        !confirmSend ? (
          <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg"
            onClick={() => setConfirmSend(true)}>
            <Send className="w-4 h-4 mr-2" />
            Enviar pré-laudo para o cliente aprovar
          </Button>
        ) : (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-blue-900 font-medium">
              Após o envio, não será mais possível editar os itens do laudo. Confirma?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmSend(false)} disabled={sending}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Confirmar envio
              </Button>
            </div>
          </div>
        )
      )}

      {report.status === "sent" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4 text-sm text-yellow-900">
            Aguardando o cliente aprovar pelo link acima. Após a aprovação você poderá adicionar as fotos.
          </CardContent>
        </Card>
      )}

      {canExecute && (
        <Button className="w-full bg-green-600 hover:bg-green-700" size="lg"
          onClick={handleComplete}
          disabled={completing || itemsCompleted < activeItems.length}>
          {completing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          {itemsCompleted < activeItems.length
            ? `Faltam ${activeItems.length - itemsCompleted} item(ns) com fotos`
            : "Finalizar laudo"}
        </Button>
      )}

      {isCompleted && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4 text-sm text-green-900">
            Laudo concluído em {new Date(report.completedAt!).toLocaleString("pt-BR")}.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ItemCard({ item, index, isDraft, canExecute, isCompleted, token, reportId, onDelete, onUpdated }: {
  item: IReportItemResponse;
  index: number;
  isDraft: boolean;
  canExecute: boolean;
  isCompleted: boolean;
  token: string;
  reportId: string;
  onDelete: () => void;
  onUpdated: (updated: IReportDetailResponse) => void;
}) {
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  const handleSaveNotes = async () => {
    const trimmed = notes.trim();
    if (trimmed === (item.notes ?? "")) return;
    setSavingNotes(true);
    try {
      const updated = await reportService.updateItem(token, reportId, item.id, { notes: trimmed || null as unknown as string });
      onUpdated(updated);
    } catch {
      toast.error("Erro ao salvar nota");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleFile = async (file: File, kind: "before" | "after") => {
    setUploading(kind);
    try {
      const url = await uploadService.upload(token, file);
      const updated = await reportService.updateItem(token, reportId, item.id,
        kind === "before" ? { photoBefore: url } : { photoAfter: url }
      );
      onUpdated(updated);
    } catch {
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setUploading(null);
    }
  };

  const done = item.photoBefore && item.photoAfter;

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${done ? "bg-green-50 border-green-200" : ""}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm font-semibold text-gray-500 mt-0.5">{index}.</span>
        <p className={`text-sm flex-1 ${item.rejected ? "line-through text-gray-400" : ""}`}>
          {item.description}
        </p>
        {item.rejected && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full shrink-0">Não autorizado</span>
        )}
        {!item.rejected && done && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
        {isDraft && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>

      {!isDraft && !item.rejected && (
        <>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <PhotoSlot
              label="Antes"
              photo={item.photoBefore}
              disabled={!canExecute || isCompleted}
              uploading={uploading === "before"}
              onClick={() => beforeRef.current?.click()}
            />
            <PhotoSlot
              label="Depois"
              photo={item.photoAfter}
              disabled={!canExecute || !item.photoBefore || isCompleted}
              uploading={uploading === "after"}
              onClick={() => afterRef.current?.click()}
            />
            <input ref={beforeRef} type="file" accept="image/*" capture="environment" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f, "before"); e.target.value = ""; }} />
            <input ref={afterRef} type="file" accept="image/*" capture="environment" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f, "after"); e.target.value = ""; }} />
          </div>
          {canExecute ? (
            <textarea
              className="w-full mt-1 text-sm rounded border border-gray-200 bg-white p-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-50"
              rows={2}
              placeholder="Nota opcional..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              disabled={savingNotes}
            />
          ) : (notes || item.notes) ? (
            <p className="text-xs text-gray-600 mt-1 italic">{notes || item.notes}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

function PhotoSlot({ label, photo, disabled, uploading, onClick }: {
  label: string; photo: string | null; disabled: boolean; uploading: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || uploading}
      className="relative aspect-video rounded border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex flex-col items-center justify-center text-xs text-gray-500"
    >
      {photo ? (
        <>
          <img src={photo} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs">{label}</span>
        </>
      ) : uploading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <Camera className="w-5 h-5 mb-1" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
