import { CheckCircle2 } from "lucide-react";

interface Props {
  providerName: string;
  scheduledAt: string;
}

export function SignUpSuccessScreen({ providerName, scheduledAt }: Props) {
  const formatted = new Date(scheduledAt).toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Agendamento confirmado!</h2>
        <p className="text-gray-500">Sua visita está marcada para {formatted}.</p>
        <p className="text-sm text-gray-400">{providerName} entrará em contato em breve.</p>
      </div>
    </div>
  );
}
