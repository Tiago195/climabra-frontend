import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { type IClientResponse } from "@/services/client";

interface Props {
  client: IClientResponse;
}

export function ClientListItem({ client }: Props) {
  return (
    <Link to={`/dashboard/clients/${client.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 mb-1 capitalize">{client.name}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {client.phone}
                </span>
                {client.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" /> {client.email}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
