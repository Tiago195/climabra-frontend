import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, User, Phone } from "lucide-react";
import AddressFieldsForm, { emptyAddress, type AddressData } from "@/components/AddressFieldsForm";
import { leadService, type ILeadResponse } from "@/services/lead";
import { toast } from "sonner";
import { getApiErrorMessage, getFieldErrors } from "@/services/apiError";
import { FieldError } from "@/components/ui/field-error";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  lead: ILeadResponse | null;
  /** Chamado após converter — recebe o lead atualizado (status=converted, clientId preenchido). */
  onConverted: (lead: ILeadResponse) => void;
}

/**
 * Conversão Lead → Client: o form pede SÓ o que falta para um cliente completo (e-mail + endereço).
 * Nome e telefone vêm do lead (exibidos, não editáveis aqui). Ao converter, o caller navega para o
 * cliente recém-criado (via `lead.clientId`).
 */
export function ConvertLeadDialog({ open, onOpenChange, token, lead, onConverted }: Props) {
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<AddressData>(emptyAddress);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  const handleConvert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lead) return;
    if (!email.trim()) {
      toast.error("Informe o email do cliente");
      return;
    }
    const streetNumber = parseInt(address.streetNumber);
    if (!address.streetNumber || isNaN(streetNumber)) {
      toast.error("Informe o número do endereço");
      return;
    }
    setFieldErrors(null);
    setSaving(true);
    try {
      const converted = await leadService.convert(token, lead.id, {
        email: email.trim(),
        cep: address.cep.replace(/\D/g, ""),
        street: address.street,
        streetNumber,
        complement: address.complement || undefined,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      });
      onConverted(converted);
      onOpenChange(false);
      setEmail("");
      setAddress(emptyAddress);
      toast.success("Lead convertido em cliente!");
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields) {
        setFieldErrors(fields);
      } else {
        toast.error(getApiErrorMessage(err, "Erro ao converter lead"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Converter em cliente">
      <form onSubmit={handleConvert} className="space-y-4 mt-2">
        {lead && (
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-1">
            <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <User className="w-4 h-4 text-gray-400" /> {lead.name ?? "Sem nome"}
            </p>
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="w-3.5 h-3.5" /> {lead.phone}
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            placeholder="cliente@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors?.email}
          />
          <FieldError message={fieldErrors?.email} />
        </div>
        <div className="pt-2 border-t">
          <p className="text-sm font-medium text-gray-700 mb-3">Endereço</p>
          <AddressFieldsForm value={address} onChange={setAddress} errors={fieldErrors ?? undefined} />
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Converter em cliente
        </Button>
      </form>
    </ResponsiveModal>
  );
}
