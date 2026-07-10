import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Switch } from "@/components/ui/switch";
import { TagsEditor } from "@/components/TagsEditor";
import { Phone, Mail, MapPin, Pencil, Loader2, Building2, Home } from "lucide-react";
import { clientService, type ClientType, type IClientResponse } from "@/services/client";
import { toast } from "sonner";

function buildAddress(c: IClientResponse): string {
  const parts: string[] = [];
  if (c.street) parts.push(`${c.street}${c.streetNumber ? `, ${c.streetNumber}` : ""}`);
  if (c.complement) parts.push(c.complement);
  if (c.neighborhood) parts.push(c.neighborhood);
  if (c.city || c.state) parts.push([c.city, c.state].filter(Boolean).join("/"));
  if (c.cep) parts.push(`CEP ${c.cep}`);
  return parts.join(" - ");
}

const TYPE_META: Record<ClientType, { label: string; icon: typeof Home; className: string }> = {
  residential: { label: "Residencial", icon: Home, className: "bg-blue-100 text-blue-700 border-blue-200" },
  commercial: { label: "Comercial", icon: Building2, className: "bg-purple-100 text-purple-700 border-purple-200" },
};

interface Props {
  client: IClientResponse;
  token: string;
  onUpdated: (client: IClientResponse) => void;
}

/** Card de dados do cliente + segmentação (CRM F5, tasks 5.1/5.2/5.3). */
export function ClientInfoCard({ client, token, onUpdated }: Props) {
  const address = buildAddress(client);
  const typeMeta = client.clientType ? TYPE_META[client.clientType] : null;

  const [editing, setEditing] = useState(false);
  const [editType, setEditType] = useState<ClientType | "">(client.clientType ?? "");
  const [editTags, setEditTags] = useState<string[]>(client.tags ?? []);
  const [editOptOut, setEditOptOut] = useState<boolean>(client.notificationsOptOut ?? false);
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setEditType(client.clientType ?? "");
    setEditTags(client.tags ?? []);
    setEditOptOut(client.notificationsOptOut ?? false);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await clientService.updateSegment(token, client.id, {
        clientType: editType || undefined,
        clearClientType: !editType,
        tags: editTags,
        notificationsOptOut: editOptOut,
      });
      onUpdated(updated);
      setEditing(false);
      toast.success("Cliente atualizado!");
    } catch {
      toast.error("Erro ao atualizar cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{client.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={openEdit} className="shrink-0 -mt-1 -mr-2">
            <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {typeMeta ? (
            <Badge variant="outline" className={`gap-1 ${typeMeta.className}`}>
              <typeMeta.icon className="w-3 h-3" /> {typeMeta.label}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-400">Sem tipo</Badge>
          )}
          {(client.tags ?? []).map(tag => (
            <Badge key={tag} variant="secondary" className="text-[11px]">{tag}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{client.phone}</span>
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{client.email}</span>
          </div>
        )}
        {address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{address}</span>
          </div>
        )}
      </CardContent>

      <ResponsiveModal open={editing} onOpenChange={setEditing} title="Editar segmentação">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Tipo de cliente</Label>
            <Select value={editType || undefined} onValueChange={v => setEditType(v as ClientType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Não classificado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residencial</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
            {editType && (
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-gray-600"
                onClick={() => setEditType("")}
              >
                Limpar classificação
              </button>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Tags</Label>
            <TagsEditor tags={editTags} onChange={setEditTags} />
          </div>
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0">
              <Label className="text-xs">Não enviar mensagens automáticas</Label>
              <p className="text-[11px] text-gray-400">
                Respeita a preferência do cliente (LGPD). Não afeta o acesso ao portal.
              </p>
            </div>
            <Switch checked={editOptOut} onCheckedChange={setEditOptOut} />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </ResponsiveModal>
    </Card>
  );
}
