import { createBrowserRouter, Navigate } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { RequireAuth } from "@/components/RequireAuth"

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("@/pages/landing/Landing").then((m) => ({ Component: m.default })),
  },
  {
    path: "/auth/login",
    lazy: () => import("@/pages/auth/Login").then((m) => ({ Component: m.default })),
  },
  {
    path: "/auth/register",
    lazy: () => import("@/pages/auth/Register").then((m) => ({ Component: m.default })),
  },
  {
    // Todas as rotas do provider vivem sob o guard: sem token, redireciona ao login em vez de
    // pintar o shell autenticado vazio.
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      {
        path: "/dashboard",
        lazy: () => import("@/pages/dashboard/Dashboard").then(({ Dashboard }) => ({ Component: Dashboard })),
      },
      {
        path: "/dashboard/clients",
        lazy: () => import("@/pages/clients/Client").then(({ Client }) => ({ Component: Client })),
      },
      {
        path: "/dashboard/clients/map",
        lazy: () => import("@/pages/clients/ClientsMap").then(({ ClientsMap }) => ({ Component: ClientsMap })),
      },
      {
        path: "/dashboard/clients/:id",
        lazy: () => import("@/pages/clients/ClientDetail").then(({ ClientDetail }) => ({ Component: ClientDetail })),
      },
      {
        path: "/dashboard/leads",
        lazy: () => import("@/pages/leads/Leads").then(({ Leads }) => ({ Component: Leads })),
      },
      {
        // AGENDA-UNI (H1): rota única "Agenda" com segmentos Rota / Calendário / Histórico (?tab=).
        path: "/dashboard/agenda",
        lazy: () => import("@/pages/agenda/Agenda").then(({ Agenda }) => ({ Component: Agenda })),
      },
      {
        // Disponibilidade é sub-tela da Agenda (⚙ no header, D3). AGENDA-UNI H2: header
        // "‹ Disponibilidade" com back p/ Agenda, grade com vagas e "Bloqueios e folgas".
        path: "/dashboard/agenda/disponibilidade",
        lazy: () => import("@/pages/agenda/disponibilidade/Availability").then(({ Availability }) => ({ Component: Availability })),
      },
      {
        // Redirect de compatibilidade: links/hábitos antigos → Agenda (segmento Calendário).
        path: "/dashboard/requests",
        element: <Navigate to="/dashboard/agenda?tab=calendario" replace />,
      },
      {
        path: "/dashboard/financeiro",
        lazy: () => import("@/pages/finance/Finance").then(({ Finance }) => ({ Component: Finance })),
      },
      {
        path: "/dashboard/funil",
        lazy: () => import("@/pages/pipeline/Pipeline").then(({ Pipeline }) => ({ Component: Pipeline })),
      },
      {
        // Redirect de compatibilidade: rota antiga da disponibilidade → sub-tela da Agenda.
        path: "/dashboard/availability",
        element: <Navigate to="/dashboard/agenda/disponibilidade" replace />,
      },
      {
        path: "/dashboard/settings",
        lazy: () => import("@/pages/settings/Settings").then(({ Settings }) => ({ Component: Settings })),
      },
      {
        path: "/dashboard/reports/:id",
        lazy: () => import("@/pages/report/ReportEditor").then(({ ReportEditor }) => ({ Component: ReportEditor })),
      },
    ],
  },
  {
    path: "/providers/:providerToken/clients/:clientId/equipment/:equipmentId/laudo/:reportToken",
    lazy: () => import("@/pages/report/PublicReport").then(({ PublicReport }) => ({ Component: PublicReport })),
  },
  {
    // Página pública de acompanhamento "a caminho" (PLANO_ROTAS_TEMPO_REAL, Fase 3). Sem guard —
    // o gate é o token de vida curta na URL (como o laudo público acima).
    path: "/acompanhar/:token",
    lazy: () => import("@/pages/tracking/TrackClient").then(({ TrackClient }) => ({ Component: TrackClient })),
  },
  {
    path: "/providers/:publicToken/client",
    lazy: () => import("@/pages/clients/ClientSignUp").then(({ClientSignUp}) => ({ Component: ClientSignUp })),
  },
  {
    path: "/providers/:publicToken/clients/:id",
    lazy: () => import("@/pages/clients/ClientPortal").then(({ClientPortal}) => ({ Component: ClientPortal })),
  },
  {
    path: "/providers/:publicToken/clients/:id/request",
    lazy: () => import("@/pages/clients/ClientForm").then(m => ({ Component: m.default })),
  }
])
