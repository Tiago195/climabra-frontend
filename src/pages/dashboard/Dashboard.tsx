import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CalendarDays, Plus, CheckCircle2, AlertCircle, ArrowRight, XCircle, Clock, AirVent, History, Star } from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { useRequireProfile } from "@/components/CompleteProfileDialog";
import { clientService, type IClientResponse } from "@/services/client";
import { appointmentService, type IAppointmentDetailResponse } from "@/services/appointment";
import { ratingService, type IRating } from "@/services/rating";

export function Dashboard() {
  const { provider, token } = useAuth();
  const navigate = useNavigate();
  const requireProfile = useRequireProfile();

  const [clients, setClients] = useState<IClientResponse[]>([]);
  const [appointments, setAppointments] = useState<IAppointmentDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<IRating[]>([]);

  useEffect(() => {
    if (provider?.publicToken) {
      setRatings(ratingService.listByProvider(provider.publicToken));
    }
  }, [provider?.publicToken]);

  const avgStars = ratings.length
    ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
    : 0;
  const recentRatings = ratings.slice(0, 3);

  const isProfileComplete = provider?.status !== "pending";

  useEffect(() => {
    if (!token) return;
    Promise.all([clientService.list(token), appointmentService.list(token)])
      .then(([c, a]) => { setClients(c); setAppointments(a); })
      .finally(() => setLoading(false));
  }, [token]);

  const totalClients = clients.length;
  const scheduled = appointments.filter(a => a.appointment.status === "scheduled").length;
  const completed = appointments.filter(a => a.appointment.status === "completed").length;
  const canceled = appointments.filter(a => a.appointment.status === "canceled").length;

  const now = new Date();
  const upcoming = appointments
    .filter(a => a.appointment.status === "scheduled" && new Date(a.appointment.scheduledAt) >= now)
    .sort((a, b) => new Date(a.appointment.scheduledAt).getTime() - new Date(b.appointment.scheduledAt).getTime())
    .slice(0, 5);

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const timelineItems = [...appointments]
    .sort((a, b) => new Date(b.appointment.scheduledAt).getTime() - new Date(a.appointment.scheduledAt).getTime())
    .slice(0, 8);

  const TIMELINE_STATUS: Record<string, { label: string; icon: React.ElementType; dot: string; badge: string }> = {
    scheduled: { label: "Agendado",  icon: Clock,        dot: "bg-blue-500",  badge: "bg-blue-50 text-blue-700" },
    completed: { label: "Concluído", icon: CheckCircle2, dot: "bg-green-500", badge: "bg-green-50 text-green-700" },
    canceled:  { label: "Cancelado", icon: XCircle,      dot: "bg-gray-300",  badge: "bg-gray-100 text-gray-500" },
    no_show:   { label: "Não compareceu", icon: XCircle, dot: "bg-red-400",   badge: "bg-red-50 text-red-600" },
  };

  const fmtTimelineDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      + " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Bem-vindo, {provider?.companyName ?? provider?.name}</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={() => requireProfile(() => navigate("/dashboard/clients"))}
        >
          <Plus className="w-4 h-4" />
          Novo cliente
        </Button>
      </div>

      {!isProfileComplete && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">Finalize seu cadastro</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Adicione seu nome e telefone pra começar a cadastrar clientes e gerar links.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              onClick={() => requireProfile(() => {})}
            >
              Completar
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-gray-500 font-medium">Total Clientes</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-gray-500 font-medium">Visitas agendadas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{scheduled}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-gray-500 font-medium">Concluídas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Canceladas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{canceled}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Avaliações dos clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ratings.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma avaliação recebida ainda</p>
              <p className="text-xs mt-1">
                Os clientes podem avaliar após o laudo ser concluído.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">{avgStars.toFixed(1)}</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star
                      key={n}
                      className={`w-4 h-4 ${n <= Math.round(avgStars) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  ({ratings.length} avaliaç{ratings.length === 1 ? "ão" : "ões"})
                </span>
              </div>
              <div className="space-y-3">
                {recentRatings.map(r => (
                  <div key={r.reportToken} className="border-l-2 border-amber-200 pl-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            className={`w-3 h-3 ${n <= r.stars ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {r.clientName ?? "Cliente"} · {new Date(r.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-700 italic mt-1">"{r.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            Linha do tempo dos serviços
          </CardTitle>
          <Link to="/dashboard/requests">
            <Button variant="ghost" size="sm" className="text-blue-600 gap-1 text-xs">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : timelineItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum serviço registrado ainda</p>
            </div>
          ) : (
            <ol className="relative border-l-2 border-gray-100 ml-3 space-y-4">
              {timelineItems.map(row => {
                const { appointment: appt, client, equipments } = row;
                const conf = TIMELINE_STATUS[appt.status] ?? TIMELINE_STATUS.scheduled;
                const Icon = conf.icon;
                const eqCount = equipments.length;
                return (
                  <li key={appt.id} className="pl-5 relative">
                    <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ring-2 ring-white ${conf.dot}`} />
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${conf.badge}`}>
                            <Icon className="w-3 h-3" /> {conf.label}
                          </span>
                          <span className="text-xs text-gray-500">{fmtTimelineDate(appt.scheduledAt)}</span>
                        </div>
                        <Link
                          to={`/dashboard/clients/${client.id}`}
                          className="block text-sm font-medium text-gray-900 mt-1 hover:text-blue-700 truncate"
                        >
                          {client.name}
                        </Link>
                        {eqCount > 0 && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <AirVent className="w-3 h-3 text-blue-400" />
                            {eqCount} equipamento{eqCount > 1 ? "s" : ""}
                          </p>
                        )}
                        {appt.notes && (
                          <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">{appt.notes}</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Próximas visitas</CardTitle>
            <Link to="/dashboard/requests">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1 text-xs">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma visita agendada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(a => (
                  <div key={a.appointment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{a.client.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(a.appointment.scheduledAt).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-blue-100 text-blue-700 text-xs">Agendado</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Clientes recentes</CardTitle>
            <Link to="/dashboard/clients">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1 text-xs">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : recentClients.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum cliente cadastrado</p>
                <Button
                  size="sm"
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                  onClick={() => requireProfile(() => navigate("/dashboard/clients"))}
                >
                  <Plus className="w-3 h-3 mr-1" /> Adicionar cliente
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentClients.map(c => (
                  <Link key={c.id} to={`/dashboard/clients/${c.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
