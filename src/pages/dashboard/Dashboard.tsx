import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  ShoppingBag, DollarSign, TrendingUp, Users,
  Clock, CheckCircle2, XCircle, RefreshCw, Eye, LogOut, MessageCircle, Image,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { ProdutosManager } from "./ProdutosManager";
import { BannersManager } from "./BannersManager";
import {
  Pedido, carregarPedidos, atualizarStatus,
  PAGAMENTO_LABEL, STATUS_LABEL,
  filtrarPorPeriodo, topItens, pedidosPorDia,
} from "./types";

type Periodo = "dia" | "semana" | "mes" | "todos";

const PERIODO_OPTS: { value: Periodo; label: string }[] = [
  { value: "dia", label: "Hoje" },
  { value: "semana", label: "7 dias" },
  { value: "mes", label: "Este mês" },
  { value: "todos", label: "Todos" },
];

const PIE_COLORS = ["#1d3a8a", "#f5a500", "#22c55e", "#ef4444", "#8b5cf6"];

const STATUS_CONFIG = {
  pendente:  { label: "Pendente",  color: "bg-yellow-100 text-yellow-800 border-yellow-200",  icon: Clock },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-800 border-green-200",    icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200",          icon: XCircle },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [todos, setTodos]             = useState<Pedido[]>([]);
  const [periodo, setPeriodo]         = useState<Periodo>("semana");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [pedidoAtivo, setPedidoAtivo] = useState<Pedido | null>(null);
  const [aba, setAba] = useState<"pedidos" | "relatorios" | "produtos" | "banners">("pedidos");

  const handleLogout = () => {
    logout();
    navigate("/painel");
  };

  const recarregar = useCallback(() => {
    setTodos(carregarPedidos());
  }, []);

  useEffect(() => {
    recarregar();
    const id = setInterval(recarregar, 10000);
    return () => clearInterval(id);
  }, [recarregar]);

  const filtrados = filtrarPorPeriodo(todos, periodo);
  const exibidos  = filtroStatus === "todos" ? filtrados : filtrados.filter((p) => p.status === filtroStatus);

  const totalReceita    = filtrados.reduce((s, p) => s + p.total, 0);
  const totalPedidos    = filtrados.length;
  const ticketMedio     = totalPedidos > 0 ? totalReceita / totalPedidos : 0;
  const clientesUnicos  = new Set(filtrados.map((p) => p.telefone)).size;

  const itensMaisVendidos = topItens(filtrados);
  const graficoDias       = pedidosPorDia(filtrados, periodo === "mes" ? 30 : 7);

  const payBreakdown = filtrados.reduce<Record<string, number>>((acc, p) => {
    acc[p.formaPagamento] = (acc[p.formaPagamento] || 0) + 1;
    return acc;
  }, {});
  const payData = Object.entries(payBreakdown).map(([k, v]) => ({
    name: PAGAMENTO_LABEL[k] ?? k, value: v,
  }));

  const ultimoCountRef = useRef(0);
  useEffect(() => {
    if (todos.length > ultimoCountRef.current && ultimoCountRef.current > 0) {
      try {
        const ctx = new AudioContext();
        [440, 550, 660].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
      } catch (_) {}
    }
    ultimoCountRef.current = todos.length;
  }, [todos.length]);

  const handleStatus = (id: string, status: Pedido["status"]) => {
    atualizarStatus(id, status);
    recarregar();
    if (pedidoAtivo?.id === id) setPedidoAtivo((prev) => prev ? { ...prev, status } : null);
  };

  const handleWhatsAppCliente = (pedido: Pedido) => {
    const tel = pedido.telefone.replace(/\D/g, "");
    const telFormatado = tel.startsWith("55") ? tel : `55${tel}`;
    const statusMsg = pedido.status === "concluido"
      ? `✅ *Seu pedido ${pedido.id} foi entregue!* Obrigado pela preferência! 🧊\n\n— Gela Redenção`
      : pedido.status === "cancelado"
      ? `❌ *Infelizmente seu pedido ${pedido.id} foi cancelado.* Entre em contato para mais informações.\n\n— Gela Redenção`
      : `🛵 *Seu pedido ${pedido.id} está a caminho!* Tempo estimado: 30–45 minutos.\n\nQualquer dúvida é só responder aqui. 🧊\n\n— Gela Redenção`;
    window.open(`https://wa.me/${telFormatado}?text=${encodeURIComponent(statusMsg)}`, "_blank");
  };

  const ABAS = [
    { id: "pedidos",   label: "📦 Pedidos" },
    { id: "relatorios", label: "📈 Relatórios" },
    { id: "produtos",  label: "🛒 Produtos" },
    { id: "banners",   label: "🖼️ Banners" },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1b3d] border-b border-white/10 shadow-lg">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧊</span>
            <div>
              <span className="font-display font-black text-lg text-[#f5a500]">Dashboard</span>
              <span className="text-white/40 text-sm hidden sm:inline ml-2">— Gela Redenção</span>
            </div>
            {todos.filter(p => p.status === "pendente").length > 0 && (
              <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
                {todos.filter(p => p.status === "pendente").length} novo{todos.filter(p => p.status === "pendente").length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 hidden sm:block">Auto-atualiza 10s</span>
            <Button size="sm" variant="ghost" className="text-[#f5a500] hover:bg-white/10" onClick={recarregar}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-semibold">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">

        {/* Seletor de período */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-black text-primary">Painel de Controle</h1>
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            {PERIODO_OPTS.map((o) => (
              <button
                key={o.value}
                onClick={() => setPeriodo(o.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  periodo === o.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Faturamento", value: `R$ ${totalReceita.toFixed(2).replace(".", ",")}`, color: "text-green-600", bg: "bg-green-50" },
            { icon: ShoppingBag, label: "Pedidos", value: totalPedidos, color: "text-blue-600", bg: "bg-blue-50" },
            { icon: TrendingUp, label: "Ticket Médio", value: `R$ ${ticketMedio.toFixed(2).replace(".", ",")}`, color: "text-purple-600", bg: "bg-purple-50" },
            { icon: Users, label: "Clientes", value: clientesUnicos, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4 shadow-card"
            >
              <div className={`${kpi.bg} rounded-xl p-2.5 w-fit mb-3`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{kpi.label}</p>
              <p className={`font-display text-2xl font-black ${kpi.color} mt-0.5`}>{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit flex-wrap">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                aba === a.id ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* ── ABA PEDIDOS ── */}
        {aba === "pedidos" && (
          <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {["todos", "pendente", "concluido", "cancelado"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFiltroStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      filtroStatus === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {s === "todos" ? "Todos" : STATUS_LABEL[s]} ({s === "todos" ? filtrados.length : filtrados.filter(p => p.status === s).length})
                  </button>
                ))}
              </div>

              {exibidos.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum pedido encontrado</p>
                  <p className="text-sm">Os pedidos aparecem aqui em tempo real</p>
                </div>
              ) : (
                exibidos
                  .slice()
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .map((pedido) => {
                    const cfg = STATUS_CONFIG[pedido.status] ?? STATUS_CONFIG.pendente;
                    return (
                      <motion.div
                        key={pedido.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`bg-card border rounded-2xl p-4 shadow-card cursor-pointer transition-all hover:shadow-glow ${
                          pedidoAtivo?.id === pedido.id ? "border-primary" : "border-border"
                        }`}
                        onClick={() => setPedidoAtivo(pedidoAtivo?.id === pedido.id ? null : pedido)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-black text-primary">{pedido.id}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="font-semibold text-sm mt-0.5">{pedido.cliente}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pedido.data).toLocaleString("pt-BR")} · {PAGAMENTO_LABEL[pedido.formaPagamento] ?? pedido.formaPagamento}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">📍 {pedido.endereco}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-display font-black text-primary text-lg">
                              R$ {pedido.total.toFixed(2).replace(".", ",")}
                            </p>
                            <p className="text-xs text-muted-foreground">{pedido.itens.length} item{pedido.itens.length !== 1 ? "s" : ""}</p>
                            <Eye className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
              )}
            </div>

            {pedidoAtivo && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card border border-primary rounded-2xl shadow-glow overflow-hidden sticky top-20"
              >
                <div className="bg-gradient-hero p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-black text-secondary text-lg">{pedidoAtivo.id}</p>
                      <p className="text-primary-foreground/80 text-sm">{pedidoAtivo.cliente}</p>
                    </div>
                    <button onClick={() => setPedidoAtivo(null)} className="text-primary-foreground/60 hover:text-white">✕</button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="text-sm space-y-1.5">
                    <p><span className="text-muted-foreground">📱 Tel:</span> {pedidoAtivo.telefone}</p>
                    <p><span className="text-muted-foreground">📍 End:</span> {pedidoAtivo.endereco}</p>
                    {pedidoAtivo.referencia && <p><span className="text-muted-foreground">📌 Ref:</span> {pedidoAtivo.referencia}</p>}
                    <p><span className="text-muted-foreground">💳 Pag:</span> {PAGAMENTO_LABEL[pedidoAtivo.formaPagamento] ?? pedidoAtivo.formaPagamento}</p>
                    {pedidoAtivo.troco && <p><span className="text-muted-foreground">💵 Troco p/:</span> R$ {pedidoAtivo.troco}</p>}
                    <p><span className="text-muted-foreground">🕒:</span> {new Date(pedidoAtivo.data).toLocaleString("pt-BR")}</p>
                  </div>

                  <div className="border-t border-border pt-3 space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Itens</p>
                    {pedidoAtivo.itens.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.quantidade}× {item.nome}</span>
                        <span className="font-semibold">R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between text-sm text-muted-foreground">
                      <span>Taxa de entrega</span>
                      <span>R$ {pedidoAtivo.taxaEntrega.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between font-display font-black text-primary text-lg">
                      <span>Total</span>
                      <span>R$ {pedidoAtivo.total.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Atualizar status</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["pendente", "concluido", "cancelado"] as const).map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatus(pedidoAtivo.id, s)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              pedidoAtivo.status === s
                                ? cfg.color
                                : "bg-muted border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handleWhatsAppCliente(pedidoAtivo)}
                      className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Enviar mensagem ao cliente
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── ABA RELATÓRIOS ── */}
        {aba === "relatorios" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
              <h3 className="font-display font-bold text-primary mb-4">📈 Faturamento por dia</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={graficoDias} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1d3a8a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1d3a8a" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [`R$ ${v.toFixed(2).replace(".", ",")}`, "Receita"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
                  />
                  <Area type="monotone" dataKey="receita" stroke="#1d3a8a" fill="url(#gradRec)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
              <h3 className="font-display font-bold text-primary mb-4">📦 Pedidos por dia</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={graficoDias} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: number) => [v, "Pedidos"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="pedidos" fill="#f5a500" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                <h3 className="font-display font-bold text-primary mb-4">🏆 Itens mais pedidos</h3>
                {itensMaisVendidos.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Sem dados para o período</p>
                ) : (
                  <div className="space-y-3">
                    {itensMaisVendidos.slice(0, 8).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-display font-black text-lg text-primary/30 w-6">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.nome}</p>
                          <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-gold rounded-full"
                              style={{ width: `${(item.quantidade / itensMaisVendidos[0].quantidade) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary">{item.quantidade} un.</p>
                          <p className="text-xs text-muted-foreground">R$ {item.receita.toFixed(2).replace(".", ",")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                <h3 className="font-display font-bold text-primary mb-4">💳 Formas de pagamento</h3>
                {payData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Sem dados para o período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={payData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                        {payData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }} />
                      <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
              <h3 className="font-display font-bold text-primary mb-4">📋 Resumo do período</h3>
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total de pedidos</p>
                  <p className="font-display text-3xl font-black text-primary">{totalPedidos}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Valor total vendido</p>
                  <p className="font-display text-3xl font-black text-green-600">R$ {totalReceita.toFixed(2).replace(".", ",")}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ticket médio</p>
                  <p className="font-display text-3xl font-black text-purple-600">R$ {ticketMedio.toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ABA PRODUTOS ── */}
        {aba === "produtos" && (
          <div className="pb-8">
            <ProdutosManager />
          </div>
        )}

        {/* ── ABA BANNERS ── */}
        {aba === "banners" && (
          <div className="pb-8">
            <BannersManager />
          </div>
        )}
      </div>
    </div>
  );
}
