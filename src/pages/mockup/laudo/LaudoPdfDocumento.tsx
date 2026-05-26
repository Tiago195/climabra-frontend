// Versão "documento PDF" do laudo — para visualização do arquivo baixado.
// Estilo intencionalmente formal: A4 portrait, serif, sem cards arredondados,
// tabela com bordas finas, cabeçalho institucional, rodapé com paginação
// e bloco de assinaturas. Reaproveita os mesmos dados do mockup app.

const PROVIDER = {
  name: "ClimaTec Refrigeração Ltda.",
  professional: "João Climatec",
  professionalTitle: "Técnico Responsável — CREA-SP 5061998-7",
  cnpj: "12.345.678/0001-90",
  address: "Rua Augusta, 1500 — Consolação, São Paulo/SP — CEP 01305-100",
  phone: "(11) 98765-4321",
  email: "contato@climatec.com.br",
};

const CLIENT = {
  name: "Carla Mendes",
  document: "CPF 312.456.789-00",
  address: "Av. Paulista, 2200 — Bela Vista, São Paulo/SP — CEP 01310-300",
  phone: "(11) 9 1234-1003",
};

const EQUIPMENT = {
  label: "Recepção",
  type: "Central VRV",
  brand: "Daikin",
  model: "VRV-IV RXYQ8",
  serial: "DA-2022-08-AB1942",
  installedAt: "12/03/2022",
};

const REPORT = {
  id: "LAU-2026-0042",
  title: "Manutenção corretiva — Compressor da unidade externa",
  status: "Concluído",
  issuedAt: "23/05/2026 · 17:25",
};

const TIMELINE = [
  ["Solicitação enviada",    "20/05/2026 09:14"],
  ["Laudo submetido",        "21/05/2026 18:42"],
  ["Aprovado pelo cliente",  "22/05/2026 08:05"],
  ["Serviço iniciado",       "23/05/2026 14:30 (1d 6h após aprovação)"],
  ["Fotos antes enviadas",   "23/05/2026 14:38"],
  ["Fotos depois enviadas",  "23/05/2026 17:21"],
  ["Serviço finalizado",     "23/05/2026 17:25"],
] as const;

const ITEMS = [
  { d: "Substituição do capacitor de marcha (35µF / 440V)", q: 1,   u: 180.00, w: "12 meses" },
  { d: "Mão de obra técnica — diagnóstico e substituição",  q: 1.5, u: 160.00, w: "90 dias"  },
  { d: "Limpeza de filtros + higienização de serpentina",   q: 1,   u: 220.00, w: "90 dias"  },
  { d: "Verificação de carga de gás R-410A (sem reposição)",q: 1,   u:  80.00, w: "—"        },
];

const DISCOUNT = 50.00;
const PAYMENT = {
  method: "Cartão de crédito — Visa final 4521 · 2x sem juros",
  paidAt: "23/05/2026 18:02",
};

const RATING = {
  stars: 5,
  comment: "Atendeu na hora marcada, explicou tudo direitinho e deixou tudo limpo no final. Voltou a gelar como quando era novo. Recomendo!",
  by: "Carla Mendes",
  at: "24/05/2026 09:11",
};

const NARRATIVE = `O atendimento começou com diagnóstico completo da unidade central VRV Daikin de 8HP instalada na recepção do escritório, após reclamação de falha intermitente no resfriamento durante o pico de uso vespertino. Na inspeção inicial, foi identificada oscilação de partida do compressor scroll da unidade externa, com o capacitor de marcha apresentando 18µF medidos contra os 35µF nominais — sinal claro de fim de vida útil que justificava o comportamento de "liga e desliga" relatado pelo cliente.

A intervenção priorizou três frentes: substituição do capacitor de marcha por unidade nova da mesma especificação (35µF / 440V), verificação completa da carga de gás refrigerante R-410A com manifold digital (pressões dentro do esperado — alta 28 bar, baixa 9 bar a 22 °C ambiente), e limpeza profunda dos filtros da evaporadora de teto, que apresentavam acúmulo significativo de poeira reduzindo a vazão de ar em estimados 20 a 25%.

Durante a manutenção também foi feita a higienização da bandeja de condensado, aplicação de produto bactericida específico para serpentina e teste de funcionamento por 45 minutos em ciclo completo de refrigeração, com medição de temperatura de insuflamento entrando em regime estável de 13,4 °C — dentro da faixa ideal para o ambiente de 32 m². Foi conferido o aperto dos terminais elétricos da caixa de comando, inspecionado visualmente o dreno principal e verificado o isolamento das tubulações de cobre na passagem pelo forro — tudo em conformidade.`;

const PHOTOS = [
  { label: "Unidade externa — vista geral", before: "rust", after: "clean" },
  { label: "Capacitor 35µF — substituído",  before: "old",  after: "new"   },
  { label: "Filtro evaporadora — limpeza",  before: "dust", after: "clean" },
];

// ---------------------------------------------------------------------------
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const subtotal = ITEMS.reduce((s, i) => s + i.q * i.u, 0);
const total = subtotal - DISCOUNT;

function PhotoBox({ tone, caption }: { tone: string; caption: string }) {
  const palette: Record<string, [string, string]> = {
    rust:  ["#fef3c7", "#92400e"],
    dust:  ["#e5e7eb", "#6b7280"],
    old:   ["#fee2e2", "#991b1b"],
    clean: ["#dbeafe", "#1d4ed8"],
    new:   ["#dcfce7", "#15803d"],
  };
  const [a, b] = palette[tone] ?? palette.clean;
  return (
    <figure className="m-0">
      <div className="border border-gray-700">
        <svg viewBox="0 0 120 90" className="block w-full h-auto">
          <defs>
            <linearGradient id={`pdfg-${tone}-${caption}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={a} />
              <stop offset="100%" stopColor={b} />
            </linearGradient>
          </defs>
          <rect width="120" height="90" fill={`url(#pdfg-${tone}-${caption})`} />
          <rect x="22" y="20" width="76" height="46" rx="2" fill="#000" opacity="0.10" />
        </svg>
      </div>
      <figcaption className="text-[9px] text-center text-gray-700 mt-0.5 font-serif italic">
        Figura — {caption}
      </figcaption>
    </figure>
  );
}

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[13px] font-bold text-gray-900 tracking-wide uppercase border-b border-gray-900 pb-1 mt-5 mb-2">
      {n}. {children}
    </h2>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[11px] leading-snug">
      <span className="font-serif font-semibold text-gray-700 shrink-0 w-[110px]">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

export default function LaudoPdfDocumento() {
  return (
    <div className="min-h-dvh bg-gray-300 py-6 print:bg-white print:py-0">
      {/* Folha A4 simulada — proporção ~1:1.414 */}
      <div
        className="mx-auto bg-white shadow-md print:shadow-none font-serif text-gray-900"
        style={{
          width: "min(595px, calc(100vw - 24px))",
          padding: "44px 48px",
        }}
      >

        {/* ===== CABEÇALHO INSTITUCIONAL ===== */}
        <header className="flex items-start justify-between gap-4 pb-3 border-b-2 border-gray-900">
          <div className="flex items-start gap-3">
            {/* logo placeholder */}
            <div className="w-12 h-12 border-2 border-gray-900 flex items-center justify-center shrink-0">
              <span className="font-sans font-black text-base text-gray-900 leading-none">CT</span>
            </div>
            <div className="leading-tight">
              <p className="text-[14px] font-bold uppercase tracking-wider">{PROVIDER.name}</p>
              <p className="text-[10px] text-gray-700">CNPJ {PROVIDER.cnpj}</p>
              <p className="text-[10px] text-gray-700">{PROVIDER.address}</p>
              <p className="text-[10px] text-gray-700">
                {PROVIDER.phone} · {PROVIDER.email}
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] leading-tight">
            <p className="font-bold uppercase tracking-wider text-[11px]">Laudo Técnico</p>
            <p className="text-gray-700">Nº {REPORT.id}</p>
            <p className="text-gray-700">Emitido em {REPORT.issuedAt}</p>
            <p className="font-bold text-gray-900 mt-1">Status: {REPORT.status}</p>
          </div>
        </header>

        {/* ===== TÍTULO ===== */}
        <div className="text-center my-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">Objeto deste laudo</p>
          <h1 className="text-[16px] font-bold mt-0.5">{REPORT.title}</h1>
        </div>

        {/* ===== 1. PARTES ===== */}
        <SectionTitle n={1}>Identificação das partes</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Cliente</p>
            <KV label="Nome" value={CLIENT.name} />
            <KV label="Documento" value={CLIENT.document} />
            <KV label="Endereço" value={CLIENT.address} />
            <KV label="Telefone" value={CLIENT.phone} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Prestador</p>
            <KV label="Empresa" value={PROVIDER.name} />
            <KV label="Responsável" value={PROVIDER.professional} />
            <KV label="Registro" value={PROVIDER.professionalTitle} />
            <KV label="Contato" value={`${PROVIDER.phone} · ${PROVIDER.email}`} />
          </div>
        </div>

        {/* ===== 2. EQUIPAMENTO ===== */}
        <SectionTitle n={2}>Equipamento</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <KV label="Identificação" value={EQUIPMENT.label} />
          <KV label="Tipo" value={EQUIPMENT.type} />
          <KV label="Marca" value={EQUIPMENT.brand} />
          <KV label="Modelo" value={EQUIPMENT.model} />
          <KV label="Nº de série" value={EQUIPMENT.serial} />
          <KV label="Instalado em" value={EQUIPMENT.installedAt} />
        </div>

        {/* ===== 3. CRONOLOGIA ===== */}
        <SectionTitle n={3}>Cronologia do atendimento</SectionTitle>
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            {TIMELINE.map(([label, when], i) => (
              <tr key={i} className="border-b border-gray-200 last:border-b-0">
                <td className="py-1.5 pr-2 align-top w-[55%]">{label}</td>
                <td className="py-1.5 pl-2 align-top text-gray-700 tabular-nums">{when}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== 4. DESCRIÇÃO TÉCNICA ===== */}
        <SectionTitle n={4}>Descrição técnica do serviço executado</SectionTitle>
        <div className="text-[11px] leading-relaxed text-justify space-y-2">
          {NARRATIVE.split("\n\n").map((p, i) => (
            <p key={i} className="indent-6">{p}</p>
          ))}
        </div>

        {/* ===== 5. REGISTRO FOTOGRÁFICO ===== */}
        <SectionTitle n={5}>Registro fotográfico (antes &amp; depois)</SectionTitle>
        <div className="space-y-3">
          {PHOTOS.map((p, i) => (
            <div key={i}>
              <p className="text-[11px] font-semibold mb-1">5.{i + 1} — {p.label}</p>
              <div className="grid grid-cols-2 gap-3">
                <PhotoBox tone={p.before} caption={`5.${i + 1}a — Antes`} />
                <PhotoBox tone={p.after}  caption={`5.${i + 1}b — Depois`} />
              </div>
            </div>
          ))}
        </div>

        {/* ===== 6. ITENS EXECUTADOS ===== */}
        <SectionTitle n={6}>Itens executados, valores e garantia</SectionTitle>
        <table className="w-full border border-gray-900 border-collapse text-[10.5px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-700 px-2 py-1.5 text-left font-bold w-[8%]">Item</th>
              <th className="border border-gray-700 px-2 py-1.5 text-left font-bold">Descrição</th>
              <th className="border border-gray-700 px-2 py-1.5 text-right font-bold w-[10%]">Qtd.</th>
              <th className="border border-gray-700 px-2 py-1.5 text-right font-bold w-[15%]">Unitário</th>
              <th className="border border-gray-700 px-2 py-1.5 text-right font-bold w-[15%]">Subtotal</th>
              <th className="border border-gray-700 px-2 py-1.5 text-center font-bold w-[14%]">Garantia</th>
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((it, i) => (
              <tr key={i}>
                <td className="border border-gray-700 px-2 py-1.5 align-top text-center tabular-nums">{String(i + 1).padStart(2, "0")}</td>
                <td className="border border-gray-700 px-2 py-1.5 align-top">{it.d}</td>
                <td className="border border-gray-700 px-2 py-1.5 align-top text-right tabular-nums">{it.q.toString().replace(".", ",")}</td>
                <td className="border border-gray-700 px-2 py-1.5 align-top text-right tabular-nums">{fmt(it.u)}</td>
                <td className="border border-gray-700 px-2 py-1.5 align-top text-right tabular-nums font-semibold">{fmt(it.q * it.u)}</td>
                <td className="border border-gray-700 px-2 py-1.5 align-top text-center">{it.w}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="border border-gray-700 px-2 py-1.5 text-right">Subtotal</td>
              <td className="border border-gray-700 px-2 py-1.5 text-right tabular-nums">{fmt(subtotal)}</td>
              <td className="border border-gray-700" />
            </tr>
            <tr>
              <td colSpan={4} className="border border-gray-700 px-2 py-1.5 text-right">Desconto</td>
              <td className="border border-gray-700 px-2 py-1.5 text-right tabular-nums">− {fmt(DISCOUNT)}</td>
              <td className="border border-gray-700" />
            </tr>
            <tr className="bg-gray-100">
              <td colSpan={4} className="border border-gray-700 px-2 py-1.5 text-right font-bold">TOTAL</td>
              <td className="border border-gray-700 px-2 py-1.5 text-right tabular-nums font-bold">{fmt(total)}</td>
              <td className="border border-gray-700" />
            </tr>
          </tfoot>
        </table>

        {/* ===== 7. PAGAMENTO ===== */}
        <SectionTitle n={7}>Pagamento</SectionTitle>
        <div className="text-[11px] space-y-0.5">
          <KV label="Forma" value={PAYMENT.method} />
          <KV label="Quitação" value={PAYMENT.paidAt} />
          <KV label="Total quitado" value={<span className="font-bold">{fmt(total)}</span>} />
        </div>

        {/* ===== 8. AVALIAÇÃO ===== */}
        <SectionTitle n={8}>Avaliação registrada pelo cliente</SectionTitle>
        <div className="text-[11px] space-y-1">
          <p>
            <span className="font-semibold">Nota: </span>
            <span className="tracking-widest text-base align-middle">
              {"★".repeat(RATING.stars)}
              <span className="text-gray-400">{"☆".repeat(5 - RATING.stars)}</span>
            </span>
            <span className="ml-2 tabular-nums">({RATING.stars}/5)</span>
          </p>
          <p className="italic text-gray-800">"{RATING.comment}"</p>
          <p className="text-[10px] text-gray-600">— {RATING.by}, em {RATING.at}</p>
        </div>

        {/* ===== 9. DECLARAÇÕES ===== */}
        <SectionTitle n={9}>Declarações e garantia</SectionTitle>
        <ol className="list-decimal pl-5 text-[10.5px] leading-relaxed space-y-1 text-justify">
          <li>O prestador declara que os serviços descritos foram executados conforme as boas práticas técnicas aplicáveis a sistemas de refrigeração e ar-condicionado.</li>
          <li>As garantias indicadas no item 6 contam a partir da data de emissão deste laudo e cobrem reincidência da mesma falha em condições normais de uso, salvo se houver intervenção de terceiros no equipamento.</li>
          <li>O cliente declara ter recebido o equipamento em pleno funcionamento, ter conferido as peças substituídas (mantidas no local) e estar ciente das recomendações de uso e manutenção preventiva.</li>
        </ol>

        {/* ===== ASSINATURAS ===== */}
        <div className="grid grid-cols-2 gap-8 mt-10">
          <div className="text-center">
            <div className="border-t border-gray-900 pt-1 text-[10px]">
              <p className="font-semibold">{PROVIDER.professional}</p>
              <p className="text-gray-700">{PROVIDER.professionalTitle}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-900 pt-1 text-[10px]">
              <p className="font-semibold">{CLIENT.name}</p>
              <p className="text-gray-700">{CLIENT.document}</p>
            </div>
          </div>
        </div>

        {/* ===== RODAPÉ ===== */}
        <footer className="mt-8 pt-2 border-t border-gray-300 flex items-center justify-between text-[9px] text-gray-600">
          <span>{PROVIDER.name} · {PROVIDER.cnpj}</span>
          <span>Laudo {REPORT.id}</span>
          <span>Página 1 de 1</span>
        </footer>
      </div>
    </div>
  );
}
