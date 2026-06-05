import type { AxiosInstance } from "axios"

/**
 * Ponte React ↔ axios para o paywall (Fase B): o backend devolve 402 nas ações sensíveis quando a
 * assinatura está bloqueada. O SubscriptionGateProvider registra um handler aqui, e os serviços de
 * escrita anexam o interceptor que dispara o handler ao receber 402.
 */
let handler: (() => void) | null = null

export function onPaymentRequired(cb: (() => void) | null) {
  handler = cb
}

export function attachPaywall(instance: AxiosInstance) {
  instance.interceptors.response.use(
    res => res,
    err => {
      if (err?.response?.status === 402) handler?.()
      return Promise.reject(err)
    },
  )
}
