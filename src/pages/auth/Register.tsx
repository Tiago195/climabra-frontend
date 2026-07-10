import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/authContext";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Wind, ShieldCheck } from "lucide-react";
import { authService } from "@/services/auth";
import { toast } from "sonner";
import { getApiErrorMessage, getFieldErrors } from "@/services/apiError";
import { FieldError } from "@/components/ui/field-error";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Preencha email e senha")
      return;
    }
    if (form.password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setFieldErrors(null);
    setLoading(true);
    try {
      const provider = await authService.save(form);
      const { token } = await authService.login(form)
      login(provider, token);
      toast.success("Conta criada! Bem-vindo.");
      navigate("/dashboard");
    } catch (err) {
      const fields = getFieldErrors(err);
      if (fields) {
        setFieldErrors(fields);
      } else {
        toast.error(getApiErrorMessage(err, "Erro ao criar conta"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-2 shadow-lg">
            <Wind className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">ClimaGestão</h1>
          <p className="text-gray-500">Crie sua conta em segundos</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Cadastro grátis</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} autoFocus aria-invalid={!!fieldErrors?.email} />
                <FieldError message={fieldErrors?.email} />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input name="password" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={handleChange} aria-invalid={!!fieldErrors?.password} />
                <FieldError message={fieldErrors?.password} />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Criar conta grátis
              </Button>
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Sem cartão de crédito. Cancele quando quiser.
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link to="/auth/login" className="text-blue-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
