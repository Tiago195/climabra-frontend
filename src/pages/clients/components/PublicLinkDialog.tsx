import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signupUrl: string;
}

export function PublicLinkDialog({ open, onOpenChange, signupUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(signupUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link para novos clientes</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-sm text-gray-600">
            Compartilhe esse link com pessoas que ainda não são suas clientes. Elas vão preencher os dados e agendar a visita em uma única tela.
          </p>
          <div className="flex gap-2">
            <Input value={signupUrl} readOnly className="text-xs font-mono" />
            <Button onClick={copyLink} className="bg-blue-600 hover:bg-blue-700 gap-2 flex-shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Este link é permanente. Qualquer pessoa que acessar pode se cadastrar e agendar uma visita.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
