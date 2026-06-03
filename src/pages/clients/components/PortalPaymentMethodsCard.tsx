import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { AsaasDisclosure } from "@/components/AsaasDisclosure";
import { paymentMethodService, type IPaymentMethod } from "@/services/payment-method";
import { AddCardDialog } from "./AddCardDialog";
import { CardBrandIcon } from "./CardBrandIcon";

interface Props {
  publicToken: string;
  clientId: string;
}

export function PortalPaymentMethodsCard({ publicToken, clientId }: Props) {
  const [methods, setMethods] = useState<IPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<IPaymentMethod | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    paymentMethodService.list(publicToken, clientId)
      .then(setMethods)
      .catch(() => toast.error("Não foi possível carregar suas formas de pagamento"))
      .finally(() => setLoading(false));
  }, [publicToken, clientId]);

  const handleSetDefault = async (m: IPaymentMethod) => {
    setBusyId(m.id);
    try {
      await paymentMethodService.setDefault(publicToken, clientId, m.id);
      setMethods(prev =>
        prev.map(x => ({ ...x, isDefault: x.id === m.id })));
    } catch (err) {
      toast.error(apiError(err, "Erro ao definir o cartão padrão"));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    setBusyId(removing.id);
    try {
      await paymentMethodService.remove(publicToken, clientId, removing.id);
      // Refetch simples: o backend pode promover outro cartão a padrão.
      const fresh = await paymentMethodService.list(publicToken, clientId);
      setMethods(fresh);
      toast.success("Cartão removido");
    } catch (err) {
      toast.error(apiError(err, "Erro ao remover o cartão"));
    } finally {
      setBusyId(null);
      setRemoving(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Minhas formas de pagamento
          </p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="text-[11px] text-blue-600 font-medium flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : methods.length === 0 ? (
          <Card>
            <CardContent className="py-6 flex flex-col items-center text-center gap-2">
              <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </span>
              <p className="text-sm font-semibold text-gray-800">Nenhum cartão salvo ainda.</p>
              <p className="text-xs text-gray-500 px-4">
                Salve um cartão para pagar os laudos com mais rapidez, sem digitar tudo de novo.
              </p>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 gap-1 mt-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="w-4 h-4" /> Adicionar cartão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {methods.map(m => (
                <div key={m.id} className="flex items-start gap-3 p-3">
                  <CardBrandIcon brand={m.brand} />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        <span className="text-gray-400 tracking-wider">••••</span> {m.last4}
                      </span>
                      {m.isDefault && (
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-0 text-[10px] px-1.5 py-0 font-semibold">
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate uppercase tracking-wide">{m.holderName}</p>
                    {!m.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(m)}
                        disabled={busyId === m.id}
                        className="text-[11px] text-blue-600 font-semibold hover:underline disabled:opacity-50"
                      >
                        {busyId === m.id ? "..." : "Tornar padrão"}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoving(m)}
                    disabled={busyId === m.id}
                    aria-label={`Remover cartão final ${m.last4}`}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-50 shrink-0 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <AsaasDisclosure className="px-1" />
      </div>

      <AddCardDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        publicToken={publicToken}
        clientId={clientId}
        onAdded={card =>
          // 1º cartão já vem default; se vier um novo default, refletir nos demais.
          setMethods(prev => [
            ...prev.map(x => (card.isDefault ? { ...x, isDefault: false } : x)),
            card,
          ])
        }
      />

      <Dialog open={!!removing} onOpenChange={open => !open && setRemoving(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover este cartão?</DialogTitle>
          </DialogHeader>
          {removing && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                O cartão deixa de aparecer nas suas formas de pagamento. Você pode adicioná-lo de
                novo quando quiser.
              </p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <CardBrandIcon brand={removing.brand} />
                <span className="text-sm font-semibold text-gray-800">
                  <span className="text-gray-400 tracking-wider">••••</span> {removing.last4}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRemoving(null)}
              disabled={busyId === removing?.id}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleRemove}
              disabled={busyId === removing?.id}
            >
              {busyId === removing?.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function apiError(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
  );
}
