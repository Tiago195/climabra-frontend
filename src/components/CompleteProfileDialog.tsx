/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/authContext";
import { providerService } from "@/services/provider";
import { Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";

interface Ctx {
  requireProfile: (action: () => void) => void;
}
const ProfileGateContext = createContext<Ctx | null>(null);

export function ProfileGateProvider({ children }: { children: ReactNode }) {
  const { provider, token, updateProvider } = useAuth();
  const [open, setOpen] = useState(() => provider?.status === 'pending');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: provider?.name ?? "",
    phone: provider?.phone ?? "",
    companyName: provider?.companyName ?? "",
  });
  const pendingAction = useRef<(() => void) | null>(null);

  const requireProfile = useCallback((action: () => void) => {
    if (provider?.status !== 'pending') {
      action();
      return;
    }
    pendingAction.current = action;
    setForm({
      name: provider?.name ?? "",
      phone: provider?.phone ?? "",
      companyName: provider?.companyName ?? "",
    });
    setOpen(true);
  }, [provider]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error("Informe seu nome completo");
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      toast.error("Informe um telefone válido");
      return;
    }
    if (!token || !provider) return;
    setSaving(true);
    try {
      const updated = await providerService.update(token, provider.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        companyName: form.companyName.trim() || null,
      });
      updateProvider(updated);
      toast.success("Cadastro finalizado!");
      setOpen(false);
      const action = pendingAction.current;
      pendingAction.current = null;
      if (action) setTimeout(action, 100);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileGateContext.Provider value={{ requireProfile }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              Finalize seu cadastro
            </DialogTitle>
            <DialogDescription>
              Pra continuar, complete seus dados. Eles aparecem pros seus clientes nos links e laudos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input
                placeholder="João Silva"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone (WhatsApp) *</Label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome da empresa (opcional)</Label>
              <Input
                placeholder="Refrigeração JS"
                value={form.companyName}
                onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar e continuar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </ProfileGateContext.Provider>
  );
}

export function useRequireProfile() {
  const ctx = useContext(ProfileGateContext);
  if (!ctx) throw new Error("useRequireProfile must be used within ProfileGateProvider");
  return ctx.requireProfile;
}
