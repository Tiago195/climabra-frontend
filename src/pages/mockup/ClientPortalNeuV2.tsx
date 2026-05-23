import { Bell, Wind, Plus, FileText, Calendar, Phone, Mail, ExternalLink, User } from "lucide-react";
import {
  NEU_BG,
  NEU_SHADOW_OUT,
  NEU_SHADOW_OUT_SM,
  NEU_SHADOW_PRESSED_SM,
  mock,
  NeuCard,
  NeuInset,
  NeuButton,
  NeuPrimaryButton,
  StatusPill,
} from "./neu/primitives";

export function ClientPortalNeuV2() {
  return (
    <div className="min-h-dvh" style={{ background: NEU_BG }}>
      <div className="mx-auto max-w-7xl p-8">
        <div className="grid grid-cols-12 gap-6">
          {/* SIDEBAR — hero + provider + footer */}
          <aside className="col-span-3 space-y-6 sticky top-8 self-start">
            <NeuCard className="text-center space-y-4">
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-blue-600"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
              >
                <User className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">Cliente</p>
                <h1 className="text-xl font-bold text-slate-700 leading-tight mt-1">{mock.client.name}</h1>
              </div>
              <div
                className="rounded-2xl p-3"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
              >
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Prestador</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{mock.provider.companyName}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-slate-500">
                  <Phone className="w-3 h-3" /> {mock.provider.phone}
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1 text-[11px] text-slate-500">
                  <Mail className="w-3 h-3" /> {mock.provider.email}
                </div>
              </div>
            </NeuCard>

            {mock.pendingReportsCount > 0 && (
              <NeuCard className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 shrink-0"
                  style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700 leading-none">{mock.pendingReportsCount}</p>
                  <p className="text-[11px] text-amber-800 font-medium mt-1">laudo aguardando aprovação</p>
                </div>
              </NeuCard>
            )}

            <NeuPrimaryButton>
              <Plus className="w-4 h-4" /> Solicitar nova visita
            </NeuPrimaryButton>
          </aside>

          {/* MAIN — 3 equal columns */}
          <main className="col-span-9 grid grid-cols-3 gap-5">
            {/* EQUIPMENTS column */}
            <section className="space-y-4">
              <div
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}>
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 leading-tight">Aparelhos</p>
                    <p className="text-[11px] text-slate-400">{mock.equipments.length} ativos</p>
                  </div>
                </div>
                <NeuButton size="sm">
                  <Plus className="w-3.5 h-3.5" />
                </NeuButton>
              </div>
              <div className="space-y-3">
                {mock.equipments.map((eq) => (
                  <NeuCard key={eq.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-500" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}>
                          <Wind className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{eq.label}</p>
                          <p className="text-[11px] text-slate-500">{eq.brand}</p>
                        </div>
                      </div>
                      {eq.pending > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white" style={{ background: "linear-gradient(145deg, #f59e0b, #d97706)" }}>
                          {eq.pending}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{eq.model}</p>
                    <NeuButton size="sm" accent={eq.pending > 0}>
                      <FileText className="w-3 h-3" /> {eq.reports} laudo(s)
                    </NeuButton>
                  </NeuCard>
                ))}
              </div>
            </section>

            {/* APPOINTMENTS column */}
            <section className="space-y-4">
              <div
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 leading-tight">Visitas</p>
                    <p className="text-[11px] text-slate-400">{mock.appointments.length} agendadas</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {mock.appointments.map((a) => (
                  <NeuCard key={a.id} className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700">{a.date}</p>
                      <StatusPill tone={a.status === "Pendente" ? "amber" : "blue"}>{a.status}</StatusPill>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{a.equipment}</p>
                    {a.notes && (
                      <div className="rounded-xl p-2.5" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}>
                        <p className="text-[11px] text-slate-500 italic leading-relaxed">{a.notes}</p>
                      </div>
                    )}
                  </NeuCard>
                ))}
              </div>
            </section>

            {/* SUBMISSIONS column */}
            <section className="space-y-4">
              <div
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 leading-tight">Solicitações</p>
                    <p className="text-[11px] text-slate-400">{mock.submissions.length} em aberto</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {mock.submissions.map((s) => (
                  <NeuCard key={s.id} className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">{s.equipment}</p>
                      <span className="text-[10px] text-slate-400">{s.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{s.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">Visita: {s.visitDate}</span>
                      <StatusPill tone="blue">{s.visitStatus}</StatusPill>
                    </div>
                  </NeuCard>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ClientPortalNeuV2;
