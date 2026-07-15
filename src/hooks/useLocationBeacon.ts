import { useEffect, useState } from "react"
import axios from "axios"
import { isGeolocationSupported, watchPosition, type GeoPosition } from "@/lib/geolocation"
import { isNativeApp } from "@/lib/native"
import { locationService } from "@/services/location"

/**
 * Beacon: manda a posição do provider ao backend enquanto houver **rota iniciada**
 * (PLANO_ROTAS_TEMPO_REAL, task 2.3). `watchPosition` alimenta a última posição conhecida e cada
 * posição nova dispara um `flush`, auto-limitado a ~25s (o backend recusa mais de 1 a cada 10s).
 * Um `setInterval` de reforço cobre o WEB parado com a aba visível.
 *
 * **Web vs. app:** postar no callback da posição (e não só no timer) é o que faz o beacon
 * sobreviver à **tela apagada NO APP** (task 2.2 do PLANO_APP_CAPACITOR): lá o `setInterval` é
 * congelado pelo SO em background, mas o callback nativo continua vindo (foreground service). No
 * **web/PWA**, ao contrário, tela bloqueada ou aba descartada MATAM o beacon — o browser suspende
 * timers E o `watchPosition`; não há workaround honesto, então o `flush` aborta com `document.hidden`
 * (só no web) e a posição fica "stale" (>5 min) até voltar — decisão 3 do plano: **não bloqueia o fluxo**.
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

    setStatus("locating")

    const flush = async () => {
      if (!alive || stopped || sending || !lastPosition) return
      // Aba oculta: no WEB o browser estrangula o timer e não adianta insistir (bateria). No APP é o
      // OPOSTO — é com a tela apagada que o beacon PRECISA postar (foreground service, task 2.2) —,
      // então o bail vale só p/ web.
      if (!isNativeApp() && typeof document !== "undefined" && document.hidden) return
      if (Date.now() < nextAttemptAt) return

      sending = true
      const position = lastPosition
      try {
        await locationService.send(token, position)
        if (!alive) return
        failures = 0
        // Cadência: o watch nativo chama `flush` a cada posição (a cada poucos metros); sem este
        // gate o beacon postaria a cada callback e levaria 429. Trava o próximo envio em ~25s.
        nextAttemptAt = Date.now() + POST_INTERVAL_MS
        setLastSentAt(new Date())
        setAccuracyM(position.accuracyM ?? null)
        setStatus("sharing")
      } catch (err) {
        if (!alive) return
        const httpStatus = axios.isAxiosError(err) ? err.response?.status : undefined

        // 429 = rate-limit do backend (postamos cedo demais). Não é falha (nem conta pro backoff);
        // só recua a cadência p/ não martelar.
        if (httpStatus === 429) { nextAttemptAt = Date.now() + POST_INTERVAL_MS; return }

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
        // Posta a cada posição (o `flush` se auto-limita por `nextAttemptAt`): é ISSO que carrega o
        // beacon em background no APP — lá o `setInterval` congela, mas o callback nativo continua
        // vindo. O 1º fix sai na hora (nextAttemptAt começa em 0): o cliente quer o pino JÁ.
        void flush()
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
