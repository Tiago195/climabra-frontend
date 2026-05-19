import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  providerPublicToken: string;
  clientId: string;
}

export function ClientPortalCard({ providerPublicToken, clientId }: Props) {
  const portalLink = `${window.location.origin}/providers/${providerPublicToken}/clients/${clientId}`;

  const handleCopyPortal = async () => {
    try {
      await navigator.clipboard.writeText(portalLink);
      toast.success("Link do portal copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Portal do cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
          <span className="text-sm text-gray-600 flex-1 truncate font-mono">{portalLink}</span>
          <a href={portalLink} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700 font-mono break-all">
          Código: {clientId}
        </div>
        <Button className="w-full gap-2" variant="outline" onClick={handleCopyPortal}>
          <Copy className="w-4 h-4" /> Copiar link do portal
        </Button>
        <p className="text-xs text-gray-400">
          Com este link, o cliente vê todos os ar-condicionados, visitas e laudos dele.
        </p>
      </CardContent>
    </Card>
  );
}
