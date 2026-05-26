import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, CheckCircle2, MapPin, Calendar, Send, ThumbsUp,
  Wrench, Camera, Image as ImageIcon, Sparkles, ShieldCheck, BadgeCheck,
  CreditCard, Star, Download, RotateCw, Timer, User, Building2,
} from "lucide-react";

// ============================================================================
// MOCK DATA
// ============================================================================

const TODAY = new Date("2026-05-26T10:00:00");

const PROVIDER = {
  name: "ClimaTec Refrigeração",
  professional: "João Climatec",
};

const CLIENT = {
  name: "Carla Mendes",
  address: "Av. Paulista, 2200 — Bela Vista, São Paulo/SP",
};

const EQUIPMENT = {
  label: "Recepção",
  type: "Central VRV",
  brand: "Daikin",
  model: "VRV-IV RXYQ8",
};

const REPORT = {
  id: "LAU-2026-0042",
  title: "Manutenção corretiva — Compressor da unidade externa",
  status: "Concluído",
};

// Datas-chave (relativas a TODAY)
const TIMELINE = [
  { key: "submitted", icon: Send,        label: "Solicitação enviada",      date: "20/05/2026 · 09:14", color: "text-gray-500" },
  { key: "quote",     icon: FileText,    label: "Laudo submetido",          date: "21/05/2026 · 18:42", color: "text-blue-600" },
  { key: "approved",  icon: ThumbsUp,    label: "Aprovado pelo cliente",    date: "22/05/2026 · 08:05", color: "text-blue-600" },
  { key: "started",   icon: Wrench,      label: "Serviço iniciado",         date: "23/05/2026 · 14:30", color: "text-amber-600", highlight: "1d 6h após aprovação" },
  { key: "before",    icon: Camera,      label: "Fotos antes",              date: "23/05/2026 · 14:38", color: "text-gray-500" },
  { key: "after",     icon: ImageIcon,   label: "Fotos depois",             date: "23/05/2026 · 17:21", color: "text-gray-500" },
  { key: "done",      icon: CheckCircle2,label: "Serviço finalizado",       date: "23/05/2026 · 17:25", color: "text-green-600" },
];

// Pares de fotos antes/depois por item (placeholders SVG)
const PHOTO_PAIRS = [
  { label: "Unidade externa — vista geral",  before: "rust", after: "clean", uploader: "João C.", uploadedAt: "23/05 · 14:38" },
  { label: "Capacitor 35µF — substituído",   before: "old",  after: "new",   uploader: "João C.", uploadedAt: "23/05 · 15:50" },
  { label: "Filtro evaporadora — limpeza",   before: "dust", after: "clean", uploader: "João C.", uploadedAt: "23/05 · 17:10" },
];

// Resumo IA
const AI_SUMMARY = `O atendimento começou com diagnóstico completo da unidade central VRV Daikin de 8HP instalada na recepção do escritório, após reclamação de falha intermitente no resfriamento durante o pico de uso vespertino. Na inspeção inicial, foi identificada oscilação de partida do compressor scroll da unidade externa, com o capacitor de marcha apresentando 18µF medidos contra os 35µF nominais — sinal claro de fim de vida útil que justificava o comportamento de "liga e desliga" relatado pelo cliente.

A intervenção priorizou três frentes: substituição do capacitor de marcha por unidade nova da mesma especificação (35µF / 440V), verificação completa da carga de gás refrigerante R-410A com manifold digital (pressões dentro do esperado — alta 28 bar, baixa 9 bar a 22 °C ambiente), e limpeza profunda dos filtros da evaporadora de teto, que apresentavam acúmulo significativo de poeira reduzindo a vazão de ar em estimados 20 a 25%.

Durante a manutenção também foi feita a higienização da bandeja de condensado, aplicação de produto bactericida específico para serpentina e teste de funcionamento por 45 minutos em ciclo completo de refrigeração, com medição de temperatura de insuflamento entrando em regime estável de 13,4 °C — dentro da faixa ideal para o ambiente de 32 m².

O cliente recebeu orientações para preventiva semestral, manter o controle remoto entre 22 °C e 24 °C em uso prolongado, e evitar bloquear o difusor com móveis ou plantas. Todas as fotos do antes e depois estão anexadas a este laudo, e a peça substituída foi mantida no local para conferência do cliente conforme acordado no fechamento.

Observações técnicas adicionais: foi conferido o aperto dos terminais elétricos da caixa de comando, inspecionado visualmente o dreno principal e verificado o isolamento das tubulações de cobre na passagem pelo forro — tudo em conformidade. A garantia da peça substituída (capacitor) acompanha o prazo do fabricante (12 meses contra defeito de fabricação) e a mão de obra do serviço tem 90 dias de garantia contra reincidência da mesma falha, conforme detalhado abaixo na lista de itens executados.`;

// Itens executados com garantia e valor
const ITEMS = [
  {
    id: "i1",
    description: "Substituição do capacitor de marcha (35µF / 440V)",
    qty: 1,
    unit: 180.00,
    warrantyDays: 365,
  },
  {
    id: "i2",
    description: "Mão de obra técnica — diagnóstico e substituição",
    qty: 1.5,
    unit: 160.00,
    warrantyDays: 90,
  },
  {
    id: "i3",
    description: "Limpeza de filtros + higienização de serpentina",
    qty: 1,
    unit: 220.00,
    warrantyDays: 90,
  },
  {
    id: "i4",
    description: "Verificação de carga de gás R-410A (sem reposição)",
    qty: 1,
    unit: 80.00,
    warrantyDays: 0,
  },
];

const DISCOUNT = 50.00;
const PAYMENT = {
  method: "credit" as "pix" | "credit" | "debit" | "cash" | "boleto",
  detail: "Crédito 2x · final 4521",
  paidAt: "23/05/2026 · 18:02",
};

const RATING = {
  stars: 5,
  comment: "Atendeu na hora marcada, explicou tudo direitinho e deixou tudo limpo no final. Voltou a gelar como quando era novo. Recomendo!",
  ratedBy: "Carla M.",
  ratedAt: "24/05/2026 · 09:11",
};

// ============================================================================
// HELPERS
// ============================================================================

const fmtMoney = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const subtotal = ITEMS.reduce((s, i) => s + i.qty * i.unit, 0);
const total = subtotal - DISCOUNT;

function warrantyLabel(days: number) {
  if (days === 0) return "Sem garantia";
  if (days >= 365 && days % 365 === 0) {
    const y = days / 365;
    return `Garantia ${y} ${y === 1 ? "ano" : "anos"}`;
  }
  if (days >= 30 && days % 30 === 0) {
    const m = days / 30;
    return `Garantia ${m} ${m === 1 ? "mês" : "meses"}`;
  }
  return `Garantia ${days} dias`;
}

const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix", credit: "Cartão de crédito", debit: "Cartão de débito",
  cash: "Dinheiro", boleto: "Boleto",
};

// Tempo entre approved e started
function gapApprovedToStart(): string {
  const approved = new Date("2026-05-22T08:05:00");
  const started = new Date("2026-05-23T14:30:00");
  const mins = (started.getTime() - approved.getTime()) / 60000;
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h após aprovação`;
  return `${hours}h após aprovação`;
}

// ============================================================================
// PLACEHOLDER PHOTOS (SVG gradients)
// ============================================================================

function PhotoPlaceholder({ tone, label }: { tone: string; label: string }) {
  const palettes: Record<string, [string, string, string]> = {
    rust:  ["#fef3c7", "#92400e", "#451a03"],   // ferrugem / sujo
    dust:  ["#e5e7eb", "#6b7280", "#1f2937"],   // poeira
    old:   ["#fee2e2", "#991b1b", "#450a0a"],   // peça velha
    clean: ["#dbeafe", "#1d4ed8", "#0c1e4e"],   // limpo
    new:   ["#dcfce7", "#15803d", "#052e16"],   // peça nova
  };
  const [bgA, bgB, ink] = palettes[tone] ?? palettes.clean;
  const Icon = tone === "new" || tone === "clean" ? BadgeCheck : Wrench;
  return (
    <div className="relative aspect-[4/3] rounded-md overflow-hidden ring-1 ring-gray-200">
      <svg viewBox="0 0 120 90" className="w-full h-full block">
        <defs>
          <linearGradient id={`g-${tone}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={bgA} />
            <stop offset="100%" stopColor={bgB} />
          </linearGradient>
        </defs>
        <rect width="120" height="90" fill={`url(#g-${tone})`} />
        {/* sugestão visual de “fotografia”: caixa central */}
        <rect x="22" y="20" width="76" height="46" rx="4" fill="#ffffff" opacity="0.18" />
        <rect x="32" y="30" width="56" height="6" rx="2" fill={ink} opacity="0.18" />
        <rect x="32" y="42" width="42" height="6" rx="2" fill={ink} opacity="0.14" />
        <rect x="32" y="54" width="28" height="6" rx="2" fill={ink} opacity="0.12" />
      </svg>
      <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function LaudoCompleto() {
  const startGap = gapApprovedToStart();

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-12">

        {/* ===== HEADER DO LAUDO ===== */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Laudo · {REPORT.id}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5">
              <CheckCircle2 className="w-3 h-3" /> {REPORT.status}
            </span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 leading-snug">
            {REPORT.title}
          </h1>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-gray-400" />
            {EQUIPMENT.label} — {EQUIPMENT.type} · {EQUIPMENT.brand} {EQUIPMENT.model}
          </p>
          <p className="text-[11px] text-gray-500 flex items-start gap-1">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
            <span>{CLIENT.address}</span>
          </p>
        </div>

        {/* ===== LINHA DO TEMPO ===== */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-1.5 mb-3">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-semibold text-gray-800">Linha do tempo</p>
            </div>
            <ol className="space-y-2.5 relative">
              <div className="absolute left-[11px] top-1.5 bottom-1.5 w-px bg-gray-200" aria-hidden />
              {TIMELINE.map((e) => {
                const Icon = e.icon;
                return (
                  <li key={e.key} className="relative flex items-start gap-2.5 pl-0">
                    <div className={`relative z-10 w-6 h-6 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center shrink-0`}>
                      <Icon className={`w-3 h-3 ${e.color}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[12px] font-medium text-gray-800 leading-tight">{e.label}</p>
                      <p className="text-[10px] text-gray-500 leading-tight">{e.date}</p>
                      {e.highlight && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-[10px] font-semibold px-1.5 py-0.5">
                          <Timer className="w-2.5 h-2.5" /> {startGap}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* ===== FOTOS ANTES/DEPOIS ===== */}
        <Card>
          <CardContent className="py-3 space-y-3">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-semibold text-gray-800">Fotos antes &amp; depois</p>
              <span className="ml-auto text-[10px] text-gray-400">{PHOTO_PAIRS.length} pares</span>
            </div>
            {PHOTO_PAIRS.map((p, i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-[11px] font-medium text-gray-700">{p.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  <PhotoPlaceholder tone={p.before} label="Antes" />
                  <PhotoPlaceholder tone={p.after} label="Depois" />
                </div>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <User className="w-2.5 h-2.5" />
                  Enviadas por {p.uploader} · {p.uploadedAt}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ===== RESUMO IA ===== */}
        <Card className="bg-gradient-to-br from-violet-50 via-white to-blue-50 ring-1 ring-violet-200/60 border-violet-200">
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 text-white text-[10px] font-semibold px-2 py-0.5">
                <Sparkles className="w-3 h-3" /> Resumo por IA
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white ring-1 ring-gray-200 text-gray-600 text-[10px] font-medium px-2 py-0.5">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Revisado pelo prestador
              </span>
              <span className="ml-auto text-[10px] text-gray-400">~{AI_SUMMARY.split(/\s+/).length} palavras</span>
            </div>
            <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">
              {AI_SUMMARY}
            </p>
          </CardContent>
        </Card>

        {/* ===== ITENS EXECUTADOS COM GARANTIA E VALOR ===== */}
        <Card>
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-semibold text-gray-800">Serviços executados</p>
              <span className="ml-auto text-[10px] text-gray-400">{ITEMS.length} itens</span>
            </div>
            <ul className="space-y-2">
              {ITEMS.map((it, idx) => {
                const sub = it.qty * it.unit;
                const w = warrantyLabel(it.warrantyDays);
                const noWarranty = it.warrantyDays === 0;
                return (
                  <li key={it.id} className="rounded-md ring-1 ring-gray-200 bg-white px-2.5 py-2 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-blue-500 mt-0.5 shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[12px] font-medium text-gray-800 flex-1 leading-snug">
                        {it.description}
                      </p>
                      <p className="text-[12px] font-semibold text-gray-900 tabular-nums shrink-0">
                        {fmtMoney(sub)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pl-5">
                      <span className="text-[10px] text-gray-500 tabular-nums">
                        {it.qty.toString().replace(".", ",")} × {fmtMoney(it.unit)}
                      </span>
                      <span className={`ml-auto inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-1.5 py-0.5 ${
                        noWarranty
                          ? "bg-gray-100 text-gray-500"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      }`}>
                        <ShieldCheck className="w-2.5 h-2.5" /> {w}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* ===== RESUMO FINANCEIRO + PAGAMENTO ===== */}
        <Card>
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-semibold text-gray-800">Resumo financeiro</p>
            </div>
            <div className="space-y-1 text-[12px] tabular-nums">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{fmtMoney(subtotal)}</span>
              </div>
              {DISCOUNT > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Desconto</span>
                  <span>− {fmtMoney(DISCOUNT)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-100 pt-1.5 mt-1.5 text-gray-900 font-bold">
                <span>Total pago</span>
                <span>{fmtMoney(total)}</span>
              </div>
            </div>
            <div className="mt-2 rounded-md bg-blue-50 ring-1 ring-blue-100 px-2.5 py-2 flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-blue-900">
                  {PAYMENT_LABEL[PAYMENT.method]}
                </p>
                <p className="text-[11px] text-blue-800">{PAYMENT.detail}</p>
                <p className="text-[10px] text-blue-700/80 mt-0.5">
                  Quitado em {PAYMENT.paidAt}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== AVALIAÇÃO DO CLIENTE ===== */}
        <Card className="bg-amber-50/60 border-amber-200">
          <CardContent className="py-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <p className="text-xs font-semibold text-gray-800">Avaliação do cliente</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${i < RATING.stars
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">
                {RATING.stars}<span className="text-sm text-gray-400 font-medium">/5</span>
              </span>
            </div>
            <p className="text-[12px] text-gray-700 italic leading-relaxed border-l-2 border-amber-300 pl-2">
              "{RATING.comment}"
            </p>
            <p className="text-[10px] text-gray-500">
              — {RATING.ratedBy} · {RATING.ratedAt}
            </p>
          </CardContent>
        </Card>

        {/* ===== CTA RODAPÉ ===== */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 h-9 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Baixar PDF
          </Button>
          <Button size="sm" className="flex-1 h-9 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
            <RotateCw className="w-3.5 h-3.5" /> Solicitar nova visita
          </Button>
        </div>

        <p className="text-[10px] text-center text-gray-400 pt-2">
          Em caso de dúvidas, fale com {PROVIDER.professional} — {PROVIDER.name}.
          <br />
          Hoje: {TODAY.toLocaleDateString("pt-BR")}
        </p>

      </div>
    </div>
  );
}
