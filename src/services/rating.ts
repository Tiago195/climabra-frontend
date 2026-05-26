// Avaliação do laudo pelo cliente.
//
// NOTA: o backend ainda não expõe endpoints de rating. Para destravar a
// experiência fim-a-fim no frontend, persistimos as avaliações em
// localStorage por enquanto. Quando o backend ganhar suporte, basta trocar
// a implementação destes métodos sem mexer nos componentes.

const STORAGE_KEY = "climagestao:ratings:v1"

export interface IRating {
  reportToken: string
  providerToken: string
  clientName?: string
  stars: number
  comment: string
  createdAt: string
}

type RatingMap = Record<string, IRating>

function readAll(): RatingMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RatingMap) : {}
  } catch {
    return {}
  }
}

function writeAll(map: RatingMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* storage cheio / desabilitado — ignora */
  }
}

export const ratingService = {
  get(reportToken: string): IRating | null {
    return readAll()[reportToken] ?? null
  },

  save(input: Omit<IRating, "createdAt">): IRating {
    const all = readAll()
    const rating: IRating = { ...input, createdAt: new Date().toISOString() }
    all[input.reportToken] = rating
    writeAll(all)
    return rating
  },

  listByProvider(providerToken: string): IRating[] {
    return Object.values(readAll())
      .filter(r => r.providerToken === providerToken)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
}
