// Sessão do cliente no portal (Q5/OTP). O JWT (~30d) é emitido após validar o código
// recebido por WhatsApp e guardado no aparelho, indexado pelo clientId (UUID único — o
// mesmo token serve o portal E o link do laudo, pois é vinculado a clientId+providerToken).

const key = (clientId: string) => `climabra.client.session.${clientId}`

export const clientSession = {
  getToken(clientId?: string | null): string | null {
    return clientId ? localStorage.getItem(key(clientId)) : null
  },

  setToken(clientId: string, token: string) {
    localStorage.setItem(key(clientId), token)
  },

  clear(clientId?: string | null) {
    if (clientId) localStorage.removeItem(key(clientId))
  },

  /** Header Authorization p/ as chamadas escopadas ao cliente (vazio se não houver sessão). */
  authHeader(clientId?: string | null) {
    const token = this.getToken(clientId)
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  },

  /** True quando o erro é 401 (sessão ausente/expirada) — a UI deve voltar à tela de OTP. */
  isUnauthorized(err: unknown): boolean {
    return (err as { response?: { status?: number } })?.response?.status === 401
  },
}
