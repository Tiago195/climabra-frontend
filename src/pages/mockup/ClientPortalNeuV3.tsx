import { Bell, Wind, Plus, FileText, Calendar, Phone, Mail, ExternalLink, CheckCircle2 } from "lucide-react";
import {
  NEU_BG,
  NEU_SHADOW_OUT,
  NEU_SHADOW_OUT_SM,
  NEU_SHADOW_IN,
  NEU_SHADOW_PRESSED_SM,
  mock,
  NeuCard,
  NeuButton,
  NeuPrimaryButton,
  StatusPill,
} from "./neu/primitives";

type TimelineItem =
  | { kind: "appointment"; id: string; date: string; equipment: string; status: string; notes: string | null }
  | { kind: "submission"; id: string; createdAt: string; equipment: string; description: string; visitDate: string; visitStatus: string };

const timeline: TimelineItem[] = [
  ...mock.appointments.map(a => ({ kind: "appointment" as const, ...a })),
  ...mock.submissions.map(s => ({ kind: "submission" as const, ...s })),
];

export function ClientPortalNeuV3() {
  return (
    <div className="min-h-dvh" style={{ background: NEU_BG }}>
      <div className="mx-auto max-w-7xl p-8 space-y-6">
        {/* COMPACT HEADER STRIP */}
        <div
          className="flex items-center justify-between rounded-3xl px-6 py-4"
          style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
            >
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">Portal do cliente</p>
              <p className="text-base font-bold text-slate-700 leading-tight">{mock.client.name}</p>
            </div>
            <div className="h-10 w-px bg-slate-300/50 mx-2" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">Prestador</p>
              <p className="text-sm font-semibold text-slate-700">{mock.provider.companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mock.pendingReportsCount > 0 && (
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}
              >
                <Bell className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-amber-800 font-medium">
                  <span className="font-bold">{mock.pendingReportsCount}</span> laudo aguardando
                </p>
              </div>
            )}
            <NeuPrimaryButton size="sm">
              <Plus className="w-3.5 h-3.5" /> Nova visita
            </NeuPrimaryButton>
          </div>
        </div>

        {/* MAIN — Timeline (left) + Equipments rail (right) */}
        <div className="grid grid-cols-12 gap-6">
          {/* TIMELINE 2/3 */}
          <section className="col-span-8">
            <div
              className="flex items-center justify-between rounded-2xl px-5 py-3 mb-4"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 leading-tight">Linha do tempo</p>
                  <p className="text-[11px] text-slate-400">{timeline.length} eventos recentes</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}>
                  <Calendar className="w-3 h-3" /> Visitas
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}>
                  <ExternalLink className="w-3 h-3" /> Solicitações
                </span>
              </div>
            </div>

            <NeuCard>
              <div className="relative pl-8">
                {/* timeline rail */}
                <div
                  className="absolute left-3 top-2 bottom-2 w-1 rounded-full"
                  style={{ background: NEU_BG, boxShadow: NEU_SHADOW_IN }}
                />
                <div className="space-y-4">
                  {timeline.map((item) => (
                    <div key={`${item.kind}-${item.id}`} className="relative">
                      {/* dot */}
                      <div
                        className={`absolute -left-[26px] top-2 w-5 h-5 rounded-full flex items-center justify-center ${
                          item.kind === "appointment" ? "text-blue-500" : "text-slate-500"
                        }`}
                        style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
                      >
                        {item.kind === "appointment" ? (
                          <Calendar className="w-2.5 h-2.5" />
                        ) : (
                          <ExternalLink className="w-2.5 h-2.5" />
                        )}
                      </div>

                      <div
                        className="rounded-2xl p-4"
                        style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-700">
                              {item.kind === "appointment" ? item.date : item.createdAt}
                            </p>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                              {item.kind === "appointment" ? "Visita" : "Solicitação"}
                            </span>
                          </div>
                          <StatusPill tone={item.kind === "appointment" ? (item.status === "Pendente" ? "amber" : "blue") : "neutral"}>
                            {item.kind === "appointment" ? item.status : item.visitStatus}
                          </StatusPill>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{item.equipment}</p>
                        {item.kind === "appointment" && item.notes && (
                          <p className="text-[11px] text-slate-400 italic mt-1.5">{item.notes}</p>
                        )}
                        {item.kind === "submission" && (
                          <>
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5">{item.description}</p>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                              <CheckCircle2 className="w-3 h-3" /> Visita: {item.visitDate}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </NeuCard>
          </section>

          {/* EQUIPMENTS RAIL 1/3 */}
          <aside className="col-span-4 space-y-4">
            <div
              className="flex items-center justify-between rounded-2xl px-5 py-3"
              style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}>
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 leading-tight">Aparelhos</p>
                  <p className="text-[11px] text-slate-400">{mock.equipments.length} ativos</p>
                </div>
              </div>
              <NeuButton size="sm">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </NeuButton>
            </div>

            <NeuCard>
              <div className="space-y-2">
                {mock.equipments.map((eq) => (
                  <div
                    key={eq.id}
                    className="rounded-2xl p-3 flex items-center gap-3"
                    style={{ background: NEU_BG, boxShadow: NEU_SHADOW_IN }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-500 shrink-0"
                      style={{ background: NEU_BG, boxShadow: NEU_SHADOW_OUT_SM }}
                    >
                      <Wind className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-700 truncate">{eq.label}</p>
                        {eq.pending > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white" style={{ background: "linear-gradient(145deg, #f59e0b, #d97706)" }}>
                            {eq.pending}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{eq.brand} · {eq.model}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{eq.visits}v · {eq.reports}l</p>
                    </div>
                    <NeuButton size="sm" accent={eq.pending > 0}>
                      <FileText className="w-3 h-3" />
                    </NeuButton>
                  </div>
                ))}
              </div>
            </NeuCard>

            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 px-3 py-1.5 rounded-full" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}>
                <Phone className="w-3 h-3" /> {mock.provider.phone}
              </div>
              <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 px-3 py-1.5 rounded-full" style={{ background: NEU_BG, boxShadow: NEU_SHADOW_PRESSED_SM }}>
                <Mail className="w-3 h-3" /> {mock.provider.email}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ClientPortalNeuV3;
