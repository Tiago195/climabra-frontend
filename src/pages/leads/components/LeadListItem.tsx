import { Phone, Trash2, UserPlus, ChevronRight, MessageCircleReply } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { type ILeadResponse, type LeadStatus } from "@/services/lead";
import { LEAD_STATUS_LABEL, LEAD_STATUS_CHIP, LEAD_SOURCE_LABEL, LEAD_SOURCE_BADGE } from "@/services/enums";

interface Props {
  lead: ILeadResponse;
  onStatusChange: (lead: ILeadResponse, status: LeadStatus) => void;
  onConvert: (lead: ILeadResponse) => void;
  onDelete: (lead: ILeadResponse) => void;
  onOpenTimeline: (lead: ILeadResponse) => void;
}

// Só status "de trabalho" no seletor — "converted" é atingido via conversão, não escolhido à mão.
const SELECTABLE_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "discarded"];

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export function LeadListItem({ lead, onStatusChange, onConvert, onDelete, onOpenTimeline }: Props) {
  const isConverted = lead.status === "converted";

  return (
    <div className="rounded-xl border bg-white border-gray-200 p-4" data-testid="lead-item">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
          {initials(lead.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <p className="font-semibold truncate text-gray-900">{lead.name ?? "Sem nome"}</p>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAD_STATUS_CHIP[lead.status]}`}
              data-testid="lead-status-chip"
            >
              {LEAD_STATUS_LABEL[lead.status]}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAD_SOURCE_BADGE[lead.source]}`}
              title="De onde este lead veio"
              data-testid="lead-source-badge"
            >
              {LEAD_SOURCE_LABEL[lead.source]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {lead.phone}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {isConverted ? (
          lead.clientId && (
            <Link to={`/dashboard/clients/${lead.clientId}`} className="flex-1 sm:flex-none">
              <Button variant="outline" size="sm" className="gap-1 w-full">
                Ver cliente <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )
        ) : (
          <>
            <Select
              value={lead.status}
              onValueChange={v => onStatusChange(lead, v as LeadStatus)}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Mudar status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTABLE_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{LEAD_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="gap-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => onConvert(lead)}
            >
              <UserPlus className="w-3.5 h-3.5" /> Converter em cliente
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-gray-500 hover:text-teal-700 ml-auto"
          aria-label="Ver conversa"
          data-testid="lead-timeline-btn"
          onClick={() => onOpenTimeline(lead)}
        >
          <MessageCircleReply className="w-4 h-4" /> Conversa
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-red-600"
          aria-label="Remover lead"
          onClick={() => onDelete(lead)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
