import logo from "@/assets/logo-gela.png";
import { MapPin, Phone, Clock } from "lucide-react";

export const Footer = () => (
  <footer className="bg-gradient-hero text-primary-foreground mt-16">
    <div className="container py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-4">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <img src={logo} alt="Logo Gela Redenção" className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-lg" />
          <h3 className="font-display font-black text-secondary text-lg sm:text-xl">GELA REDENÇÃO</h3>
        </div>
        <p className="text-sm text-primary-foreground/80">
          Seu depósito de bebidas com entrega rápida e o melhor preço da região.
        </p>
      </div>

      <div>
        <h4 className="font-display font-bold text-secondary mb-3">Contato</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-secondary shrink-0" />
            <a href="tel:+5584994021654" className="hover:text-secondary transition-colors font-medium">
              (84) 99402-1654
            </a>
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-secondary shrink-0" />
            Bairro Redenção
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-secondary shrink-0" />
            09h às 22h {/* ✅ corrigido de 23h para 22h */}
          </li>
        </ul>
      </div>

      <div>
        <h4 className="font-display font-bold text-secondary mb-3">Pedidos</h4>
        <p className="text-sm text-primary-foreground/80">
          Faça seu pedido pelo site e receba a confirmação direto no WhatsApp.
        </p>
      </div>
    </div>
    <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60 px-4">
      © {new Date().getFullYear()} Gela Redenção. Todos os direitos reservados.
    </div>
  </footer>
);
