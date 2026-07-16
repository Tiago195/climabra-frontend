import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"

export function AvailabilityInfoCard() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="py-4 flex items-start gap-3">
        <CalendarDays className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Como funciona</p>
          <p className="text-sm text-blue-700">
            Configure os turnos (manhã, tarde, noite) de cada dia, com horário e quantas vagas por turno. Quando um cliente acessar o link de agendamento, ele verá apenas os turnos disponíveis com vagas restantes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
