import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Monitor, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstalarApp() {
  const [promptEvento, setPromptEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalado, setInstalado]       = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [isIOS, setIsIOS]               = useState(false);
  const [isMobile, setIsMobile]         = useState(false);
  const [instalando, setInstalando]     = useState(false);

  useEffect(() => {
    // Detecta iOS (Safari não dispara beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);
    setIsMobile(mobile);

    // Verifica se já está instalado como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalado(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvento(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalado(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Se já instalado, não mostra nada
  if (instalado) return null;

  const handleInstalar = async () => {
    if (isIOS) {
      setMostrarModal(true);
      return;
    }

    if (promptEvento) {
      setInstalando(true);
      await promptEvento.prompt();
      const { outcome } = await promptEvento.userChoice;
      if (outcome === "accepted") setInstalado(true);
      setInstalando(false);
      setPromptEvento(null);
    } else {
      // Desktop Chrome sem prompt ainda — mostra instrução
      setMostrarModal(true);
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        onClick={handleInstalar}
        className="group flex items-center gap-2.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all font-bold text-sm border border-primary/20"
      >
        <div className="bg-white/20 rounded-lg p-1 group-hover:bg-white/30 transition-colors">
          {isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
        </div>
        <span>Instalar App Gela</span>
        <Download className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
      </motion.button>

      {/* Modal de instrução iOS ou Desktop sem prompt */}
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
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-primary-foreground flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧊</span>
                  <div>
                    <p className="font-display font-black text-lg leading-tight">Gela Redenção</p>
                    <p className="text-primary-foreground/70 text-xs">Instalar no seu dispositivo</p>
                  </div>
                </div>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {isIOS ? (
                  <>
                    <p className="font-semibold text-foreground text-center">Instalar no iPhone / iPad</p>
                    <div className="space-y-3">
                      {[
                        { num: "1", texto: "Toque no botão compartilhar", emoji: "⬆️" },
                        { num: "2", texto: 'Role e toque em "Adicionar à Tela de Início"', emoji: "➕" },
                        { num: "3", texto: 'Toque em "Adicionar" no canto superior direito', emoji: "✅" },
                      ].map((p) => (
                        <div key={p.num} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                          <span className="text-xl">{p.emoji}</span>
                          <p className="text-sm text-foreground">{p.texto}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground text-center">Instalar no computador</p>
                    <div className="space-y-3">
                      {[
                        { texto: "Clique no ícone ⊕ na barra de endereço do navegador", emoji: "🖥️" },
                        { texto: 'Ou abra o menu (⋮) e clique em "Instalar Gela Redenção"', emoji: "📌" },
                        { texto: 'Clique em "Instalar" na janela que aparecer', emoji: "✅" },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                          <span className="text-xl">{p.emoji}</span>
                          <p className="text-sm text-foreground">{p.texto}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Funciona como um app nativo, acesso rápido e sem precisar do navegador.
                  </p>
                </div>

                <button
                  onClick={() => setMostrarModal(false)}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                >
                  Entendi!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}