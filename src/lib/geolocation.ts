import { registerPlugin } from "@capacitor/core"
import type {
  BackgroundGeolocationPlugin,
  CallbackError,
} from "@capacitor-community/background-geolocation"
import { isNativeApp } from "./native"

/**
 * FONTE da posição do aparelho — a única no app.
 *
 * O beacon (`useLocationBeacon`, PLANO_ROTAS_TEMPO_REAL Fase 2) e qualquer outra tela que precise
 * de geolocalização passam por aqui. São DUAS implementações atrás do mesmo contrato:
 *
 * - **navegador:** `navigator.geolocation` (o web de sempre) — FOREGROUND: aba oculta/tela
 *   bloqueada MATAM o watch, e não há workaround honesto no web;
 * - **app nativo:** plugin community `@capacitor-community/background-geolocation` (task 2.2 do
 *   PLANO_APP_CAPACITOR) — permissão pedida em runtime e rastreio que **sobrevive à tela apagada**
 *   via foreground service (ver `watchNative` abaixo). Substituiu o `@capacitor/geolocation` da
 *   Fase 2.1, que só rastreava em foreground.
 *
 * A troca é **só de fonte**: o chamador (`useLocationBeacon`) não muda o contrato. Por isso a
 * posição NÃO pode ser lida direto do `navigator` em componente nenhum — é esta indireção que faz
 * o wrapper nativo caber sem refactor.
 *
 * ⚠️ **O background do app depende de DUAS peças casadas** — uma sem a outra não entrega nada:
 *   1. AQUI: o plugin com `backgroundMessage` (liga o foreground service + a notificação persistente);
 *   2. no `useLocationBeacon`: postar no callback da posição e NÃO abortar com `document.hidden`
 *      (o bail é só do web — no app é justamente com a tela apagada que precisamos postar).
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
 * Plugin community `@capacitor-community/background-geolocation` (gratuito). Ele **não envia JS** —
 * só o código nativo e os tipos —, então registramos o proxy aqui; o nome bate com o
 * `@CapacitorPlugin(name = "BackgroundGeolocation")` do lado Android.
 *
 * É ele que dá o rastreio com a TELA APAGADA (task 2.2), o que o `@capacitor/geolocation`
 * (foreground) não fazia. O truque NÃO é uma permissão especial (`ACCESS_BACKGROUND_LOCATION`
 * continua sem ser pedida): é um **foreground service** do tipo `location`, e o preço dele é a
 * **notificação persistente** ("Rota em andamento") ligada por `backgroundMessage` abaixo. Sem
 * `backgroundMessage`, o plugin só rastrearia em foreground (um `@capacitor/geolocation` mais caro).
 */
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation")

/**
 * Metros que o aparelho precisa andar para o plugin emitir uma posição nova. Filtra o tremido do
 * GPS parado e economiza bateria; o `useLocationBeacon` ainda limita o POST a ~25s por cima. Parado
 * de verdade (chegou no cliente) não gera callback e a posição fica "stale" — comportamento
 * esperado (decisão 3 do PLANO_ROTAS_TEMPO_REAL: nada disso bloqueia o fluxo).
 */
const NATIVE_DISTANCE_FILTER_M = 25

/** Único erro "duro" do plugin: permissão negada / serviços de localização desligados. */
function nativeKind(err: CallbackError | unknown): GeoErrorKind {
  const code = (err as CallbackError | null)?.code
  return code === "NOT_AUTHORIZED" ? "denied" : "unavailable"
}

/**
 * Watch nativo via background-geolocation. Diferente do `@capacitor/geolocation` (cujo watch MORRIA
 * no primeiro erro e exigia re-armar com backoff), este é um **watcher persistente**: entrega
 * posições enquanto viver e reporta o erro pelo 2º argumento do callback SEM se encerrar — então
 * não há re-arme a fazer aqui. Só `denied` (permissão negada) é terminal, e é o único que o hook
 * trata como "não insista" (decisão 3: a UI avisa e a rota SEGUE, sem bloquear o provider).
 */
function watchNative(
  onPosition: (position: GeoPosition) => void,
  onError: (kind: GeoErrorKind) => void,
): GeoWatch {
  let cleared = false
  let watcherId: string | null = null

  void BackgroundGeolocation.addWatcher(
    {
      // Liga o rastreio de BACKGROUND (tela apagada) — e o texto da notificação persistente que o
      // Android exige p/ manter o foreground service vivo. Copy da decisão 6 do plano.
      backgroundTitle: "Rota em andamento",
      backgroundMessage: "Compartilhando sua localização durante a rota.",
      // O plugin pede a permissão de localização em runtime; a recusa vira "denied" no callback.
      requestPermissions: true,
      // Nada de posição velha em cache ao ligar: o cliente quer o pino de agora.
      stale: false,
      distanceFilter: NATIVE_DISTANCE_FILTER_M,
    },
    (position, error) => {
      if (cleared) return
      if (error) {
        onError(nativeKind(error))
        return
      }
      if (!position) return
      const { latitude, longitude, accuracy } = position
      onPosition({
        lat: latitude,
        lng: longitude,
        accuracyM: Number.isFinite(accuracy) ? accuracy : undefined,
      })
    },
  )
    .then(id => {
      // Corrida real: `clear()` pode ter sido chamado enquanto o addWatcher resolvia.
      if (cleared) { void BackgroundGeolocation.removeWatcher({ id }).catch(() => {}); return }
      watcherId = id
    })
    .catch(err => {
      // Falhou ao sequer registrar o watcher (permissão negada síncrona, serviço fora do ar).
      if (!cleared) onError(nativeKind(err))
    })

  return {
    clear: () => {
      if (cleared) return
      cleared = true
      const id = watcherId
      watcherId = null
      if (id) void BackgroundGeolocation.removeWatcher({ id }).catch(() => {})
    },
  }
}
