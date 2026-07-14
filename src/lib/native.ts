import { Capacitor } from "@capacitor/core"

/**
 * `true` quando o bundle roda dentro do app Capacitor (WebView), `false` no navegador.
 *
 * Regra de convivência: o código de produto NÃO deve ramificar por isto — o app é o MESMO
 * frontend. Use só onde o comportamento nativo não tem equivalente web (shell: back button,
 * status bar, splash) ou onde um plugin substitui a API do browser (ex.: geolocation da
 * Fase 2 do PLANO_APP_CAPACITOR.md, que trocará a fonte da posição sem mexer no chamador).
 */
export const isNativeApp = () => Capacitor.isNativePlatform()
