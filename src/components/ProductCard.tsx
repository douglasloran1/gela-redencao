import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Produto } from "@/store/produtos";
import { useCarrinho } from "@/store/carrinho";
import { Button } from "@/components/ui/button";

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48'%3E🧊%3C/text%3E%3C/svg%3E";

// Converte URL do Supabase Storage para usar o endpoint de render (sem CORS)
function fixImageUrl(url: string): string {
  if (!url) return "";
  // Substitui /object/public/ por /render/image/public/ para evitar CORS
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    return url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") + "?width=400&quality=80";
  }
  return url;
}

export const ProductCard = ({ produto, index }: { produto: Produto; index: number }) => {
  const { itens, adicionar, alterarQtd } = useCarrinho();
  const item = itens.find((i) => i.id === produto.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-smooth border border-border/50 flex flex-col"
    >
      <div className="relative bg-gradient-frost aspect-square overflow-hidden">
        {produto.badge && (
          <span className="absolute top-3 left-3 z-10 bg-secondary text-secondary-foreground text-[10px] font-black px-2.5 py-1 rounded-full shadow-gold">
            {produto.badge}
          </span>
        )}
        <img
          src={fixImageUrl(produto.imagem)}
          alt={produto.nome}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-bounce"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[11px] uppercase tracking-wider text-primary font-bold mb-1">{produto.categoria}</p>
        <h3 className="font-display font-bold text-foreground leading-tight mb-1">{produto.nome}</h3>
        <p className="text-xs text-muted-foreground mb-3 flex-1">{produto.descricao}</p>

        <div className="flex items-end justify-between gap-2 mt-auto min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground leading-none">a partir de</p>
            <p className="font-display text-xl sm:text-2xl font-black text-primary leading-tight">
              R$ {produto.preco.toFixed(2).replace(".", ",")}
            </p>
          </div>

          {!item ? (
            <Button
              onClick={() => adicionar(produto)}
              size="sm"
              className="bg-gradient-gold text-secondary-foreground hover:opacity-90 font-bold shadow-gold border-0 shrink-0 text-xs px-2 sm:px-3"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Adicionar</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 bg-primary text-primary-foreground rounded-full p-1 shadow-soft shrink-0">
              <button
                onClick={() => alterarQtd(produto.id, item.quantidade - 1)}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-smooth flex items-center justify-center"
              >
                <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
              <span className="font-bold w-4 sm:w-5 text-center text-xs sm:text-sm">{item.quantidade}</span>
              <button
                onClick={() => alterarQtd(produto.id, item.quantidade + 1)}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary-glow transition-smooth flex items-center justify-center"
              >
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};