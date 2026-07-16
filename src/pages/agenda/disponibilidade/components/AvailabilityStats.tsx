import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users } from "lucide-react"

interface Props {
  activeDays: number
  totalWeekCapacity: number
}

export function AvailabilityStats({ activeDays, totalWeekCapacity }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-500 font-medium">Dias ativos</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {activeDays}<span className="text-base text-gray-400 font-medium">/7</span>
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-500 font-medium">Capacidade semanal</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalWeekCapacity} <span className="text-base text-gray-400 font-medium">visitas</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
