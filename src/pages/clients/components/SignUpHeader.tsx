import { Wind } from "lucide-react";

interface Props {
  providerName: string;
}

export function SignUpHeader({ providerName }: Props) {
  return (
    <div className="text-center space-y-2">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg">
        <Wind className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{providerName}</h1>
      <p className="text-gray-500 text-sm">Solicite uma visita técnica em poucos passos</p>
    </div>
  );
}
