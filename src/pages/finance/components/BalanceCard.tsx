import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Clock3, AlertCircle, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import type { IBalance } from "@/services/finance";
import type { IAnticipationLimits } from "@/services/anticipation";
import { MIN_PAYOUT_CENTS } from "@/services/payout";
import { formatCents } from "@/lib/utils";
import { AsaasDisclosure } from "@/components/AsaasDisclosure";

/**
 * Saldo da conta de recebimento (Saque · F1).
 *
 * Existe porque "Recebido" (tabela local) e "dinheiro que dá pra tirar" são coisas diferentes: o
 * cliente paga no cartão hoje, o valor só libera em D+30. Sem separar as duas coisas, o provider
 * olha o Financeiro, vê R$ 3.000 "recebidos" e acha que sumiu dinheiro.
 *
 * Nunca renderiza R$ 0,00 quando a consulta falha — erro vira card de retry (regra do Financeiro).
 */
export function BalanceCard({
  balance, loading, error, onRetry, canPayout, onPayout, limits,
}: {
  balance: IBalance | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** Tem destino cadastrado, fora do cooldown de 24h? Sem isso o saque nem começa. */
  canPayout: boolean;
  onPayout: () => void;
  /**
   * Limite de antecipação (PLANO_ANTECIPACAO · F1). `null` = ainda carregando, falhou, ou conta em
   * análise. O card NÃO trata isso como erro: antecipação é um extra em cima do saldo, e derrubar
   * o card inteiro porque o limite não veio seria trocar uma informação essencial por uma opcional.
   */
  limits: IAnticipationLimits | null;
}) {
  if (loading) return <Skeleton className="h-32" />;

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-2 flex-1">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600">
              Não foi possível consultar seu saldo agora.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry} className="w-full sm:w-auto">
            Tentar de novo
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Provider que nunca conectou pagamentos: não é erro nem saldo zero — é "não tem conta".
  if (!balance || !balance.hasGatewayAccount) {
    return (
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-gray-600 flex-1">
            Conecte os pagamentos para receber pelo app e acompanhar seu saldo.
          </p>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link to="/dashboard/settings">Conectar pagamentos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
              <Landmark className="w-4 h-4 text-emerald-600" />
              Disponível para saque
            </div>
            <p data-testid="balance-available" className="text-2xl font-bold text-gray-900 mt-1">
              {formatCents(balance.availableCents)}
            </p>
            <Button
              size="sm"
              className="mt-2 w-full sm:w-auto"
              onClick={onPayout}
              disabled={!balance.payoutEnabled || !canPayout || balance.availableCents < MIN_PAYOUT_CENTS}
            >
              Sacar
            </Button>
            {/* Saldo suficiente + conta aprovada, mas sem destino cadastrado: diz o que falta. */}
            {balance.payoutEnabled && !canPayout && (
              <p className="text-xs text-gray-500 mt-1.5">
                <Link to="/dashboard/settings" className="underline font-medium">
                  Cadastre a chave PIX
                </Link>{" "}
                para poder sacar.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
              <Clock3 className="w-4 h-4 text-amber-500" />
              A liberar
            </div>
            <p data-testid="balance-pending" className="text-2xl font-bold text-gray-500 mt-1">
              {formatCents(balance.pendingCents)}
            </p>
            {/*
              Antes aqui havia só "Pagamentos no cartão liberam em até 30 dias." — um beco sem saída:
              informava o problema e não oferecia nada. Agora diz quanto dá para antecipar.

              Silencioso de propósito quando o limite não veio (loading/erro/conta em análise): o
              provider continua vendo o "a liberar" e o prazo, sem um erro que ele não pode resolver.
            */}
            {limits?.anticipationEnabled && limits.availableCents > 0 ? (
              <p data-testid="anticipation-available" className="text-xs text-gray-500 mt-0.5">
                Cartão libera em até 30 dias —{" "}
                <span className="font-medium text-gray-700">
                  até {formatCents(limits.availableCents)}
                </span>{" "}
                pode ser antecipado.
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">
                Pagamentos no cartão liberam em até 30 dias.
              </p>
            )}
          </div>
        </div>

        {/* Gate do saque: a conta pode cobrar e ainda não poder sacar (aprovação total pendente). */}
        {!balance.payoutEnabled && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">Saque ainda não liberado</p>
              <p className="text-amber-800 text-xs mt-0.5">
                Sua conta de recebimento está em análise. Conclua o cadastro para poder sacar —{" "}
                <Link to="/dashboard/settings" className="underline font-medium">
                  ver pendências
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        <AsaasDisclosure />
      </CardContent>
    </Card>
  );
}
