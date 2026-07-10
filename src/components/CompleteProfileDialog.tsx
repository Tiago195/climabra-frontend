/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/authContext";
import { providerService } from "@/services/provider";
import { Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";
import { getApiErrorMessage } from "@/services/apiError";

interface Ctx {
  requireProfile: (action: () => void) => void;
}
const ProfileGateContext = createContext<Ctx | null>(null);

export function ProfileGateProvider({ children }: { children: ReactNode }) {
  const { provider, token, updateProvider } = useAuth();
  const [open, setOpen] = useState(() => provider?.status === 'pending');
  // 2 passos: preencher dados → confirmar o código enviado ao WhatsApp (prova de posse).
  const [step, setStep] = useState<"form" | "code">("form");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [form, setForm] = useState({
    name: provider?.name ?? "",
    phone: provider?.phone ?? "",
    companyName: provider?.companyName ?? "",
  });
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

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
    setStep("form");
    setCode("");
    setOpen(true);
  }, [provider]);

  // Passo 1 → envia o código de confirmação ao WhatsApp informado.
  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error("Informe seu nome completo");
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      toast.error("Informe um telefone válido");
      return;
    }
    if (!token) return;
    setSending(true);
    try {
      const res = await providerService.requestPhoneOtp(token, form.phone.trim());
      setPhoneMasked(res.phoneMasked);
      setCooldown(res.resendInSeconds);
      setStep("code");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  // Passo 2 → valida o código e finaliza o cadastro (telefone confirmado).
  const confirm = async () => {
    if (code.trim().length < 4) {
      toast.error("Digite o código que você recebeu no WhatsApp.");
      return;
    }
    if (!token) return;
    setConfirming(true);
    try {
      const updated = await providerService.confirmPhone(token, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        companyName: form.companyName.trim() || null,
        code: code.trim(),
      });
      updateProvider(updated);
      toast.success("Cadastro finalizado!");
      setOpen(false);
      const action = pendingAction.current;
      pendingAction.current = null;
      if (action) setTimeout(action, 100);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ProfileGateContext.Provider value={{ requireProfile }}>
      {children}
      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title={
          <span className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            Finalize seu cadastro
          </span>
        }
        description={
          step === "form"
            ? "Pra continuar, complete seus dados. Vamos confirmar seu WhatsApp com um código — é por ele que seus clientes e o sistema falam com você."
            : <>Enviamos um código por WhatsApp para <span className="font-medium">{phoneMasked}</span>. Digite-o para confirmar o número.</>
        }
      >
          {step === "form" ? (
            <form onSubmit={sendCode} className="space-y-4 mt-2">
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
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Enviar código pelo WhatsApp
              </Button>
            </form>
          ) : (
            <div className="space-y-4 mt-2">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[0.4em] h-12"
                autoFocus
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={confirm} disabled={confirming}>
                {confirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirmar e finalizar
              </Button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setStep("form")}
                >
                  ← Corrigir número
                </button>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  onClick={() => sendCode()}
                  disabled={cooldown > 0 || sending}
                >
                  {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
                </button>
              </div>
            </div>
          )}
      </ResponsiveModal>
    </ProfileGateContext.Provider>
  );
}

export function useRequireProfile() {
  const ctx = useContext(ProfileGateContext);
  if (!ctx) throw new Error("useRequireProfile must be used within ProfileGateProvider");
  return ctx.requireProfile;
}
