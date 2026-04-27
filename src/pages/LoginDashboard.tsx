import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

const LoginDashboard = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const success = login(username, password);
      setLoading(false);
      if (success) {
        toast.success("Acesso autorizado!");
        navigate("/dashboard");
      } else {
        toast.error("Usuário ou senha inválidos");
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0f1b3d] flex flex-col items-center justify-center px-4">
      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 bg-[#1d3a8a]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 bg-[#f5a500]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 bg-[#f5a500] rounded-2xl flex items-center justify-center shadow-lg shadow-[#f5a500]/30">
            <span className="text-3xl">🧊</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gela Redenção
          </h1>
          <p className="text-[#f5a500] font-semibold text-sm mt-1 tracking-widest uppercase">
            Painel Administrativo
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-5 w-5 text-[#f5a500]" />
            <span className="text-white/70 text-sm font-medium">Acesso restrito</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/80 text-sm font-semibold">
                Usuário
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#f5a500] focus:ring-[#f5a500]/30 h-11"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm font-semibold">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#f5a500] focus:ring-[#f5a500]/30 h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-[#f5a500] hover:bg-[#e09500] text-[#0f1b3d] font-black text-base h-12 rounded-xl shadow-lg shadow-[#f5a500]/30 transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Entrar no Painel
                </span>
              )}
            </Button>
          </form>


        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © 2025 Gela Redenção — Sistema de Gestão
        </p>
      </motion.div>
    </div>
  );
};

export default LoginDashboard;
