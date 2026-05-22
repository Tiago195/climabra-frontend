import { Bell } from "lucide-react";

interface Props {
  clientName: string;
  providerName: string;
  providerPhone: string | null;
  pendingReportsCount: number;
}

export function PortalHeroCard({ clientName, providerName, providerPhone, pendingReportsCount }: Props) {
  return (
    <div className="bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-5 shadow">
      <p className="text-blue-100 text-xs uppercase tracking-wide">Olá,</p>
      <h1 className="text-2xl font-bold">{clientName}</h1>
      <p className="text-sm text-blue-100 mt-2">
        Atendido por <span className="font-medium text-white">{providerName}</span>
        {providerPhone && <> · {providerPhone}</>}
      </p>
      {pendingReportsCount > 0 && (
        <div className="mt-3 inline-flex items-center gap-1.5 bg-yellow-400/95 text-yellow-950 text-xs font-medium rounded-full px-2.5 py-1">
          <Bell className="w-3 h-3" />
          {pendingReportsCount} laudo(s) aguardando sua aprovação
        </div>
      )}
    </div>
  );
}
