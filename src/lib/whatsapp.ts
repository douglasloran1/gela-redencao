// ─────────────────────────────────────────────────────────────────────────────
// Integração com Evolution API (WhatsApp)
// Docs: https://doc.evolution-api.com
//
// Configure as variáveis abaixo com os valores do seu Railway:
// ─────────────────────────────────────────────────────────────────────────────

const EVOLUTION_URL = import.meta.env.VITE_EVOLUTION_URL ?? "";
// Ex: https://sua-instancia.up.railway.app

const EVOLUTION_KEY = import.meta.env.VITE_EVOLUTION_KEY ?? "";
// A chave global (AUTHENTICATION_API_KEY) definida no Railway

const EVOLUTION_INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE ?? "gela";
// Nome da instância que você criou na Evolution API

// ─────────────────────────────────────────────────────────────────────────────

function formatarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  // Garante o código do Brasil (55) + DDD + número
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  return digits;
}

export async function enviarConfirmacaoPedido(params: {
  telefoneCliente: string;
  nomeCliente: string;
  numeroPedido: string;
  itens: { nome: string; quantidade: number; preco: number }[];
  endereco: string;
  bairro: string;
  numero: string;
  referencia?: string;
  formaPagamento: string;
  troco?: string;
  subtotal: number;
  taxaEntrega: number;
  total: number;
}): Promise<{ ok: boolean; erro?: string }> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    console.warn("[WhatsApp] VITE_EVOLUTION_URL ou VITE_EVOLUTION_KEY não configurados.");
    return { ok: false, erro: "API não configurada" };
  }

  const pagamentoLabel: Record<string, string> = {
    pix: "PIX ⚡",
    dinheiro: params.troco
      ? `Dinheiro 💵 (troco para R$ ${params.troco})`
      : "Dinheiro 💵",
    cartao: "Cartão 💳",
  };

  const linhasItens = params.itens
    .map(
      (i) =>
        `  • ${i.quantidade}x ${i.nome} — R$ ${(i.preco * i.quantidade)
          .toFixed(2)
          .replace(".", ",")}`
    )
    .join("\n");

  const mensagem = [
    `🧊 *Olá, ${params.nomeCliente}! Seu pedido foi confirmado!*`,
    ``,
    `📋 *Pedido ${params.numeroPedido} – Gela Redenção*`,
    ``,
    `📦 *Itens pedidos:*`,
    linhasItens,
    ``,
    `🚚 *Endereço de entrega:*`,
    `${params.endereco}, ${params.numero} – ${params.bairro}`,
    params.referencia ? `📍 Referência: ${params.referencia}` : null,
    ``,
    `💳 *Pagamento:* ${pagamentoLabel[params.formaPagamento] ?? params.formaPagamento}`,
    ``,
    `💰 Subtotal: R$ ${params.subtotal.toFixed(2).replace(".", ",")}`,
    `🛵 Taxa de entrega: R$ ${params.taxaEntrega.toFixed(2).replace(".", ",")}`,
    `💵 *TOTAL: R$ ${params.total.toFixed(2).replace(".", ",")}*`,
    ``,
    `⏱ *Tempo estimado: 30–45 minutos*`,
    ``,
    `Qualquer dúvida é só responder aqui. Obrigado pela preferência! 🙏`,
    `— Equipe Gela Redenção 🧊`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    const telefone = formatarTelefone(params.telefoneCliente);

    const response = await fetch(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_KEY,
        },
body: JSON.stringify({
  number: telefone,
  text: mensagem,
  options: {
    delay: 1000,
    presence: "composing",
  },
}),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("[WhatsApp] Erro na API:", response.status, body);
      return { ok: false, erro: `Erro ${response.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    console.error("[WhatsApp] Falha na requisição:", err);
    return { ok: false, erro: String(err) };
  }
}
