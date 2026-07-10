import axios from "axios"

/**
 * Normalização das mensagens de erro de requisição (Fase 1 do refino de erros — ver KANBAN.md).
 * O backend devolve `ErrorResponseDTO { message, status, fields? }` (ver
 * api/.../ControllerAdvice.java): mensagens de negócio (ServiceException) já vêm prontas em
 * pt-BR; erros de validação (422) trazem `fields` (campo → mensagem).
 *
 * Uso: `toast.error(getApiErrorMessage(err, "Erro ao salvar anotação"))`.
 */

const OFFLINE_MESSAGE = "Sem conexão. Verifique sua internet e tente novamente."
const SERVER_ERROR_MESSAGE = "Erro no servidor. Tente novamente em instantes."
const GENERIC_MESSAGE = "Não foi possível concluir a ação. Tente novamente."

interface ErrorResponseDTO {
  message?: string
  status?: number
  fields?: Record<string, string>
}

/** Mensagem pronta para exibir ao usuário (toast) a partir de um erro de requisição qualquer. */
export function getApiErrorMessage(err: unknown, contextPrefix?: string): string {
  const message = resolveMessage(err)
  return contextPrefix ? `${contextPrefix}: ${message}` : message
}

function resolveMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return OFFLINE_MESSAGE

    const status = err.response.status
    const data = err.response.data as ErrorResponseDTO | undefined
    const backendMessage = data?.message?.trim()

    if (status >= 500) return backendMessage || SERVER_ERROR_MESSAGE
    if (status >= 400) return backendMessage || GENERIC_MESSAGE

    return backendMessage || GENERIC_MESSAGE
  }

  return GENERIC_MESSAGE
}

/** Mapa campo → mensagem extraído de um 422 de validação; `null` se não houver. */
export function getFieldErrors(err: unknown): Record<string, string> | null {
  if (!axios.isAxiosError(err)) return null
  if (err.response?.status !== 422) return null

  const data = err.response.data as ErrorResponseDTO | undefined
  const fields = data?.fields
  if (!fields || Object.keys(fields).length === 0) return null

  return fields
}
