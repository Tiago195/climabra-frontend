import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { clientService } from "@/services/client";
import { getApiErrorMessage } from "@/services/apiError";

interface Props {
  publicToken: string;
  clientId: string;
  /** Recebe o JWT de sessão do cliente quando o código é validado. */
  onVerified: (token: string) => void;
}

/**
 * Tela de acesso por OTP (WhatsApp). Pede o código, mostra o telefone mascarado, valida e
 * devolve o token de sessão. Usada no portal do cliente e no checkout do laudo (Q5).
 */
export function PortalOtpGate({ publicToken, clientId, onVerified }: Props) {
  const [sent, setSent] = useState(false);
  const [phoneMasked, setPhoneMasked] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const requestCode = async () => {
    setSending(true);
    try {
      const res = await clientService.requestOtp(publicToken, clientId);
      setPhoneMasked(res.phoneMasked);
      setCooldown(res.resendInSeconds);
      setSent(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (code.trim().length < 4) {
      toast.error("Digite o código que você recebeu.");
      return;
    }
    setVerifying(true);
    try {
      const token = await clientService.verifyOtp(publicToken, clientId, code.trim());
      onVerified(token);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="py-8 space-y-5">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </span>
            <h1 className="text-lg font-bold text-gray-900">Acesso seguro</h1>
            <p className="text-sm text-gray-500">
              {sent
                ? <>Enviamos um código por WhatsApp para <span className="font-medium">{phoneMasked}</span>. Digite-o abaixo para continuar.</>
                : "Para proteger seus dados, vamos enviar um código de acesso ao seu WhatsApp."}
            </p>
          </div>

          {!sent ? (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 h-11 gap-2"
              onClick={requestCode}
              disabled={sending}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Enviar código pelo WhatsApp
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[0.4em] h-12"
              />
              <Button
                className="w-full bg-green-600 hover:bg-green-700 h-11 gap-2"
                onClick={verify}
                disabled={verifying}
              >
                {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                Validar e entrar
              </Button>
              <button
                type="button"
                className="w-full text-xs text-gray-500 disabled:opacity-50 hover:text-gray-700"
                onClick={requestCode}
                disabled={cooldown > 0 || sending}
              >
                {cooldown > 0 ? `Reenviar código em ${cooldown}s` : "Não recebeu? Reenviar código"}
              </button>
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center">
            Usamos seu WhatsApp só para confirmar sua identidade e proteger seus dados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
