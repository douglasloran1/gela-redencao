import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Snowflake, LayoutDashboard } from "lucide-react";
import logo from "@/assets/logo-gela.png";
import { useCarrinho } from "@/store/carrinho";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  const qtd = useCarrinho((s) => s.qtdTotal());
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-gradient-hero shadow-glow">
      <div className="container flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3 group">
          {/* Logo PNG com fundo transparente — sem círculo branco */}
          <img
            src={logo}
            alt="Logo Gela Redenção"
            className="h-14 w-14 object-contain drop-shadow-lg group-hover:scale-105 transition-bounce"
          />
          <div className="hidden sm:block">
            <h1 className="text-xl md:text-2xl font-display font-black text-secondary leading-none">
              GELA <span className="text-primary-foreground">REDENÇÃO</span>
            </h1>
            <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
              <Snowflake className="h-3 w-3" /> Sempre gelado, sempre na hora
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {location.pathname === "/" && (
            <>
              <Link
                to="/painel"
                className="text-primary-foreground/70 hover:text-secondary transition-colors p-2 rounded-lg hover:bg-primary/30"
                title="Painel Admin"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>
              <Link
                to="/checkout"
                className="relative bg-secondary hover:bg-secondary-glow text-secondary-foreground font-bold px-5 py-3 rounded-xl shadow-gold transition-bounce hover:scale-105 flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">Carrinho</span>
                {qtd > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground border-2 border-background animate-bounce-in">
                    {qtd}
                  </Badge>
                )}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
