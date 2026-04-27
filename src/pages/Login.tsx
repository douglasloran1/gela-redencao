import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { Header } from "@/components/Header";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    const success = login(username, password);
    setLoading(false);
    if (success) {
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } else {
      toast.error("Usuário ou senha inválidos");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center">
            <h2 className="font-display text-3xl font-black text-primary">
              Gela Redenção
            </h2>
            <p className="text-muted-foreground">
              Painel de Controle
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-gold text-secondary-foreground border-0 font-bold shadow-gold hover:opacity-95"
              disabled={loading}
            >
              {loading ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Entrando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" /> Entrar
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            <p>
              Usuário: <code className="bg-muted px-1 rounded">admin</code>{" "}
              Senha: <code className="bg-muted px-1 rounded">admin123</code>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;