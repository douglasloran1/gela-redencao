import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCarrinho } from "@/store/carrinho";

type ItemCarrossel = {
  id: number;
  produto_id: string;
  preco_promo: number;
  nome: string;
  imagem: string;
  categoria: string;
  preco_original: number;
};

export function CarrosselPromos() {
  const [itens, setItens]         = useState<ItemCarrossel[]>([]);
  const [visivel, setVisivel]     = useState(false);
  const [atual, setAtual]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null);
  const { adicionar }             = useCarrinho();

  useEffect(() => {
    const carregar = async () => {
      // Verifica visibilidade global
      const { data: config } = await supabase
        .from("configuracoes")
        .select("valor")
        .eq("chave", "carrossel_visivel")
        .single();

      if (config?.valor !== "true") {
        setLoading(false);
        return;
      }

      // Carrega itens do carrossel com dados do produto
      const { data } = await supabase
        .from("carrossel")
        .select(`
          id,
          produto_id,
          preco_promo,
          produtos (
            nome,
            imagem,
            categoria,
            preco
          )
        `)
        .eq("visivel", true)
        .order("ordem", { ascending: true });

      if (data && data.length > 0) {
        const lista = data.map((i: any) => ({
          id: i.id,
          produto_id: i.produto_id,
          preco_promo: i.preco_promo,
          nome: i.produtos?.nome ?? "",
          imagem: i.produtos?.imagem ?? "",
          categoria: i.produtos?.categoria ?? "",
          preco_original: i.produtos?.preco ?? 0,
        }));
        setItens(lista);
        setVisivel(true);
      }
      setLoading(false);
    };

    carregar();
  }, []);

  // Auto-play
  useEffect(() => {
    if (itens.length <= 1) return;
    timerRef.current = setInterval(() => {
      setAtual((a) => (a + 1) % itens.length);
    }, 3500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [itens.length]);

  const ir = (idx: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAtual((idx + itens.length) % itens.length);
    timerRef.current = setInterval(() => {
      setAtual((a) => (a + 1) % itens.length);
    }, 3500);
  };

  if (loading || !visivel || itens.length === 0) return null;

  const item = itens[atual];
  const desconto = Math.round(((item.preco_original - item.preco_promo) / item.preco_original) * 100);

  return (
    <section className="container px-4 pt-4 pb-2">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-4 w-4 text-primary" />
        <p className="font-display font-black text-primary text-sm tracking-wide uppercase">
          Promoções da Semana
        </p>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={atual}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="flex items-center gap-4 p-4 sm:p-5"
          >
            {/* Imagem */}
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-border">
              <img
                src={item.imagem}
                alt={item.nome}
                className="h-full w-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32'%3E🧊%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {item.categoria}
              </p>
              <p className="font-display font-black text-foreground text-sm sm:text-base leading-tight line-clamp-2 mb-2">
                {item.nome}
              </p>
              <div className="flex items-end gap-2 flex-wrap">
                <p className="font-display font-black text-primary text-2xl sm:text-3xl leading-none">
                  R$ {item.preco_promo.toFixed(2).replace(".", ",")}
                </p>
                {desconto > 0 && (
                  <>
                    <p className="text-sm text-muted-foreground line-through leading-none mb-0.5">
                      R$ {item.preco_original.toFixed(2).replace(".", ",")}
                    </p>
                    <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-0.5 rounded-full">
                      -{desconto}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Botão adicionar */}
            <button
              onClick={() => adicionar({
                id: item.produto_id,
                nome: item.nome,
                imagem: item.imagem,
                categoria: item.categoria,
                preco: item.preco_promo,
                descricao: "",
              })}
              className="shrink-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl shadow-md hover:opacity-90 transition-all"
            >
              + Adicionar
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Controles de navegação */}
        {itens.length > 1 && (
          <>
            <button
              onClick={() => ir(atual - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full h-7 w-7 flex items-center justify-center shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => ir(atual + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full h-7 w-7 flex items-center justify-center shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 pb-3 pt-1">
              {itens.map((_, i) => (
                <button
                  key={i}
                  onClick={() => ir(i)}
                  className={`rounded-full transition-all ${
                    i === atual
                      ? "w-4 h-1.5 bg-primary"
                      : "w-1.5 h-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}