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
            Configure os dias e horários que você atende. Quando um cliente acessar o link, ele verá apenas os horários disponíveis com base nestas configurações.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
