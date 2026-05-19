import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import { type IClientResponse } from "@/services/client";

function buildAddress(c: IClientResponse): string {
  const parts: string[] = [];
  if (c.street) parts.push(`${c.street}${c.streetNumber ? `, ${c.streetNumber}` : ""}`);
  if (c.complement) parts.push(c.complement);
  if (c.neighborhood) parts.push(c.neighborhood);
  if (c.city || c.state) parts.push([c.city, c.state].filter(Boolean).join("/"));
  if (c.cep) parts.push(`CEP ${c.cep}`);
  return parts.join(" - ");
}

interface Props {
  client: IClientResponse;
}

export function ClientInfoCard({ client }: Props) {
  const address = buildAddress(client);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{client.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{client.phone}</span>
        </div>
        {client.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{client.email}</span>
          </div>
        )}
        {address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{address}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
