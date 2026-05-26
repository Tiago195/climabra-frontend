import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import AddressFieldsForm, { type AddressData } from "@/components/AddressFieldsForm";
import { clientService, type IClientResponse } from "@/services/client";
import { buildGeoKey, geocodeAddressWithTimeout } from "@/services/geocoding";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  client: IClientResponse;
  onUpdated: (client: IClientResponse) => void;
}

function clientToAddress(c: IClientResponse): AddressData {
  return {
    cep: c.cep ?? "",
    street: c.street ?? "",
    streetNumber: c.streetNumber != null ? String(c.streetNumber) : "",
    complement: c.complement ?? "",
    neighborhood: c.neighborhood ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
  };
}

export function EditClientDialog({ open, onOpenChange, token, client, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: client.name, phone: client.phone, email: client.email });
  const [address, setAddress] = useState<AddressData>(() => clientToAddress(client));

  useEffect(() => {
    if (open) {
      setForm({ name: client.name, phone: client.phone, email: client.email });
      setAddress(clientToAddress(client));
    }
  }, [open, client]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const streetNumber = parseInt(address.streetNumber);
    if (!address.streetNumber || isNaN(streetNumber)) {
      toast.error("Informe o número do endereço");
      return;
    }
    setSaving(true);
    try {
      const originalKey = buildGeoKey({
        street: client.street,
        streetNumber: client.streetNumber,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        cep: client.cep,
      });
      const newAddr = {
        street: address.street,
        streetNumber: address.streetNumber,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        cep: address.cep,
      };
      const newKey = buildGeoKey(newAddr);
      const addressChanged = originalKey !== newKey;

      let lat: number | null | undefined = undefined;
      let lng: number | null | undefined = undefined;
      if (addressChanged) {
        const coords = await geocodeAddressWithTimeout(newAddr, 4000);
        lat = coords?.lat ?? null;
        lng = coords?.lng ?? null;
      }

      const updated = await clientService.update(token, client.id, {
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
        ...(addressChanged ? { lat, lng } : {}),
      });
      onUpdated(updated);
      onOpenChange(false);
      toast.success("Cliente atualizado!");
    } catch {
      toast.error("Erro ao atualizar cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
              maxLength={15}
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
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
            Salvar alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
