/**
 * Menção regulatória obrigatória (BACEN Res. Conjunta 16/17): mesmo white-label,
 * é preciso evidenciar a instituição de pagamento parceira nos pontos de contato.
 * Discreto por design — compliance, não destaque.
 */
export function AsaasDisclosure({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-400 leading-relaxed ${className}`}>
      Pagamentos processados por <span className="font-medium">Asaas IP S.A.</span>,
      instituição de pagamento parceira.
    </p>
  );
}
