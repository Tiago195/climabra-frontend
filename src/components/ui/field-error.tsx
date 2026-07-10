/**
 * Mensagem de erro por campo (422 de validação do backend — `fields` do ErrorResponseDTO).
 * Padrão único: texto vermelho pequeno sob o input. Usar junto com `aria-invalid` no
 * campo correspondente (o Input/Textarea do design system já estiliza a borda nesse caso).
 */
export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}
