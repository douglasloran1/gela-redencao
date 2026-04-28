import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, Truck, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners } from "@/store/banners";
import bannerDefault from "@/assets/banner-hero.jpg";

export const Banner = () => {
  const { banners, carregar } = useBanners();
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    carregar();
  }, []);

  const lista = banners.filter((b) => b.ativo && b.imagem);
  const usarPadrao = lista.length === 0;

  useEffect(() => {
    setAtual(0);
  }, [lista.length]);

  useEffect(() => {
    if (usarPadrao || lista.length <= 1) return;
    const id = setInterval(() => {
      setAtual((prev) => (prev + 1) % lista.length);
    }, 5000);
    return () => clearInterval(id);
  }, [lista.length, usarPadrao]);

  const anterior = () => setAtual((p) => (p - 1 + lista.length) % lista.length);
  const proximo  = () => setAtual((p) => (p + 1) % lista.length);

  const bannerAtual = usarPadrao ? null : lista[Math.min(atual, lista.length - 1)];
  const imagemAtual = bannerAtual ? bannerAtual.imagem : bannerDefault;

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[320px] sm:h-[420px] md:h-[520px]">

        {/* Imagem de fundo com transição */}
        <AnimatePresence mode="wait">
          <motion.div
            key={imagemAtual}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={imagemAtual}
              alt="Banner"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = bannerDefault as unknown as string;
              }}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-banner" />

        {/* Conteúdo */}
        <div className="container relative h-full flex items-center px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={atual}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl w-full"
            >
              <span className="inline-block bg-secondary text-secondary-foreground font-bold px-3 py-1 rounded-full text-xs sm:text-sm mb-3 shadow-gold">
                🔥 PROMOÇÃO DA SEMANA
              </span>

              {bannerAtual?.titulo ? (
                <h2 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-primary-foreground leading-[0.95] mb-3">
                  {bannerAtual.titulo}
                </h2>
              ) : (
                <h2 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-primary-foreground leading-[0.95] mb-3">
                  Sua bebida <br />
                  <span className="text-secondary drop-shadow-lg">SEMPRE GELADA</span>
                  <br /> na sua porta
                </h2>
              )}

              {bannerAtual?.subtitulo ? (
                <p className="text-primary-foreground/90 text-sm sm:text-lg md:text-xl mb-4 max-w-lg">
                  {bannerAtual.subtitulo}
                </p>
              ) : (
                <p className="text-primary-foreground/90 text-sm sm:text-lg md:text-xl mb-4 max-w-lg">
                  Cervejas, refrigerantes, gelo e muito mais. Entrega rápida em toda a região da Redenção.
                </p>
              )}

              <a
                href="#produtos"
                className="inline-block bg-secondary hover:bg-secondary-glow text-secondary-foreground font-bold px-5 py-3 sm:px-7 sm:py-4 rounded-xl shadow-gold transition-bounce hover:scale-105 text-sm sm:text-base"
              >
                Ver Produtos →
              </a>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controles de navegação */}
        {!usarPadrao && lista.length > 1 && (
          <>
            <button
              onClick={anterior}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 sm:p-2.5 backdrop-blur-sm transition-all z-10"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={proximo}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 sm:p-2.5 backdrop-blur-sm transition-all z-10"
              aria-label="Próximo banner"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Bolinhas */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {lista.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setAtual(i)}
                  className={`rounded-full transition-all ${
                    i === atual ? "bg-secondary w-6 h-2.5" : "bg-white/50 w-2.5 h-2.5 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Barra de features — melhorada para mobile */}
      <div className="bg-primary text-primary-foreground">
        <div className="container grid grid-cols-3 gap-2 py-4 sm:py-5">
          {[
            { icon: Snowflake, txt: "Sempre Gelado" },
            { icon: Truck,     txt: "Entrega Rápida" },
            { icon: Clock,     txt: "Aberto até 22h" }, // ✅ corrigido de 23h para 22h
          ].map((f) => (
            <div key={f.txt} className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center">
              <f.icon className="h-4 w-4 sm:h-5 sm:w-5 text-secondary shrink-0" />
              <span className="text-[11px] sm:text-sm md:text-base font-semibold leading-tight">{f.txt}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
