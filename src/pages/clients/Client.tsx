import { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Users, Link2, MapPinned, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useRequireAccess } from "@/components/SubscriptionGate";
import { useAuth } from "@/contexts/authContext";
import { clientService, type ClientType, type IClientResponse } from "@/services/client";
import { toast } from "sonner";
import { ClientListItem } from "./components/ClientListItem";
import { CreateClientDialog } from "./components/CreateClientDialog";
import { PublicLinkDialog } from "./components/PublicLinkDialog";
import { ClientMapPanel } from "./components/ClientMapPanel";
import { getApiErrorMessage } from "@/services/apiError";

const ALL = "__all__";

const TYPE_PILLS: { value: ClientType | typeof ALL; label: string }[] = [
  { value: ALL, label: "Todos" },
  { value: "commercial", label: "Comercial" },
  { value: "residential", label: "Residencial" },
];

export function Client() {
  const { provider, token } = useAuth();
  const requireAccess = useRequireAccess();
  const [clients, setClients] = useState<IClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClientType | typeof ALL>(ALL);
  const [tagFilter, setTagFilter] = useState<string>(ALL);
  const [open, setOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Split view (lista + mapa lado a lado) só em telas >= lg; monta apenas UM layout por vez
  // (em vez de esconder via CSS) para não instanciar um mapa Leaflet invisível/tamanho zero.
  const isDesktopSplit = useMediaQuery("(min-width: 1024px)");

  const signupUrl = provider?.publicToken
    ? `${window.location.origin}/providers/${provider.publicToken}/client`
    : "";

  useEffect(() => {
    if (!token) return;
    clientService.list(token)
      .then(setClients)
      .catch(e => toast.error(getApiErrorMessage(e, "Erro ao carregar clientes")))
      .finally(() => setLoading(false));
  }, [token]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => (c.tags ?? []).forEach(t => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [clients]);

  const withCoords = clients.filter(c => c.lat != null && c.lng != null).length;

  const filtered = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === ALL || c.clientType === typeFilter;
    const matchesTag = tagFilter === ALL || (c.tags ?? []).includes(tagFilter);
    return matchesSearch && matchesType && matchesTag;
  });

  const hasActiveFilters = typeFilter !== ALL || tagFilter !== ALL;

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 text-sm">{clients.length} clientes cadastrados</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="gap-2 flex-1 sm:flex-none"
          onClick={() => requireAccess(() => setSignupOpen(true))}
        >
          <Link2 className="w-4 h-4" /> Link público
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 gap-2 flex-1 sm:flex-none"
          onClick={() => requireAccess(() => setOpen(true))}
        >
          <Plus className="w-4 h-4" /> Novo cliente
        </Button>
      </div>
    </div>
  );

  const searchAndFilters = (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_PILLS.map(pill => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setTypeFilter(pill.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              typeFilter === pill.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {pill.label}
          </button>
        ))}
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-auto h-8 rounded-full border-none bg-gray-100 text-xs px-3.5 gap-1.5 [&>svg]:size-3.5">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-gray-500 h-8"
            onClick={() => { setTypeFilter(ALL); setTagFilter(ALL); }}
          >
            <X className="w-3.5 h-3.5" /> Limpar
          </Button>
        )}
      </div>
    </div>
  );

  const listBody = loading ? (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
    </div>
  ) : filtered.length === 0 ? (
    <Card>
      <CardContent className="py-16 text-center">
        <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg font-medium">
          {search || hasActiveFilters ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
        </p>
        {!search && !hasActiveFilters && (
          <p className="text-gray-400 text-sm mt-1 mb-4">Comece adicionando seu primeiro cliente</p>
        )}
        {!search && !hasActiveFilters && (
          <Button onClick={() => requireAccess(() => setOpen(true))} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" /> Adicionar cliente
          </Button>
        )}
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-3">
      {filtered.map(client => (
        <ClientListItem
          key={client.id}
          client={client}
          // Realce/hover só faz sentido acoplado ao split view (mouse + mapa); no mobile
          // (touch, sem mapa ao lado) evita "hover fantasma" após navegação/troca de layout.
          selected={isDesktopSplit && client.id === selectedId}
          onHoverChange={isDesktopSplit ? hovering => setSelectedId(hovering ? client.id : null) : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {header}

      {isDesktopSplit ? (
        // Desktop (>= lg): split view — lista e mapa visíveis ao mesmo tempo.
        <div className="flex gap-4 h-[calc(100dvh-13rem)] min-h-[520px]">
          <div className="w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-3 min-h-0">
            {searchAndFilters}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1">
              {listBody}
            </div>
            {!loading && clients.length > 0 && clients.length - withCoords > 0 && (
              <p className="text-xs text-gray-400 text-center pt-1">
                {clients.length - withCoords} sem endereço geocodado (fora do mapa)
              </p>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              <ClientMapPanel
                clients={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                heightClassName="h-full"
              />
            )}
          </div>
        </div>
      ) : (
        // Mobile / tablet (< lg): lista empilhada, mapa via link "Ver no mapa" (sem split).
        <div className="space-y-4">
          {searchAndFilters}
          {listBody}
          {!loading && clients.length > 0 && (
            <div className="flex justify-center pt-1">
              <Link to="/dashboard/clients/map">
                <Button variant="ghost" className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  <MapPinned className="w-4 h-4" /> Ver no mapa
                </Button>
              </Link>
            </div>
          )}
          {!loading && clients.length > 0 && clients.length - withCoords > 0 && (
            <p className="text-xs text-gray-400 text-center">
              {clients.length - withCoords} cliente{clients.length - withCoords > 1 ? "s" : ""} sem endereço geocodado (fora do mapa)
            </p>
          )}
        </div>
      )}

      <PublicLinkDialog
        open={signupOpen}
        onOpenChange={setSignupOpen}
        signupUrl={signupUrl}
      />

      {token && (
        <CreateClientDialog
          open={open}
          onOpenChange={setOpen}
          token={token}
          onCreated={client => setClients(prev => [client, ...prev])}
        />
      )}
    </div>
  );
}
