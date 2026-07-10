import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import AddressFieldsForm, { emptyAddress, type AddressData } from "@/components/AddressFieldsForm";
import { TagsEditor } from "@/components/TagsEditor";
import { clientService, type ClientType, type IClientResponse } from "@/services/client";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onCreated: (client: IClientResponse) => void;
}

export function CreateClientDialog({ open, onOpenChange, token, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [address, setAddress] = useState<AddressData>(emptyAddress);
  const [clientType, setClientType] = useState<ClientType | "">("");
  const [tags, setTags] = useState<string[]>([]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error("Informe o email do cliente");
      return;
    }
    const streetNumber = parseInt(address.streetNumber);
    if (!address.streetNumber || isNaN(streetNumber)) {
      toast.error("Informe o número do endereço");
      return;
    }
    setSaving(true);
    try {
      const created = await clientService.create(token, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        cep: address.cep.replace(/\D/g, ""),
        street: address.street,
        streetNumber,
        complement: address.complement || undefined,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        clientType: clientType || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      onCreated(created);
      onOpenChange(false);
      setForm({ name: "", phone: "", email: "" });
      setAddress(emptyAddress);
      setClientType("");
      setTags([]);
      toast.success("Cliente cadastrado!");
    } catch (err) {
      // surfacia a mensagem do backend (ex.: 422 "número não tem WhatsApp"); fallback genérico
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erro ao cadastrar cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Cadastrar novo cliente">
        <form onSubmit={handleCreate} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              placeholder="Nome do cliente"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input
              type="tel"
              placeholder="(11) 99999-9999"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
              maxLength={15}
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="cliente@email.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de cliente</Label>
            <Select value={clientType || undefined} onValueChange={v => setClientType(v as ClientType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Não classificado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residencial</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagsEditor tags={tags} onChange={setTags} />
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Endereço</p>
            <AddressFieldsForm value={address} onChange={setAddress} />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Cadastrar e gerar link
          </Button>
        </form>
    </ResponsiveModal>
  );
}
