import type { Shift } from "@/services/enums"
import { SHIFT_COLORS, SHIFT_ICONS, SHIFT_LABELS } from "@/lib/shifts"

interface Props {
  shift: Shift
  size?: "xs" | "sm"
  className?: string
}

export function ShiftBadge({ shift, size = "sm", className = "" }: Props) {
  const c = SHIFT_COLORS[shift]
  const Icon = SHIFT_ICONS[shift]
  const sz =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.5 gap-0.5"
      : "text-xs px-2 py-0.5 gap-1"
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${c.chip} ${sz} ${className}`}>
      <Icon className="w-3 h-3" />
      {SHIFT_LABELS[shift]}
    </span>
  )
}
