import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, Home, Receipt, Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { useCarrinho } from "@/store/carrinho";
import { Button } from "@/components/ui/button";
import { enviarConfirmacaoPedido } from "@/lib/whatsapp";

// Número da loja para notificação interna (fallback wa.me)
const WHATSAPP_LOJA = "5584996836048";

function salvarPedido(pedido: object) {
  const existentes = JSON.parse(localStorage.getItem("gela_pedidos") || "[]");
  existentes.push(pedido);
  localStorage.setItem("gela_pedidos", JSON.stringify(existentes));
}

type StatusEnvio = "enviando" | "enviado" | "erro" | "sem_api";

const Finalizado = () => {
  const navigate = useNavigate();
  const { itens, dadosCheckout, total, limpar } = useCarrinho();
  const jaProcessou = useRef(false);
  const [statusEnvio, setStatusEnvio] = useState<StatusEnvio>("enviando");
  const [erroMsg, setErroMsg] = useState("");

  useEffect(() => {
    if (!dadosCheckout || itens.length === 0) {
      navigate("/");
    }
  }, [dadosCheckout, itens.length, navigate]);

  if (!dadosCheckout || itens.length === 0) return null;

  const subtotal = total();
  const taxaEntrega = 5;
  const totalFinal = subtotal + taxaEntrega;
  const numeroPedido = `#${Math.floor(Math.random() * 90000 + 10000)}`;

  const formaPagNome: Record<string, string> = {
    pix: "PIX ⚡",
    dinheiro: dadosCheckout.troco
      ? `Dinheiro 💵 (troco p/ R$ ${dadosCheckout.troco})`
      : "Dinheiro 💵",
    cartao: "Cartão 💳",
  };
  const pagamentoLabel = formaPagNome[dadosCheckout.formaPagamento] ?? dadosCheckout.formaPagamento;

  // Fallback wa.me caso API não esteja configurada (loja envia manualmente)
  const telefoneCliente = dadosCheckout.telefone.replace(/\D/g, "");
  const telFormatado = telefoneCliente.startsWith("55") ? telefoneCliente : `55${telefoneCliente}`;
  const msgFallback = encodeURIComponent(
    `🧊 Olá, ${dadosCheckout.nome}! Seu pedido ${numeroPedido} foi confirmado! ` +
    `Entrega em 30–45min. Total: R$ ${totalFinal.toFixed(2).replace(".", ",")}. — Gela Redenção`
  );
  const urlFallback = `https://wa.me/${telFormatado}?text=${msgFallback}`;

  useEffect(() => {
    if (jaProcessou.current || !dadosCheckout || itens.length === 0) return;
    jaProcessou.current = true;

    const pedido = {
      id: numeroPedido,
      data: new Date().toISOString(),
      cliente: dadosCheckout.nome,
      telefone: dadosCheckout.telefone,
      endereco: `${dadosCheckout.endereco}, ${dadosCheckout.numero} – ${dadosCheckout.bairro}`,
      referencia: dadosCheckout.referencia || "",
      formaPagamento: dadosCheckout.formaPagamento,
      troco: dadosCheckout.troco || "",
      itens: itens.map((i) => ({
        id: i.id,
        nome: i.nome,
        preco: i.preco,
        quantidade: i.quantidade,
        categoria: i.categoria,
      })),
      subtotal,
      taxaEntrega,
      total: totalFinal,
      status: "pendente",
    };
    salvarPedido(pedido);

    // Envia mensagem automaticamente via Evolution API
    enviarConfirmacaoPedido({
      telefoneCliente: dadosCheckout.telefone,
      nomeCliente: dadosCheckout.nome,
      numeroPedido,
      itens: itens.map((i) => ({ nome: i.nome, quantidade: i.quantidade, preco: i.preco })),
      endereco: dadosCheckout.endereco,
      bairro: dadosCheckout.bairro,
      numero: dadosCheckout.numero,
      referencia: dadosCheckout.referencia,
      formaPagamento: dadosCheckout.formaPagamento,
      troco: dadosCheckout.troco,
      subtotal,
      taxaEntrega,
      total: totalFinal,
    }).then((resultado) => {
      if (resultado.ok) {
        setStatusEnvio("enviado");
      } else if (resultado.erro === "API não configurada") {
        setStatusEnvio("sem_api");
      } else {
        setStatusEnvio("erro");
        setErroMsg(resultado.erro ?? "Erro desconhecido");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVoltar = () => {
    limpar();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-10 max-w-2xl">
        {/* Ícone de sucesso */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mx-auto bg-gradient-gold rounded-full h-28 w-28 flex items-center justify-center shadow-gold mb-6"
        >
          <CheckCircle2 className="h-16 w-16 text-secondary-foreground" strokeWidth={2.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-4xl md:text-5xl font-black text-primary mb-2">
            Pedido Confirmado!
          </h2>
          <p className="text-muted-foreground text-lg">
            Pedido <span className="font-bold text-primary">{numeroPedido}</span>
          </p>
        </motion.div>

        {/* Banner status do envio WhatsApp */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className={`rounded-2xl p-6 mb-6 relative overflow-hidden ${
            statusEnvio === "enviado"
              ? "bg-green-600"
              : statusEnvio === "enviando"
              ? "bg-gradient-hero"
              : statusEnvio === "sem_api"
              ? "bg-amber-600"
              : "bg-red-600"
          } text-white`}
        >
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-xl shrink-0">
              {statusEnvio === "enviando" ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : statusEnvio === "enviado" ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : statusEnvio === "sem_api" ? (
                <MessageCircle className="h-7 w-7" />
              ) : (
                <AlertCircle className="h-7 w-7" />
              )}
            </div>
            <div className="flex-1">
              {statusEnvio === "enviando" && (
                <>
                  <h3 className="font-display font-black text-xl mb-1">Enviando confirmação...</h3>
                  <p className="text-white/90 text-sm">
                    Estamos enviando a mensagem de confirmação para{" "}
                    <strong>{dadosCheckout.telefone}</strong> agora.
                  </p>
                </>
              )}
              {statusEnvio === "enviado" && (
                <>
                  <h3 className="font-display font-black text-xl mb-1">
                    Mensagem enviada com sucesso! 📲
                  </h3>
                  <p className="text-white/90 text-sm">
                    A confirmação do pedido foi enviada automaticamente para{" "}
                    <strong>{dadosCheckout.telefone}</strong> pelo WhatsApp da loja.
                  </p>
                </>
              )}
              {statusEnvio === "sem_api" && (
                <>
                  <h3 className="font-display font-black text-xl mb-1">
                    Configure o WhatsApp automático
                  </h3>
                  <p className="text-white/90 text-sm mb-3">
                    A API ainda não foi configurada. Use o botão abaixo para enviar manualmente
                    pelo WhatsApp da loja para o cliente.
                  </p>
                  <button
                    onClick={() => window.open(urlFallback, "_blank")}
                    className="bg-white text-amber-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-amber-50 transition-colors"
                  >
                    Abrir WhatsApp para enviar →
                  </button>
                </>
              )}
              {statusEnvio === "erro" && (
                <>
                  <h3 className="font-display font-black text-xl mb-1">
                    Falha no envio automático
                  </h3>
                  <p className="text-white/90 text-sm mb-2">
                    Não foi possível enviar via API. Use o botão abaixo para enviar manualmente.
                  </p>
                  <p className="text-white/60 text-xs mb-3">Erro: {erroMsg}</p>
                  <button
                    onClick={() => window.open(urlFallback, "_blank")}
                    className="bg-white text-red-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-50 transition-colors"
                  >
                    Enviar manualmente →
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Resumo do pedido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-2xl shadow-card border border-border overflow-hidden mb-6"
        >
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold text-lg text-primary">Resumo do Pedido</h3>
          </div>

          <div className="p-5 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Cliente:</span> <strong>{dadosCheckout.nome}</strong></p>
            <p><span className="text-muted-foreground">Endereço:</span> {dadosCheckout.endereco}, {dadosCheckout.numero} — {dadosCheckout.bairro}</p>
            {dadosCheckout.referencia && (
              <p><span className="text-muted-foreground">Referência:</span> {dadosCheckout.referencia}</p>
            )}
            <p><span className="text-muted-foreground">Pagamento:</span> <strong>{pagamentoLabel}</strong></p>
          </div>

          <div className="border-t border-border p-5 bg-muted/30 space-y-2">
            {itens.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span>{i.quantidade}x {i.nome}</span>
                <span className="font-semibold">R$ {(i.preco * i.quantidade).toFixed(2).replace(".", ",")}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-border text-muted-foreground">
              <span>Taxa de entrega</span>
              <span>R$ 5,00</span>
            </div>
            <div className="flex justify-between text-xl font-display font-black text-primary pt-2 border-t border-border">
              <span>Total</span>
              <span>R$ {totalFinal.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={handleVoltar}
            size="lg"
            className="flex-1 bg-gradient-gold text-secondary-foreground border-0 font-bold shadow-gold h-12"
          >
            <Home className="h-5 w-5" /> Voltar à loja
          </Button>
          {(statusEnvio === "enviado") && (
            <Button
              onClick={() => window.open(urlFallback, "_blank")}
              size="lg"
              variant="outline"
              className="flex-1 border-primary text-primary font-bold h-12"
            >
              <MessageCircle className="h-5 w-5" /> Reenviar mensagem
            </Button>
          )}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Tempo estimado de entrega: <strong>30–45 minutos</strong> 🛵
        </p>
      </div>
    </div>
  );
};

export default Finalizado;
