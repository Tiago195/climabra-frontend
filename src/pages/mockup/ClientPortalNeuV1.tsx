import { Bell, Wind, Plus, FileText, Calendar, Phone, Mail, ExternalLink } from "lucide-react";
import {
  NEU_BG,
  NEU_SHADOW_OUT_SM,
  NEU_SHADOW_PRESSED_SM,
  mock,
  NeuCard,
  NeuInset,
  NeuButton,
  NeuPrimaryButton,
  StatusPill,
  SectionHeader,
} from "./neu/primitives";

export function ClientPortalNeuV1() {
  return (
    <div className="min-h-dvh" style={{ background: NEU_BG }}>
      <div className="mx-auto max-w-7xl p-8 space-y-6">
        {/* HERO — full width, horizontal */}
        <NeuCard className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-blue-600"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
            >
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">Olá,</p>
              <h1 className="text-3xl font-bold text-slate-700 leading-tight">{mock.client.name}</h1>
              <p className="text-xs text-slate-500 mt-1">
                Atendido por <span className="font-semibold text-slate-700">{mock.provider.companyName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-amber-600"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
              >
                <Bell className="w-4 h-4" />
              </div>
              <p className="text-sm text-amber-800 font-medium leading-tight">
                <span className="font-bold">{mock.pendingReportsCount} laudo</span> aguardando aprovação
              </p>
            </div>
            <NeuPrimaryButton>
              <Plus className="w-4 h-4" /> Nova visita
            </NeuPrimaryButton>
          </div>
        </NeuCard>

        {/* TWO COLUMNS */}
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT — Equipments (2/3) */}
          <div className="col-span-2 space-y-4">
            <div
              className="relative z-10 mx-4 -mb-5 flex items-center justify-between rounded-2xl px-5 py-3"
              style={{ background: NEU_BG, boxShadow: "8px 8px 20px rgba(163, 177, 198, 0.55), -8px -8px 20px rgba(255, 255, 255, 0.95)" }}
            >
              <SectionHeader
                icon={<Wind className="w-4 h-4" />}
                title="Meus ar-condicionados"
                subtitle={`${mock.equipments.length} aparelhos`}
              />
              <NeuButton size="sm">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </NeuButton>
            </div>
            <NeuCard className="pt-9">
              <div className="grid grid-cols-2 gap-3">
                {mock.equipments.map((eq) => (
                  <NeuInset key={eq.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-500"
                        style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
                      >
                        <Wind className="w-4 h-4" />
                      </div>
                      {eq.pending > 0 && <StatusPill tone="amber">{eq.pending} pendente</StatusPill>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{eq.label}</p>
                      <p className="text-[11px] text-slate-500">{eq.brand} · {eq.model}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                      <p className="text-[11px] text-slate-400">{eq.visits} visitas · {eq.reports} laudos</p>
                      <NeuButton size="sm" accent={eq.pending > 0}>
                        <FileText className="w-3 h-3" /> Laudos
                      </NeuButton>
                    </div>
                  </NeuInset>
                ))}
              </div>
            </NeuCard>
          </div>

          {/* RIGHT — Visits + Submissions stacked (1/3) */}
          <div className="space-y-6">
            <NeuCard className="space-y-4">
              <SectionHeader
                icon={<Calendar className="w-4 h-4" />}
                title="Próximas visitas"
                subtitle={`${mock.appointments.length} agendadas`}
              />
              <div className="space-y-3">
                {mock.appointments.map((a) => (
                  <NeuInset key={a.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-700">{a.date}</p>
                      <StatusPill tone={a.status === "Pendente" ? "amber" : "blue"}>{a.status}</StatusPill>
                    </div>
                    <p className="text-[11px] text-slate-500">{a.equipment}</p>
                    {a.notes && <p className="text-[11px] text-slate-400 italic">{a.notes}</p>}
                  </NeuInset>
                ))}
              </div>
            </NeuCard>

            <NeuCard className="space-y-4">
              <SectionHeader
                icon={<ExternalLink className="w-4 h-4" />}
                title="Solicitações"
                subtitle={`${mock.submissions.length} em andamento`}
              />
              <div className="space-y-3">
                {mock.submissions.map((s) => (
                  <NeuInset key={s.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-700">{s.equipment}</p>
                      <span className="text-[10px] text-slate-400">{s.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{s.description}</p>
                    <div className="flex items-center gap-2">
                      <StatusPill tone="blue">{s.visitStatus}</StatusPill>
                    </div>
                  </NeuInset>
                ))}
              </div>
            </NeuCard>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 px-3 py-1.5 rounded-full" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}>
            <Phone className="w-3 h-3" /> {mock.provider.phone}
          </div>
          <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 px-3 py-1.5 rounded-full" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}>
            <Mail className="w-3 h-3" /> {mock.provider.email}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientPortalNeuV1;
