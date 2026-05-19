interface Props {
  clientName: string;
  providerName: string;
  providerPhone: string | null;
}

export function PortalHeroCard({ clientName, providerName, providerPhone }: Props) {
  return (
    <div className="bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-5 shadow">
      <p className="text-blue-100 text-xs uppercase tracking-wide">Olá,</p>
      <h1 className="text-2xl font-bold">{clientName}</h1>
      <p className="text-sm text-blue-100 mt-2">
        Atendido por <span className="font-medium text-white">{providerName}</span>
        {providerPhone && <> · {providerPhone}</>}
      </p>
    </div>
  );
}
