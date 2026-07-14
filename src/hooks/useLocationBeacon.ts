import { useEffect, useState } from "react"
import axios from "axios"
import { isGeolocationSupported, watchPosition, type GeoPosition } from "@/lib/geolocation"
import { locationService } from "@/services/location"

/**
 * Beacon: manda a posição do provider ao backend enquanto houver **rota iniciada** e a aba viva
 * (PLANO_ROTAS_TEMPO_REAL, task 2.3). `watchPosition` alimenta a última posição conhecida; um
 * timer a envia a cada ~25s (o backend limita a 1 a cada 10s).
 *
 * **Limitação assumida (web/PWA):** tela bloqueada ou aba descartada MATAM o beacon — o browser
 * suspende timers e o `watchPosition` em background. Não há workaround honesto no web; é
 * exatamente isto que o app nativo resolve (Fase 2.2 do PLANO_APP_CAPACITOR, com background
 * geolocation). Enquanto isso a posição simplesmente fica "stale" (>5 min) e a Fase 3 mostra o
 * status sem pino ao vivo — decisão 3 do plano: **nada disso bloqueia o fluxo**.
 *
 * Estados chatos, todos tratados sem toast em loop:
 * - **permissão negada** (ou revogada no meio): para de tentar, informa no indicador, segue a vida;
 * - **erro de rede/servidor no POST**: backoff exponencial (25s → 5 min), sem toast a cada tentativa;
 * - **429** (rate-limit do backend): benigno — é só "veio cedo demais", não é falha;
 * - **402** (assinatura vencida no meio da rota): desliga o beacon em vez de repetir o 402 pra sempre.
 */

export type BeaconStatus =
  /** Não há rota iniciada — o beacon nem liga. */
  | "idle"
  /** Desligado à mão pelo provider. */
  | "off"
  /** O aparelho/browser não tem geolocalização. */
  | "unsupported"
  /** Permissão negada ou revogada — não insistimos. */
  | "denied"
  /** Ligado, esperando o 1º fix do GPS. */
  | "locating"
  /** Enviando a posição normalmente. */
  | "sharing"
  /** Envio falhando (rede/servidor) — continua tentando, com backoff. */
  | "error"

export interface LocationBeacon {
  status: BeaconStatus
  /** Quando a última posição foi aceita pelo backend. */
  lastSentAt: Date | null
  accuracyM: number | null
  /** Liga/desliga manual (task 2.3: o provider pode parar de compartilhar quando quiser). */
  enable: () => void
  disable: () => void
}

/** Intervalo de envio (~20–30s, task 2.3). O backend recusa mais de 1 a cada 10s. */
const POST_INTERVAL_MS = 25_000
const MAX_BACKOFF_MS = 5 * 60_000

export function useLocationBeacon({ token, active }: { token: string; active: boolean }): LocationBeacon {
  // Desligar é decisão do provider e vale enquanto a tela viver (recarregar volta ao default
  // "ligado com a rota iniciada" — é o comportamento que o plano pede; não persistimos opt-out).
  const [manualOff, setManualOff] = useState(false)
  const [status, setStatus] = useState<BeaconStatus>("idle")
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null)
  const [accuracyM, setAccuracyM] = useState<number | null>(null)
  // "Tentar de novo" depois de uma negativa: reinicia o watch (o efeito depende deste contador).
  // Sem isso, `enable()` num beacon que já estava "ligado, porém negado" não faria nada.
  const [retry, setRetry] = useState(0)

  const running = active && !manualOff

  useEffect(() => {
    if (!running) {
      setStatus(active ? "off" : "idle")
      return
    }
    if (!token) return
    if (!isGeolocationSupported()) {
      setStatus("unsupported")
      return
    }

    let alive = true
    let sending = false
    let failures = 0
    let nextAttemptAt = 0
    let stopped = false // permissão negada/402: para de postar sem derrubar o resto da tela
    let lastPosition: GeoPosition | null = null
    let firstSendDone = false

    setStatus("locating")

    const flush = async () => {
      if (!alive || stopped || sending || !lastPosition) return
      // Aba oculta: o browser já estrangula o timer; não insistimos (e não gastamos bateria).
      if (typeof document !== "undefined" && document.hidden) return
      if (Date.now() < nextAttemptAt) return

      sending = true
      const position = lastPosition
      try {
        await locationService.send(token, position)
        if (!alive) return
        failures = 0
        nextAttemptAt = 0
        firstSendDone = true
        setLastSentAt(new Date())
        setAccuracyM(position.accuracyM ?? null)
        setStatus("sharing")
      } catch (err) {
        if (!alive) return
        const httpStatus = axios.isAxiosError(err) ? err.response?.status : undefined

        // 429 = rate-limit do backend (postamos cedo demais). Não é falha: nem conta pro backoff.
        if (httpStatus === 429) return

        // 402/401: insistir é inútil (assinatura vencida / sessão morta) e viraria loop.
        if (httpStatus === 402 || httpStatus === 401) {
          stopped = true
          setStatus("off")
          return
        }

        // Rede/servidor: backoff exponencial, SEM toast (senão o provider levaria um a cada 25s).
        failures += 1
        nextAttemptAt = Date.now() + Math.min(POST_INTERVAL_MS * 2 ** failures, MAX_BACKOFF_MS)
        setStatus("error")
      } finally {
        sending = false
      }
    }

    const watch = watchPosition(
      position => {
        if (!alive) return
        lastPosition = position
        // 1º fix: envia na hora (não espera o 1º tick do timer — o cliente quer o pino JÁ).
        if (!firstSendDone) void flush()
      },
      kind => {
        if (!alive) return
        if (kind === "denied") {
          // Decisão 3 do plano: geo negada NÃO bloqueia nada — a rota segue, só não há pino.
          stopped = true
          watch.clear()
          setStatus("denied")
          return
        }
        // timeout/unavailable são transitórios (túnel, GPS frio): o watch continua tentando.
        // Só rebaixamos o indicador se ainda não houver posição alguma para mandar.
        if (!lastPosition) setStatus("locating")
      },
    )

    const timer = window.setInterval(() => { void flush() }, POST_INTERVAL_MS)
    // Voltou pra aba → manda a posição na hora (o timer pode ter ficado estrangulado).
    const onVisible = () => { if (!document.hidden) void flush() }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      alive = false
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
      watch.clear()
    }
  }, [running, active, token, retry])

  return {
    status,
    lastSentAt,
    accuracyM,
    enable: () => { setManualOff(false); setRetry(r => r + 1) },
    disable: () => setManualOff(true),
  }
}
