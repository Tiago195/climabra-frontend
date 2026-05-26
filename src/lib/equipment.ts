import type { EquipmentType } from "@/services/enums"

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  split: "Split",
  janela: "Janela",
  central: "Central",
  cassete: "Cassete",
  piso_teto: "Piso-teto",
  portatil: "Portátil",
}

export const PROBLEM_TYPE_LABELS: Record<string, string> = {
  nao_gela: "Não está gelando",
  barulho: "Fazendo barulho",
  vazamento: "Vazando água",
  nao_liga: "Não liga",
  manutencao: "Manutenção preventiva",
  instalacao: "Instalação",
  outro: "Outro",
}
