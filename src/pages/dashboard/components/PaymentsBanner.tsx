import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export function PaymentsBanner() {
  const navigate = useNavigate();
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="py-4 flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">Configure seus recebimentos para cobrar pelos laudos</p>
          <p className="text-xs text-amber-800 mt-0.5">
            Ative pagamentos por PIX, cartão e boleto e receba direto pelo app.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          onClick={() => navigate("/dashboard/settings")}
        >
          Configurar
        </Button>
      </CardContent>
    </Card>
  );
}
