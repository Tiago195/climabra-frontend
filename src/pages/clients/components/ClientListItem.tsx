import { Badge } from "@/components/ui/badge";
import { Phone, Mail, ChevronRight, Building2, Home, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { type IClientResponse } from "@/services/client";
import { colorFor, initialsFor } from "./mapColors";

interface Props {
  client: IClientResponse;
  /** Realce visual: cliente selecionado no mapa (split view desktop). */
  selected?: boolean;
  onHoverChange?: (hovering: boolean) => void;
}

export function ClientListItem({ client, selected, onHoverChange }: Props) {
  const bg = colorFor(client.clientType);
  const location = [client.neighborhood, client.city].filter(Boolean).join(", ");

  return (
    <Link
      to={`/dashboard/clients/${client.id}`}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={`block rounded-xl border transition-colors ${
        selected
          ? "bg-blue-50 border-blue-200"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="p-4 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: bg }}
        >
          {initialsFor(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <p className={`font-semibold capitalize truncate ${selected ? "text-blue-700" : "text-gray-900"}`}>
              {client.name}
            </p>
            {client.clientType === "residential" && (
              <Badge variant="outline" className="gap-1 text-gray-700 border-gray-200 bg-gray-100 text-[10px]">
                <Home className="w-3 h-3" /> Residencial
              </Badge>
            )}
            {client.clientType === "commercial" && (
              <Badge variant="outline" className="gap-1 text-blue-700 border-blue-200 bg-blue-50 text-[10px]">
                <Building2 className="w-3 h-3" /> Comercial
              </Badge>
            )}
            {(client.tags ?? []).slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {client.phone}
            </span>
            {client.email && (
              <span className="hidden sm:flex items-center gap-1 truncate">
                <Mail className="w-3 h-3" /> {client.email}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
      </div>
    </Link>
  );
}
