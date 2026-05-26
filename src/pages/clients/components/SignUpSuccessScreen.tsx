import { CheckCircle2 } from "lucide-react";
import type { Shift } from "@/services/enums";
import { formatScheduledShift } from "@/lib/shifts";

interface Props {
  providerName: string;
  scheduledDate: string;
  shift: Shift;
  shiftHours?: { startTime: string; endTime: string };
}

export function SignUpSuccessScreen({ providerName, scheduledDate, shift, shiftHours }: Props) {
  const formatted = formatScheduledShift(scheduledDate, shift, shiftHours);

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
