import { Geolocation } from "@capacitor/geolocation"
import { isNativeApp } from "./native"

/**
 * FONTE da posição do aparelho — a única no app.
 *
 * O beacon (`useLocationBeacon`, PLANO_ROTAS_TEMPO_REAL Fase 2) e qualquer outra tela que precise
 * de geolocalização passam por aqui. São DUAS implementações atrás do mesmo contrato:
 *
 * - **navegador:** `navigator.geolocation` (o web de sempre);
 * - **app nativo:** plugin `@capacitor/geolocation` (Fase 2.1 do PLANO_APP_CAPACITOR) — permissão
 *   pedida em runtime, GPS do aparelho via Google Play Services.
 *
 * A troca é **só de fonte**: o chamador (`useLocationBeacon`) não mudou uma linha, e não pode
 * mudar. Por isso a posição NÃO pode ser lida direto do `navigator` em componente nenhum — é esta
 * indireção que faz o wrapper nativo caber sem refactor.
 *
 * ⚠️ **Isto é geolocalização de FOREGROUND, nas duas plataformas.** Com o app em background ou a
 * tela apagada, o beacon PARA — mesmo sintoma do web. Medido no emulador (14/07): backgroundou o
 * app, mexi a posição, e nenhum POST saiu por 100s. São DUAS causas somadas, e é importante não
 * confundi-las:
 *   1. a permissão concedida é "só ao usar o app" → sem **foreground service** o Android corta as
 *      atualizações de localização em background;
 *   2. o `useLocationBeacon` só posta com a aba visível (`if (document.hidden) return` no `flush`).
 *
 * Background tracking de verdade (task 2.2) foi **VALIDADO tecnicamente e NÃO adotado nesta onda**
 * — o plugin community funciona (posições e POSTs com a tela apagada, provado no emulador), mas
 * ligá-lo exige mexer no hook e uma decisão de produto (notificação persistente, bateria). Ver a
 * **decisão 6** do PLANO_APP_CAPACITOR.md antes de encostar nisto: um plugin ligado aqui sem a
 * mudança no hook NÃO posta nada em background — ele só gasta bateria em silêncio.
 */

export interface GeoPosition {
  lat: number
  lng: number
  /** Precisão em metros (o aparelho nem sempre informa). */
  accuracyM?: number
}

/** Motivo da falha, já normalizado (nem o erro do browser nem o do plugin vazam daqui). */
export type GeoErrorKind = "denied" | "unavailable" | "timeout"

export interface GeoWatch {
  /** Encerra o watch. Idempotente. */
  clear: () => void
}

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  // Aceita uma posição de até 15s de idade (o beacon posta a cada ~25s) — economiza bateria.
  maximumAge: 15_000,
  timeout: 20_000,
}

/** `false` quando o ambiente não tem geolocalização (browser antigo, contexto não seguro). */
export function isGeolocationSupported(): boolean {
  // No app o plugin SEMPRE existe (a WebView até tem `navigator.geolocation`, mas quem responde é
  // o plugin). No navegador vale a checagem de sempre.
  if (isNativeApp()) return true
  return typeof navigator !== "undefined" && "geolocation" in navigator
}

/**
 * Observa a posição continuamente. Devolve um handle para encerrar.
 * `onError` recebe o motivo já normalizado — `denied` é o único que o chamador trata como
 * "não insista" (o usuário bloqueou a permissão).
 *
 * **Contrato (o mesmo nas duas implementações):** o watch fica VIVO até `clear()`. `timeout` e
 * `unavailable` são transitórios — o watch continua tentando (é o que o `useLocationBeacon`
 * assume). Só `denied` encerra.
 */
export function watchPosition(
  onPosition: (position: GeoPosition) => void,
  onError: (kind: GeoErrorKind) => void,
): GeoWatch {
  if (isNativeApp()) return watchNative(onPosition, onError)

  if (!isGeolocationSupported()) {
    onError("unavailable")
    return { clear: () => {} }
  }

  const id = navigator.geolocation.watchPosition(
    pos => onPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : undefined,
    }),
    err => onError(toKind(err)),
    WATCH_OPTIONS,
  )

  let cleared = false
  return {
    clear: () => {
      if (cleared) return
      cleared = true
      navigator.geolocation.clearWatch(id)
    },
  }
}

function toKind(err: GeolocationPositionError): GeoErrorKind {
  if (err.code === err.PERMISSION_DENIED) return "denied"
  if (err.code === err.TIMEOUT) return "timeout"
  return "unavailable"
}

// ─── Implementação nativa (app Capacitor) ────────────────────────────────────────────────────

/**
 * Códigos de erro do plugin (`GeolocationErrors.kt` — o plugin rejeita com `message` + `code`).
 * Mapeados para o nosso `GeoErrorKind`; o que não estiver aqui vira `unavailable`.
 */
const NATIVE_ERROR_KINDS: Record<string, GeoErrorKind> = {
  "OS-PLUG-GLOC-0003": "denied", // permissão negada pelo usuário
  "OS-PLUG-GLOC-0010": "timeout", // não conseguiu fixar a posição a tempo
  "OS-PLUG-GLOC-0007": "unavailable", // serviços de localização desligados no aparelho
  "OS-PLUG-GLOC-0009": "unavailable", // usuário recusou LIGAR a localização (≠ negar permissão)
  "OS-PLUG-GLOC-0017": "unavailable", // GPS e rede desligados
}

/** Backoff do re-armar (ver `watchNative`): não martela o GPS quando o aparelho não colabora. */
const NATIVE_RETRY_MS = [10_000, 30_000, 60_000]

function nativeKind(err: unknown): GeoErrorKind {
  const code = (err as { code?: string } | null)?.code
  return (code && NATIVE_ERROR_KINDS[code]) || "unavailable"
}

/**
 * O watch nativo, com uma diferença de comportamento que precisou ser compensada AQUI:
 *
 * 🪤 **o watch do plugin MORRE no primeiro erro.** Ele é um `PluginCall` com keep-alive; o caminho
 * de erro chama `reject()`, e a partir daí nenhuma posição nova chega naquele watchId. O
 * `navigator.geolocation.watchPosition` do browser faz o oposto (chama o errorCallback e continua
 * vivo — pode se recuperar sozinho quando o GPS esfria/esquenta), e é ISSO que o `useLocationBeacon`
 * assume ("timeout/unavailable são transitórios: o watch continua tentando").
 *
 * Sem compensar, o app ficaria eternamente em "Obtendo sua localização..." com um watch morto por
 * baixo — a pior falha possível: o indicador MENTE. Então, em erro transitório, re-armamos o watch
 * com backoff (10s → 30s → 60s). `denied` é terminal (não re-arma): é o único que o hook trata como
 * "não insista".
 */
function watchNative(
  onPosition: (position: GeoPosition) => void,
  onError: (kind: GeoErrorKind) => void,
): GeoWatch {
  let cleared = false
  let watchId: string | null = null
  let retries = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const dropWatch = () => {
    const id = watchId
    watchId = null
    if (id) void Geolocation.clearWatch({ id }).catch(() => {})
  }

  const fail = (err: unknown) => {
    if (cleared) return
    const kind = nativeKind(err)
    onError(kind)
    if (kind === "denied") return // terminal: o hook para de insistir

    // Transitório: mata o watch morto e re-arma com backoff (ver o comentário do bloco).
    dropWatch()
    const delay = NATIVE_RETRY_MS[Math.min(retries, NATIVE_RETRY_MS.length - 1)]
    retries += 1
    retryTimer = setTimeout(() => { void start() }, delay)
  }

  const start = async () => {
    if (cleared) return
    try {
      // Permissão em runtime (Android 6+): `checkPermissions` lança se os SERVIÇOS de localização
      // do aparelho estiverem desligados — daí o try/catch em volta de tudo.
      let status = await Geolocation.checkPermissions()
      if (status.location !== "granted" && status.coarseLocation !== "granted") {
        status = await Geolocation.requestPermissions({ permissions: ["location"] })
      }
      if (cleared) return
      if (status.location !== "granted" && status.coarseLocation !== "granted") {
        // Recusa do usuário → `denied` (decisão 3 do PLANO_ROTAS_TEMPO_REAL: a UI avisa e a rota
        // SEGUE; nada de bloquear o provider por causa do pino).
        onError("denied")
        return
      }

      const id = await Geolocation.watchPosition(WATCH_OPTIONS, (position, err) => {
        if (cleared) return
        if (err) { fail(err); return }
        if (!position) return
        retries = 0 // voltou a funcionar: o próximo tropeço recomeça o backoff do zero
        const { latitude, longitude, accuracy } = position.coords
        onPosition({
          lat: latitude,
          lng: longitude,
          accuracyM: Number.isFinite(accuracy) ? accuracy : undefined,
        })
      })

      // Corrida real: `clear()` pode ter sido chamado enquanto o await acima resolvia.
      if (cleared) {
        void Geolocation.clearWatch({ id }).catch(() => {})
        return
      }
      watchId = id
    } catch (err) {
      fail(err)
    }
  }

  void start()

  return {
    clear: () => {
      if (cleared) return
      cleared = true
      if (retryTimer) clearTimeout(retryTimer)
      dropWatch()
    },
  }
}
