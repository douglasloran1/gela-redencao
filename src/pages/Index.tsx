import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { useProdutos } from "@/store/produtos";
import { cn } from "@/lib/utils";
import { Loader2, Search, X } from "lucide-react";
import { InstalarApp } from "@/components/InstalarApp";

const Index = () => {
  const { produtos, categorias, carregando, erro, carregar } = useProdutos();
  const [cat, setCat] = useState("Todos");
  const [busca, setBusca] = useState("");

  useEffect(() => { carregar(); }, []);

  const lista = produtos
    .filter((p) => cat === "Todos" || p.categoria === cat)
    .filter((p) =>
      busca.trim() === "" ||
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Banner />
        <section id="produtos" className="container py-8 sm:py-12 px-4">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-secondary font-bold text-xs sm:text-sm tracking-widest uppercase mb-2">Cardápio</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-2 sm:mb-3">
              Nossos Produtos
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Tudo geladinho, prontinho pra entrega. Escolha seus favoritos e finalize o pedido.
            </p>
            <div className="flex justify-center mt-4">
              <InstalarApp />
            </div>
          </div>

          {/* Barra de busca */}
          {!carregando && !erro && (
            <div className="relative max-w-md mx-auto mb-5 sm:mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full pl-11 pr-10 py-3 rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm font-medium shadow-sm"
              />
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Filtros de categoria */}
          {!carregando && !erro && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 -mx-4 px-4 scrollbar-hide">
              {categorias.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cn(
                    "px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-bounce border-2",
                    cat === c
                      ? "bg-primary text-primary-foreground border-primary shadow-glow scale-105"
                      : "bg-card text-foreground border-border hover:border-primary"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Carregando */}
          {carregando && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-semibold">Carregando produtos...</p>
            </div>
          )}

          {/* Erro */}
          {erro && !carregando && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="font-semibold text-destructive mb-2">Erro ao carregar produtos</p>
              <p className="text-sm text-muted-foreground mb-4">{erro}</p>
              <button onClick={() => carregar()} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold text-sm">
                Tentar novamente
              </button>
            </div>
          )}

          {/* Grid de produtos — 2 colunas no mobile, 3 no tablet, 4 no desktop */}
          {!carregando && !erro && lista.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {lista.map((produto, index) => (
                <ProductCard key={produto.id} produto={produto} index={index} />
              ))}
            </div>
          )}

          {/* Sem resultados */}
          {!carregando && !erro && lista.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold text-foreground mb-1">Nenhum produto encontrado</p>
              <p className="text-sm text-muted-foreground">Tente buscar por outro termo ou categoria.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;