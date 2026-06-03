import { CreditCard } from "lucide-react";

/**
 * Selo compacto da bandeira do cartão, fiel ao design do plano_fase2: caixa
 * branca com leve sombra; rótulo da bandeira na cor própria. O `brand` vem
 * normalizado do backend ("visa" | "master" | "elo" | ...). Sem assets de
 * terceiros — fallback de ícone genérico para bandeiras desconhecidas.
 */
export function CardBrandIcon({ brand }: { brand: string }) {
  const key = (brand || "").toLowerCase();

  // elo: caixa preta com texto branco (como no design)
  if (key === "elo") {
    return (
      <span className="w-10 h-7 rounded-md bg-black shadow-sm flex items-center justify-center shrink-0" aria-hidden>
        <span className="text-[11px] font-extrabold text-white tracking-tight">elo</span>
      </span>
    );
  }

  const box = "w-10 h-7 rounded-md bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0";

  if (key === "visa") {
    return (
      <span className={box} aria-hidden>
        <span className="text-[11px] font-extrabold tracking-tight" style={{ color: "#1a1f73" }}>VISA</span>
      </span>
    );
  }

  if (key === "master" || key === "mastercard") {
    // marca do Mastercard: dois círculos sobrepostos
    return (
      <span className={box} aria-hidden>
        <span className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-amber-400 -ml-1.5 mix-blend-multiply" />
        </span>
      </span>
    );
  }

  if (key === "hipercard") {
    return (
      <span className={box} aria-hidden>
        <span className="text-[10px] font-extrabold text-red-600 tracking-tight">Hiper</span>
      </span>
    );
  }
  if (key === "amex") {
    return (
      <span className={box} aria-hidden>
        <span className="text-[10px] font-extrabold tracking-tight text-sky-700">AMEX</span>
      </span>
    );
  }

  return (
    <span className={box} aria-hidden>
      <CreditCard className="w-4 h-4 text-gray-400" />
    </span>
  );
}
