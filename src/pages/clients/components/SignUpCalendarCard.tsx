import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

interface Props {
  activeDays: number[];
  year: number;
  month: number;
  selectedDate: Date | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
}

export function SignUpCalendarCard({ activeDays, year, month, selectedDate, onPrevMonth, onNextMonth, onSelectDate }: Props) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isPast = (day: number) => {
    const d = new Date(year, month, day);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };
  const isUnavailable = (day: number) => !activeDays.includes(new Date(year, month, day).getDay());
  const isSelected = (day: number) =>
    selectedDate?.getFullYear() === year &&
    selectedDate?.getMonth() === month &&
    selectedDate?.getDate() === day;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onPrevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <CardTitle className="text-base">{MONTH_NAMES[month]} {year}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onNextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
          {days.map(day => {
            const past = isPast(day);
            const unavailable = isUnavailable(day);
            const selected = isSelected(day);
            const disabled = past || unavailable;
            return (
              <button
                key={day}
                disabled={disabled}
                onClick={() => onSelectDate(new Date(year, month, day))}
                className={`w-full aspect-square rounded-full text-sm font-medium flex items-center justify-center transition-colors ${
                  selected ? "bg-blue-600 text-white"
                    : past ? "text-gray-300 cursor-not-allowed"
                    : unavailable ? "text-gray-300 bg-gray-50 cursor-not-allowed line-through"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
              >{day}</button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white border border-gray-300" /> Disponível
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-100" /> Indisponível
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
