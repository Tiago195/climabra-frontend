import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import AddressFieldsForm, { emptyAddress, type AddressData } from "@/components/AddressFieldsForm";
import { clientService, type IClientResponse } from "@/services/client";
import { toast } from "sonner";

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
      });
      onCreated(created);
      onOpenChange(false);
      setForm({ name: "", phone: "", email: "" });
      setAddress(emptyAddress);
      toast.success("Cliente cadastrado!");
    } catch {
      toast.error("Erro ao cadastrar cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar novo cliente</DialogTitle>
        </DialogHeader>
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
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
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
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Endereço</p>
            <AddressFieldsForm value={address} onChange={setAddress} />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Cadastrar e gerar link
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
