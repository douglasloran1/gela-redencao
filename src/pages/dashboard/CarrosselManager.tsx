import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag, Plus, Trash2, Eye, EyeOff, Loader2,
  GripVertical, ToggleLeft, ToggleRight, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useProdutos } from "@/store/produtos";
import { toast } from "sonner";

type ItemCarrossel = {
  id: number;
  produto_id: string;
  preco_promo: number;
  visivel: boolean;
  ordem: number;
  nome: string;
  imagem: string;
  preco_original: number;
  categoria: string;
};

export function CarrosselManager() {
  const { produtos, carregar: carregarProdutos } = useProdutos();
  const [itens, setItens]               = useState<ItemCarrossel[]>([]);
  const [carregando, setCarregando]     = useState(true);
  const [carrosselVisivel, setCarrosselVisivel] = useState(true);
  const [salvandoConfig, setSalvandoConfig]     = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca]               = useState("");
  const [precoPromo, setPrecoPromo]     = useState<Record<string, string>>({});
  const [adicionando, setAdicionando]   = useState<string | null>(null);
  const [removendo, setRemovendo]       = useState<number | null>(null);
  const [salvandoPreco, setSalvandoPreco] = useState<number | null>(null);

  const carregar = async () => {
    setCarregando(true);
    try {
      // Visibilidade global
      const { data: config } = await supabase
        .from("configuracoes")
        .select("valor")
        .eq("chave", "carrossel_visivel")
        .single();
      setCarrosselVisivel(config?.valor === "true");

      // Itens do carrossel
      const { data } = await supabase
        .from("carrossel")
        .select(`id, produto_id, preco_promo, visivel, ordem, produtos(nome, imagem, preco, categoria)`)
        .order("ordem", { ascending: true });

      if (data) {
        setItens(data.map((i: any) => ({
          id: i.id,
          produto_id: i.produto_id,
          preco_promo: i.preco_promo,
          visivel: i.visivel,
          ordem: i.ordem,
          nome: i.produtos?.nome ?? "",
          imagem: i.produtos?.imagem ?? "",
          preco_original: i.produtos?.preco ?? 0,
          categoria: i.produtos?.categoria ?? "",
        })));
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
    carregarProdutos();
  }, []);

  const toggleCarrosselVisivel = async () => {
    setSalvandoConfig(true);
    const novoValor = !carrosselVisivel;
    await supabase
      .from("configuracoes")
      .upsert({ chave: "carrossel_visivel", valor: novoValor ? "true" : "false" });
    setCarrosselVisivel(novoValor);
    setSalvandoConfig(false);
    toast.success(novoValor ? "Carrossel ativado na página inicial!" : "Carrossel ocultado da página inicial.");
  };

  const adicionarAoCarrossel = async (produtoId: string) => {
    const preco = parseFloat((precoPromo[produtoId] ?? "").replace(",", "."));
    if (isNaN(preco) || preco <= 0) {
      toast.error("Informe o preço promocional.");
      return;
    }
    setAdicionando(produtoId);
    try {
      const { error } = await supabase.from("carrossel").insert({
        produto_id: produtoId,
        preco_promo: preco,
        visivel: true,
        ordem: itens.length,
      });
      if (error) throw error;
      await carregar();
      setPrecoPromo((p) => ({ ...p, [produtoId]: "" }));
      toast.success("Produto adicionado ao carrossel!");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setAdicionando(null);
    }
  };

  const removerDoCarrossel = async (id: number) => {
    setRemovendo(id);
    try {
      await supabase.from("carrossel").delete().eq("id", id);
      await carregar();
      toast.success("Produto removido do carrossel.");
    } finally {
      setRemovendo(null);
    }
  };

  const toggleVisibilidade = async (id: number, visivel: boolean) => {
    await supabase.from("carrossel").update({ visivel: !visivel }).eq("id", id);
    await carregar();
    toast.success(!visivel ? "Item visível no carrossel." : "Item ocultado do carrossel.");
  };

  const salvarPrecoPromo = async (id: number, novoPreco: string) => {
    const preco = parseFloat(novoPreco.replace(",", "."));
    if (isNaN(preco) || preco <= 0) {
      toast.error("Preço inválido.");
      return;
    }
    setSalvandoPreco(id);
    try {
      await supabase.from("carrossel").update({ preco_promo: preco }).eq("id", id);
      await carregar();
      toast.success("Preço promocional atualizado!");
    } finally {
      setSalvandoPreco(null);
    }
  };

  // Produtos que ainda não estão no carrossel
  const produtosNoCarrossel = new Set(itens.map((i) => i.produto_id));
  const produtosDisponiveis = produtos.filter(
    (p) => !produtosNoCarrossel.has(p.id) &&
    (busca === "" || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="h-6 w-6" />
            <div>
              <h2 className="font-display font-black text-2xl">Carrossel de Promoções</h2>
              <p className="text-primary-foreground/70 text-sm">Gerencie os produtos em destaque na página inicial</p>
            </div>
          </div>
          {/* Toggle visibilidade global */}
          <button
            onClick={toggleCarrosselVisivel}
            disabled={salvandoConfig}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
          >
            {salvandoConfig
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : carrosselVisivel
                ? <ToggleRight className="h-6 w-6 text-green-300" />
                : <ToggleLeft className="h-6 w-6 text-white/50" />
            }
            <span className="text-sm font-bold">
              {carrosselVisivel ? "Visível" : "Oculto"}
            </span>
          </button>
        </div>
        <div className={`mt-3 text-xs px-3 py-1.5 rounded-lg w-fit ${carrosselVisivel ? "bg-green-500/20 text-green-200" : "bg-white/10 text-white/50"}`}>
          {carrosselVisivel
            ? "✅ O carrossel está aparecendo na página inicial"
            : "🚫 O carrossel está oculto na página inicial"
          }
        </div>
      </div>

      {/* Itens no carrossel */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Produtos no carrossel
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">{itens.length}</span>
          </h3>
          <Button size="sm" onClick={() => setMostrarModal(true)} className="bg-primary text-primary-foreground font-bold">
            <Plus className="h-4 w-4 mr-1" /> Adicionar produto
          </Button>
        </div>

        {carregando ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : itens.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Tag className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="font-medium">Nenhum produto no carrossel ainda.</p>
            <p className="text-sm">Clique em "Adicionar produto" para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {itens.map((item) => (
              <div key={item.id} className={`flex items-center gap-3 p-4 transition-colors ${!item.visivel ? "opacity-50" : ""}`}>
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <img src={item.imagem} alt={item.nome} className="h-12 w-12 rounded-lg object-contain bg-white border border-border shrink-0 p-1" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20'%3E🧊%3C/text%3E%3C/svg%3E"; }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{item.nome}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground line-through">R$ {item.preco_original.toFixed(2).replace(".", ",")}</span>
                    {/* Editar preço promo inline */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-primary">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={item.preco_promo.toFixed(2)}
                        onBlur={(e) => {
                          if (e.target.value !== item.preco_promo.toFixed(2)) {
                            salvarPrecoPromo(item.id, e.target.value);
                          }
                        }}
                        className="w-20 text-xs font-bold text-primary bg-primary/5 border border-primary/20 rounded px-1.5 py-0.5 focus:outline-none focus:border-primary"
                      />
                      {salvandoPreco === item.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    </div>
                    {item.preco_original > item.preco_promo && (
                      <span className="bg-green-100 text-green-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        -{Math.round(((item.preco_original - item.preco_promo) / item.preco_original) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleVisibilidade(item.id, item.visivel)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors border ${item.visivel ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" : "bg-muted text-muted-foreground border-border hover:border-primary/50"}`}
                    title={item.visivel ? "Ocultar" : "Mostrar"}
                  >
                    {item.visivel ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => removerDoCarrossel(item.id)}
                    disabled={removendo === item.id}
                    className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 flex items-center justify-center transition-colors"
                    title="Remover do carrossel"
                  >
                    {removendo === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para adicionar produto */}
      <AnimatePresence>
        {mostrarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setMostrarModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-border">
                <h3 className="font-display font-black text-xl text-foreground">Adicionar ao carrossel</h3>
                <p className="text-sm text-muted-foreground mt-1">Escolha o produto e defina o preço promocional</p>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar produto..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {produtosDisponiveis.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    {busca ? "Nenhum produto encontrado." : "Todos os produtos já estão no carrossel."}
                  </p>
                ) : (
                  produtosDisponiveis.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-4 border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <img src={p.imagem} alt={p.nome} className="h-12 w-12 rounded-lg object-contain bg-white border border-border shrink-0 p-1" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20'%3E🧊%3C/text%3E%3C/svg%3E"; }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">Original: R$ {p.preco.toFixed(2).replace(".", ",")}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={precoPromo[p.id] ?? ""}
                            onChange={(e) => setPrecoPromo((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-20 text-sm border-2 border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary bg-background"
                          />
                        </div>
                        <button
                          onClick={() => adicionarAoCarrossel(p.id)}
                          disabled={adicionando === p.id}
                          className="h-8 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1"
                        >
                          {adicionando === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-border">
                <Button variant="outline" onClick={() => setMostrarModal(false)} className="w-full">Fechar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}