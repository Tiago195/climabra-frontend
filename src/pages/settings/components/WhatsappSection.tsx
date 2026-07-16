import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  Unplug,
  Users,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/authContext";
import {
  whatsappService,
  formatConnectedPhone,
  type IWhatsappStatus,
  type ILeadSyncConfig,
} from "@/services/whatsapp";
import { getApiErrorMessage } from "@/services/apiError";

/**
 * Seção "Conectar meu WhatsApp" do Settings (Fase 1 do PLANO_MENSAGERIA_PROVIDER). Mobile-first.
 *
 * Estados: `none` (card de permissão + botão Conectar) → `connecting` (mostra o QR e faz poll do
 * status) → `connected` ("Conectado como +55…" + Desconectar) → `disconnected` (CTA reconectar).
 *
 * As mensagens AO CLIENTE (recibo/laudo/lembrete) passarão a sair do número do provider (Fase 2);
 * aqui a copy é honesta: não trava o número dele e é um canal não-oficial (fora da Meta).
 */
export function WhatsappSection() {
  const { token } = useAuth();
  const [state, setState] = useState<IWhatsappStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Sync de leads por marcador (Fase 2 do PLANO_CRM_WHATSAPP — Bloco A) ──────
  const [leadSync, setLeadSync] = useState<ILeadSyncConfig | null>(null);
  const [markerDraft, setMarkerDraft] = useState("");
  const [savingSync, setSavingSync] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return undefined;
    try {
      const s = await whatsappService.status(token);
      setState(s);
      if (s.status === "connected") {
        setQrCode(null);
        stopPolling();
      } else if (s.status === "connecting" && s.qrCode) {
        // QR vivo: o QR rotaciona (~40–60s) e vem pelo poll; troca a imagem só quando muda.
        setQrCode((prev) => (prev !== s.qrCode ? s.qrCode! : prev));
      }
      return s;
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao carregar o WhatsApp"));
      return undefined;
    }
  }, [token, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(refresh, 3000);
  }, [refresh, stopPolling]);

  // No mount: 1 refresh e, se o canal JÁ estiver `connecting` (reload/F5 no meio do pareamento),
  // liga o poll para o QR rotacionar e virar `connected` ao escanear — sem depender do clique em
  // Conectar. `startPolling` faz `stopPolling` antes (sem intervals duplicados) e o cleanup do
  // unmount continua cobrindo. `none`/`connected`/`disconnected` no load seguem sem poll.
  useEffect(() => {
    refresh().then((s) => {
      if (s?.status === "connecting") startPolling();
    });
    return stopPolling;
  }, [refresh, startPolling, stopPolling]);

  // Carrega a config do sync de leads quando (e só quando) o canal está conectado.
  const isConnected = state?.status === "connected";
  useEffect(() => {
    if (!token || !isConnected) {
      setLeadSync(null);
      return;
    }
    let alive = true;
    whatsappService
      .getLeadSync(token)
      .then((cfg) => {
        if (!alive) return;
        setLeadSync(cfg);
        setMarkerDraft(cfg.marker);
      })
      .catch((e) => toast.error(getApiErrorMessage(e, "Erro ao carregar a importação de contatos")));
    return () => {
      alive = false;
    };
  }, [token, isConnected]);

  /** Liga/desliga o sync (salva a config; ao LIGAR, dispara um scan explícito da agenda). */
  const toggleSync = async (enabled: boolean) => {
    if (!token) return;
    setSavingSync(true);
    try {
      const marker = markerDraft.trim() || undefined;
      const cfg = await whatsappService.updateLeadSync(token, { enabled, marker });
      setLeadSync(cfg);
      setMarkerDraft(cfg.marker);
      if (enabled) {
        await runScan(true);
      } else {
        toast.success("Importação de contatos desativada.");
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível salvar a importação"));
    } finally {
      setSavingSync(false);
    }
  };

  /**
   * Liga/desliga o opt-in de lead por mensagem recebida (D5). Independe do import da agenda: manda
   * o `enabled`/`marker` atuais para não mexer no sync, só troca o `inboundEnabled`.
   */
  const toggleInbound = async (inboundEnabled: boolean) => {
    if (!token || !leadSync) return;
    setSavingSync(true);
    try {
      const cfg = await whatsappService.updateLeadSync(token, {
        enabled: leadSync.enabled,
        marker: markerDraft.trim() || undefined,
        inboundEnabled,
      });
      setLeadSync(cfg);
      setMarkerDraft(cfg.marker);
      toast.success(
        inboundEnabled
          ? "Agora quem te manda mensagem vira lead."
          : "Mensagens de números desconhecidos não vão mais criar lead.",
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível salvar a preferência"));
    } finally {
      setSavingSync(false);
    }
  };

  /** Persiste o marcador editado (no blur), mantendo o estado ligado/desligado atual. */
  const saveMarker = async () => {
    if (!token || !leadSync) return;
    const marker = markerDraft.trim();
    if (!marker || marker === leadSync.marker) {
      setMarkerDraft(leadSync.marker);
      return;
    }
    setSavingSync(true);
    try {
      const cfg = await whatsappService.updateLeadSync(token, { enabled: leadSync.enabled, marker });
      setLeadSync(cfg);
      setMarkerDraft(cfg.marker);
      toast.success("Marcador atualizado.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível salvar o marcador"));
    } finally {
      setSavingSync(false);
    }
  };

  /** Reprocessar: importa os contatos da agenda com o marcador. `silent` no auto-scan do toggle. */
  const runScan = async (silent = false) => {
    if (!token) return;
    setReprocessing(true);
    try {
      const res = await whatsappService.scanLeadSync(token);
      setLeadSync((prev) => (prev ? { ...prev, importedCount: res.importedCount } : prev));
      toast.success(
        res.imported > 0
          ? `${res.imported} ${res.imported === 1 ? "novo lead importado" : "novos leads importados"} da agenda.`
          : silent
            ? "Importação ativada. Nenhum contato novo com o marcador por enquanto."
            : "Nenhum contato novo com o marcador para importar.",
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível importar os contatos agora"));
    } finally {
      setReprocessing(false);
    }
  };

  const connect = async () => {
    if (!token) return;
    setConnecting(true);
    try {
      const res = await whatsappService.connect(token);
      setQrCode(res.qrCode);
      setState(prev => ({
        status: "connecting",
        available: prev?.available ?? true,
        connectedPhone: null,
        connectedSince: null,
      }));
      startPolling();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível gerar o QR agora"));
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!token) return;
    setDisconnecting(true);
    try {
      const s = await whatsappService.disconnect(token);
      setState(s);
      setQrCode(null);
      stopPolling();
      toast.success("WhatsApp desconectado.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Não foi possível desconectar"));
    } finally {
      setDisconnecting(false);
    }
  };

  if (!state) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
      </div>
    );
  }

  const status = state.status;
  const showQr = (status === "connecting" || (status === "disconnected" && qrCode)) && qrCode;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-900">Meu WhatsApp</h3>
            {status === "connected" && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
              </span>
            )}
          </div>

          {!state.available && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                A conexão de WhatsApp não está disponível neste ambiente no momento. Tente novamente
                mais tarde.
              </p>
            </div>
          )}

          {/* ── none: permissão + explicação ─────────────────────────────── */}
          {status === "none" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Conecte o seu WhatsApp para que os avisos aos seus clientes (recibo, laudo, lembrete
                e "estou a caminho") saiam do <strong>seu próprio número</strong> — mais confiança e
                proximidade no atendimento.
              </p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  Você continua usando o WhatsApp normalmente no celular — o número{" "}
                  <strong>não fica travado</strong>.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  A conexão é feita lendo um QR Code, como no WhatsApp Web. Você pode desconectar
                  quando quiser.
                </li>
              </ul>
              <Button onClick={connect} disabled={connecting || !state.available} className="w-full sm:w-auto">
                {connecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Conectar meu WhatsApp
              </Button>
            </div>
          )}

          {/* ── connecting / reconnecting: QR ────────────────────────────── */}
          {showQr && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Abra o WhatsApp no seu celular → <strong>Aparelhos conectados</strong> →{" "}
                <strong>Conectar um aparelho</strong> e aponte a câmera para o código abaixo.
              </p>
              <div className="flex flex-col items-center gap-3">
                <img
                  src={qrCode}
                  alt="QR Code para conectar o WhatsApp"
                  data-testid="whatsapp-qr"
                  className="w-56 h-56 rounded-md border border-gray-200 bg-white"
                />
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Aguardando a leitura do QR…
                </span>
              </div>
            </div>
          )}

          {status === "connecting" && !qrCode && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Gerando o QR Code…
            </div>
          )}

          {/* ── connected ────────────────────────────────────────────────── */}
          {status === "connected" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-3">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Conectado como {formatConnectedPhone(state.connectedPhone) || "seu WhatsApp"}
                  </p>
                  <p className="text-xs text-green-700">
                    Os avisos aos clientes vão sair deste número.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={disconnect}
                disabled={disconnecting}
                className="w-full sm:w-auto"
              >
                {disconnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Unplug className="w-4 h-4 mr-2" />
                )}
                Desconectar
              </Button>
            </div>
          )}

          {/* ── disconnected: reconectar ─────────────────────────────────── */}
          {status === "disconnected" && !qrCode && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Seu WhatsApp foi desconectado. Enquanto isso, os avisos aos clientes saem pelo
                  número da plataforma. Reconecte para voltar a usar o seu número.
                </p>
              </div>
              <Button onClick={connect} disabled={connecting || !state.available} className="w-full sm:w-auto">
                {connecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reconectar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Importar clientes da agenda (Fase 2, Bloco A) — só quando conectado ── */}
      {isConnected && leadSync && (
        <Card data-testid="lead-sync-card">
          <CardContent className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">Importar clientes da agenda</h3>
            </div>

            <p className="text-sm text-gray-600">
              Salve o contato no seu celular com um <strong>marcador</strong> no nome (ex.:{" "}
              <em>"Cliente João"</em>) e ele entra automaticamente na sua lista de{" "}
              <strong>Leads</strong>. Salvar com o marcador é o que seleciona quem entra.
            </p>

            <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Importação automática</p>
                <p className="text-xs text-gray-500">
                  {leadSync.importedCount > 0
                    ? `${leadSync.importedCount} ${leadSync.importedCount === 1 ? "lead importado" : "leads importados"} da agenda`
                    : "Nenhum lead importado ainda"}
                </p>
              </div>
              <Switch
                checked={leadSync.enabled}
                disabled={savingSync}
                onCheckedChange={toggleSync}
                aria-label="Ativar importação de contatos da agenda"
                data-testid="lead-sync-toggle"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lead-marker" className="text-xs text-gray-600">
                Marcador no nome do contato
              </Label>
              <Input
                id="lead-marker"
                value={markerDraft}
                onChange={(e) => setMarkerDraft(e.target.value)}
                onBlur={saveMarker}
                placeholder="cliente"
                maxLength={60}
                disabled={savingSync}
                data-testid="lead-marker-input"
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500">
                Não diferencia maiúsculas de minúsculas e vale em qualquer posição do nome
                ("Cliente João", "João (cliente)").
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => runScan(false)}
              disabled={!leadSync.enabled || reprocessing || savingSync}
              className="w-full sm:w-auto"
              data-testid="lead-sync-reprocess"
            >
              {reprocessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Reprocessar
            </Button>

            <div className="flex items-start gap-2 rounded-md bg-gray-50 border border-gray-200 p-3">
              <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                A importação é <strong>melhor esforço</strong>: lê os contatos salvos e não garante
                trazer 100% da agenda. Quem já é cliente não vira lead. Para remover um lead
                importado, use a tela de <strong>Leads</strong>.
              </p>
            </div>

            {/* ── Opt-in: lead de quem manda mensagem (D5 — Bloco B) ─────────── */}
            <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Criar lead de quem me manda mensagem
                </p>
                <p className="text-xs text-gray-500">
                  Desligado: mensagens de números desconhecidos não criam lead nem ficam registradas.
                </p>
              </div>
              <Switch
                checked={leadSync.inboundEnabled}
                disabled={savingSync}
                onCheckedChange={toggleInbound}
                aria-label="Criar lead de quem me manda mensagem"
                data-testid="lead-inbound-toggle"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
