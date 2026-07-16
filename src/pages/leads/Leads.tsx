import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Plus, Search, UserPlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRequireAccess } from "@/components/SubscriptionGate";
import { useAuth } from "@/contexts/authContext";
import { leadService, type ILeadResponse, type LeadStatus } from "@/services/lead";
import { LEAD_STATUS_LABEL, LEAD_STATUS_ORDER } from "@/services/enums";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/services/apiError";
import { CreateLeadDialog } from "./components/CreateLeadDialog";
import { ConvertLeadDialog } from "./components/ConvertLeadDialog";
import { LeadListItem } from "./components/LeadListItem";
import { LeadTimelineDialog } from "./components/LeadTimelineDialog";

const ALL = "__all__";

export function Leads() {
  const { token } = useAuth();
  const requireAccess = useRequireAccess();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<ILeadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | typeof ALL>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<ILeadResponse | null>(null);
  const [timelineLead, setTimelineLead] = useState<ILeadResponse | null>(null);
  const [deleteLead, setDeleteLead] = useState<ILeadResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    leadService.list(token)
      .then(setLeads)
      .catch(e => toast.error(getApiErrorMessage(e, "Erro ao carregar leads")))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = leads.filter(l => {
    const matchesSearch =
      (l.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    const matchesStatus = statusFilter === ALL || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (lead: ILeadResponse, status: LeadStatus) => {
    if (!token) return;
    try {
      const updated = await leadService.update(token, lead.id, { status });
      setLeads(prev => prev.map(l => (l.id === updated.id ? updated : l)));
      toast.success(`Status alterado para "${LEAD_STATUS_LABEL[status]}"`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao mudar status"));
    }
  };

  const handleConverted = (lead: ILeadResponse) => {
    setLeads(prev => prev.map(l => (l.id === lead.id ? lead : l)));
    if (lead.clientId) navigate(`/dashboard/clients/${lead.clientId}`);
  };

  const confirmDelete = async () => {
    if (!token || !deleteLead) return;
    setDeleting(true);
    try {
      await leadService.remove(token, deleteLead.id);
      setLeads(prev => prev.filter(l => l.id !== deleteLead.id));
      toast.success("Lead removido");
      setDeleteLead(null);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Erro ao remover lead"));
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-500 text-sm">{leads.length} leads no funil</p>
      </div>
      <Button
        className="bg-blue-600 hover:bg-blue-700 gap-2"
        onClick={() => requireAccess(() => setCreateOpen(true))}
      >
        <Plus className="w-4 h-4" /> Novo lead
      </Button>
    </div>
  );

  const searchAndFilters = (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter(ALL)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
            statusFilter === ALL ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todos
        </button>
        {LEAD_STATUS_ORDER.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {LEAD_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
    </div>
  );

  const listBody = loading ? (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
    </div>
  ) : filtered.length === 0 ? (
    <Card>
      <CardContent className="py-16 text-center">
        <UserPlus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg font-medium">
          {search || statusFilter !== ALL ? "Nenhum lead encontrado" : "Nenhum lead ainda"}
        </p>
        {!search && statusFilter === ALL && (
          <>
            <p className="text-gray-400 text-sm mt-1 mb-4">Cadastre um contato para começar a trabalhar o funil</p>
            <Button onClick={() => requireAccess(() => setCreateOpen(true))} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" /> Novo lead
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-3">
      {filtered.map(lead => (
        <LeadListItem
          key={lead.id}
          lead={lead}
          onStatusChange={handleStatusChange}
          onConvert={l => requireAccess(() => setConvertLead(l))}
          onDelete={setDeleteLead}
          onOpenTimeline={setTimelineLead}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      {header}
      {searchAndFilters}
      {listBody}

      {token && (
        <CreateLeadDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          token={token}
          onCreated={lead => setLeads(prev => [lead, ...prev])}
        />
      )}

      {token && (
        <ConvertLeadDialog
          open={convertLead !== null}
          onOpenChange={open => { if (!open) setConvertLead(null); }}
          token={token}
          lead={convertLead}
          onConverted={handleConverted}
        />
      )}

      {token && (
        <LeadTimelineDialog
          open={timelineLead !== null}
          onOpenChange={open => { if (!open) setTimelineLead(null); }}
          token={token}
          lead={timelineLead}
        />
      )}

      <ResponsiveModal
        open={deleteLead !== null}
        onOpenChange={open => { if (!open) setDeleteLead(null); }}
        title="Remover lead"
        description="O lead será apagado definitivamente. Esta ação não pode ser desfeita."
      >
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteLead(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Remover
          </Button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
