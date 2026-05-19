import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2 } from "lucide-react";

interface Props {
  date: Date;
  slots: string[];
  loading: boolean;
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
}

export function SignUpTimeSlotsCard({ date, slots, loading, selectedSlot, onSelectSlot }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Horários em {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">Nenhum horário disponível</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.map(slot => {
              const time = new Date(slot).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const selected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => onSelectSlot(slot)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >{time}</button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
