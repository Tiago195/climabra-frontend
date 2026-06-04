// Máscaras e validação de cartão (modelo A — form próprio, sem iframe/SDK de
// terceiro). Extraído do AddCardDialog (Fase 2) para ser reusado também no
// checkout do laudo (Fase 3). Nada aqui persiste/loga o PAN.

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const maskCardNumber = (v: string) =>
  onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();

export const maskExpiry = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};

export const maskCpf = (v: string) =>
  onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export interface CardFields {
  number: string;     // mascarado
  holderName: string;
  expiry: string;     // "MM/AA"
  ccv: string;
  cpf: string;        // mascarado
}

export interface ParsedCard {
  number: string;       // só dígitos
  holderName: string;
  expiryMonth: string;  // "MM"
  expiryYear: string;   // "AAAA"
  ccv: string;
  cpf: string;          // só dígitos
}

/**
 * Valida os campos do cartão. Retorna a mensagem de erro (PT-BR) ou {@code null}
 * se estiver tudo certo. Mesmas regras do AddCardDialog da Fase 2.
 */
export function validateCard(fields: CardFields): string | null {
  const rawNumber = onlyDigits(fields.number);
  const [mm, yy] = fields.expiry.split("/");
  const rawCpf = onlyDigits(fields.cpf);

  if (rawNumber.length < 13 || rawNumber.length > 19) return "Número do cartão inválido";
  if (!fields.holderName.trim()) return "Informe o nome do titular";
  if (!mm || !yy || yy.length < 2 || Number(mm) < 1 || Number(mm) > 12) return "Validade inválida";
  if (fields.ccv.length < 3 || fields.ccv.length > 4) return "CVV inválido";
  if (rawCpf.length !== 11) return "CPF do titular inválido";
  return null;
}

/** Normaliza os campos mascarados para o formato que o backend espera. */
export function parseCard(fields: CardFields): ParsedCard {
  const [mm, yy] = fields.expiry.split("/");
  return {
    number: onlyDigits(fields.number),
    holderName: fields.holderName.trim(),
    expiryMonth: (mm ?? "").padStart(2, "0"),
    expiryYear: yy?.length === 2 ? `20${yy}` : (yy ?? ""),
    ccv: fields.ccv,
    cpf: onlyDigits(fields.cpf),
  };
}
