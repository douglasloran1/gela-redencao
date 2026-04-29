import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Users, Image, Video, FileText, Trash2, Loader2,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { carregarClientesNotificacao, dispararPromocao } from "@/lib/whatsapp";
import { toast } from "sonner";

type Cliente = { telefone: string; nome: string; aceito_em: string };
type TipoMidia = "nenhuma" | "image" | "video";
type StatusEnvio = "idle" | "enviando" | "concluido" | "erro";

export function PromocoesManager() {
  const [clientes, setClientes]         = useState<Cliente[]>([]);
  const [carregando, setCarregando]     = useState(true);
  const [mensagem, setMensagem]         = useState("");
  const [tipoMidia, setTipoMidia]       = useState<TipoMidia>("nenhuma");
  const [midiaUrl, setMidiaUrl]         = useState("");
  const [status, setStatus]             = useState<StatusEnvio>("idle");
  const [progresso, setProgresso]       = useState({ atual: 0, total: 0 });
  const [resultado, setResultado]       = useState<{ enviados: number; erros: number } | null>(null);
  const [mostrarLista, setMostrarLista] = useState(false);
  const fileRef                         = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarClientesNotificacao().then((data) => {
      setClientes(data);
      setCarregando(false);
    });
  }, []);

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Converte para base64 data URL (Evolution API aceita URL pública)
    // Aqui usamos URL.createObjectURL como preview — para produção ideal é subir no Supabase Storage
    const url = URL.createObjectURL(file);
    setMidiaUrl(url);
    setTipoMidia(file.type.startsWith("video") ? "video" : "image");
    toast.info("Arquivo selecionado. Cole a URL pública da mídia para melhor compatibilidade.");
  };

  const handleEnviar = async () => {
    if (!mensagem.trim()) {
      toast.error("Escreva uma mensagem antes de enviar.");
      return;
    }
    if (clientes.length === 0) {
      toast.error("Nenhum cliente cadastrado para receber notificações.");
      return;
    }
    if ((tipoMidia !== "nenhuma") && !midiaUrl.trim()) {
      toast.error("Informe a URL da mídia ou selecione 'Somente texto'.");
      return;
    }

    setStatus("enviando");
    setProgresso({ atual: 0, total: clientes.length });
    setResultado(null);

    const res = await dispararPromocao({
      mensagem: mensagem.trim(),
      midiaUrl: tipoMidia !== "nenhuma" ? midiaUrl.trim() : undefined,
      midiaType: tipoMidia !== "nenhuma" ? tipoMidia : undefined,
      clientes,
      onProgresso: (atual, total) => setProgresso({ atual, total }),
    });

    setResultado(res);
    setStatus(res.erros === clientes.length ? "erro" : "concluido");

    if (res.enviados > 0) toast.success(`${res.enviados} mensagens enviadas com sucesso!`);
    if (res.erros > 0) toast.warning(`${res.erros} envios falharam.`);
  };

  const resetar = () => {
    setStatus("idle");
    setMensagem("");
    setMidiaUrl("");
    setTipoMidia("nenhuma");
    setResultado(null);
    setProgresso({ atual: 0, total: 0 });
  };

  const pct = progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-center gap-3 mb-1">
          <Megaphone className="h-6 w-6" />
          <h2 className="font-display font-black text-2xl">Promoções</h2>
        </div>
        <p className="text-primary-foreground/70 text-sm">
          Envie mensagens para todos os clientes que aceitaram receber novidades.
        </p>
      </div>

      {/* Clientes cadastrados */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setMostrarLista((v) => !v)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-bold text-foreground">Clientes cadastrados</p>
              <p className="text-sm text-muted-foreground">
                {carregando ? "Carregando..." : `${clientes.length} cliente${clientes.length !== 1 ? "s" : ""} vão receber`}
              </p>
            </div>
          </div>
          {mostrarLista ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {mostrarLista && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border max-h-64 overflow-y-auto">
                {carregando ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : clientes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Nenhum cliente cadastrado ainda.</p>
                ) : (
                  clientes.map((c) => (
                    <div key={c.telefone} className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <div>
                        <p className="font-medium text-sm text-foreground">{c.nome || "—"}</p>
                        <p className="text-xs text-muted-foreground">{c.telefone}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.aceito_em).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Formulário de disparo */}
      {status === "idle" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" /> Compor mensagem
          </h3>

          {/* Tipo de mídia */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Tipo de conteúdo</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "nenhuma", label: "Só texto",  Icon: FileText },
                { id: "image",   label: "Foto",      Icon: Image   },
                { id: "video",   label: "Vídeo",     Icon: Video   },
              ] as { id: TipoMidia; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => { setTipoMidia(id); setMidiaUrl(""); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    tipoMidia === id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* URL da mídia */}
          {tipoMidia !== "nenhuma" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                URL pública da {tipoMidia === "image" ? "foto" : "vídeo"}
              </label>
              <input
                type="url"
                value={midiaUrl}
                onChange={(e) => setMidiaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Cole a URL pública da mídia (ex: link do Google Drive, Imgur, etc.)
              </p>
            </div>
          )}

          {/* Mensagem */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Mensagem *
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder={`Ex: 🔥 *Promoção especial!* Hoje temos cerveja Heineken 600ml por apenas R$ 8,00. Aproveite! 🧊`}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Use *asteriscos* para negrito. A mensagem será enviada para {clientes.length} clientes.
            </p>
          </div>

          {/* Preview */}
          {mensagem.trim() && (
            <div className="bg-muted/40 rounded-xl p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Preview</p>
              <div className="bg-[#dcf8c6] text-gray-800 rounded-xl rounded-tr-none px-4 py-3 text-sm max-w-xs ml-auto shadow-sm whitespace-pre-wrap">
                {tipoMidia !== "nenhuma" && midiaUrl && (
                  <div className="bg-black/10 rounded-lg p-3 mb-2 text-center text-xs text-gray-600">
                    {tipoMidia === "image" ? "🖼️ Foto" : "🎥 Vídeo"}
                  </div>
                )}
                {mensagem}
              </div>
            </div>
          )}

          <Button
            onClick={handleEnviar}
            disabled={!mensagem.trim() || clientes.length === 0}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold h-12 text-base"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar para {clientes.length} clientes
          </Button>
        </div>
      )}

      {/* Enviando */}
      {status === "enviando" && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <div>
            <p className="font-bold text-foreground">Enviando mensagens...</p>
            <p className="text-sm text-muted-foreground">{progresso.atual} de {progresso.total} enviadas</p>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <p className="text-sm font-bold text-primary">{pct}%</p>
          <p className="text-xs text-muted-foreground">Não feche esta página durante o envio.</p>
        </div>
      )}

      {/* Resultado */}
      {(status === "concluido" || status === "erro") && resultado && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          {resultado.enviados > 0
            ? <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            : <XCircle className="h-12 w-12 text-destructive mx-auto" />
          }
          <div>
            <p className="font-display font-black text-xl text-foreground">
              {resultado.enviados > 0 ? "Envio concluído!" : "Falha no envio"}
            </p>
            <div className="flex justify-center gap-6 mt-3">
              <div className="text-center">
                <p className="text-2xl font-black text-green-500">{resultado.enviados}</p>
                <p className="text-xs text-muted-foreground">Enviadas</p>
              </div>
              {resultado.erros > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-black text-destructive">{resultado.erros}</p>
                  <p className="text-xs text-muted-foreground">Falhas</p>
                </div>
              )}
            </div>
          </div>
          <Button onClick={resetar} variant="outline" className="font-bold">
            <Trash2 className="h-4 w-4 mr-2" /> Nova promoção
          </Button>
        </div>
      )}
    </div>
  );
}