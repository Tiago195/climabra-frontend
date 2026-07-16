import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { leadService, type ILeadResponse } from "@/services/lead";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";
import { getApiErrorMessage, getFieldErrors } from "@/services/apiError";
import { FieldError } from "@/components/ui/field-error";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onCreated: (lead: ILeadResponse) => void;
}

export function CreateLeadDialog({ open, onOpenChange, token, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome do lead");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Informe o telefone do lead");
      return;
    }
    setFieldErrors(null);
    setSaving(true);
    try {
      const created = await leadService.create(token, {
        name: form.name.trim(),
        phone: form.phone,
      });
      onCreated(created);
      onOpenChange(false);
      setForm({ name: "", phone: "" });
      toast.success("Lead cadastrado!");
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields) {
        setFieldErrors(fields);
      } else {
        // surfacia a mensagem do backend (dedup 400, "sem WhatsApp" 422); fallback genérico
        toast.error(getApiErrorMessage(err, "Erro ao cadastrar lead"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Novo lead">
      <form onSubmit={handleCreate} className="space-y-4 mt-2">
        <div className="space-y-2">
          <Label>Nome *</Label>
          <Input
            placeholder="Nome do contato"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            aria-invalid={!!fieldErrors?.name}
          />
          <FieldError message={fieldErrors?.name} />
        </div>
        <div className="space-y-2">
          <Label>Telefone (WhatsApp) *</Label>
          <Input
            type="tel"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
            maxLength={15}
            aria-invalid={!!fieldErrors?.phone}
          />
          <FieldError message={fieldErrors?.phone} />
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Cadastrar lead
        </Button>
      </form>
    </ResponsiveModal>
  );
}
