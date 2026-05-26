import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

interface Props {
  providerName: string;
  pendingReportsCount: number;
}

export function PortalProviderHeader({ providerName, pendingReportsCount }: Props) {
  const initial = providerName?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <Card>
      <CardContent className="py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Atendido por</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{providerName}</p>
        </div>
        {pendingReportsCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium shrink-0">
            <Bell className="w-3 h-3" />
            {pendingReportsCount} laudo{pendingReportsCount > 1 ? "s" : ""}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
