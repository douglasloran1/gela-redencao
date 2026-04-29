// Integração com Evolution API (WhatsApp)
// Docs: https://doc.evolution-api.com

import { supabase } from "@/lib/supabase";

const EVOLUTION_URL      = import.meta.env.VITE_EVOLUTION_URL ?? "";
const EVOLUTION_KEY      = import.meta.env.VITE_EVOLUTION_KEY ?? "";
const EVOLUTION_INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE ?? "gela";

export function formatarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  return digits;
}

async function enviarTexto(telefone: string, mensagem: string): Promise<{ ok: boolean; erro?: string }> {
  try {
    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
      body: JSON.stringify({
        number: formatarTelefone(telefone),
        text: mensagem,
        options: { delay: 1000, presence: "composing" },
      }),
    });
    if (!res.ok) return { ok: false, erro: `Erro ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, erro: String(err) };
  }
}

async function enviarMidia(
  telefone: string,
  tipo: "image" | "video",
  url: string,
  caption: string
): Promise<{ ok: boolean; erro?: string }> {
  try {
    const endpoint = tipo === "image" ? "sendImage" : "sendVideo";
    const res = await fetch(`${EVOLUTION_URL}/message/${endpoint}/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
      body: JSON.stringify({
        number: formatarTelefone(telefone),
        [tipo]: url,
        caption,
        options: { delay: 1000 },
      }),
    });
    if (!res.ok) return { ok: false, erro: `Erro ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, erro: String(err) };
  }
}

// Confirmação de pedido + convite opt-in na mesma mensagem
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
    console.warn("[WhatsApp] API não configurada.");
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
    .map((i) => `  • ${i.quantidade}x ${i.nome} — R$ ${(i.preco * i.quantidade).toFixed(2).replace(".", ",")}`)
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
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `🔔 *Quer receber promoções do Gela pelo WhatsApp?*`,
    `Receba ofertas exclusivas e novidades direto aqui!`,
    ``,
    `Digite *1* para ✅ Sim, quero receber!`,
    `Digite *2* para ❌ Não, obrigado`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return enviarTexto(params.telefoneCliente, mensagem);
}

// Carregar lista de clientes ativos no Supabase
export async function carregarClientesNotificacao(): Promise<
  { telefone: string; nome: string; aceito_em: string }[]
> {
  const { data, error } = await supabase
    .from("clientes_notificacao")
    .select("telefone, nome, aceito_em")
    .eq("ativo", true)
    .order("aceito_em", { ascending: false });

  if (error) {
    console.error("[Supabase] Erro ao carregar clientes:", error.message);
    return [];
  }
  return data ?? [];
}

// Disparar promoção para todos os clientes cadastrados
export async function dispararPromocao(params: {
  mensagem: string;
  midiaUrl?: string;
  midiaType?: "image" | "video";
  clientes: { telefone: string }[];
  onProgresso?: (atual: number, total: number) => void;
}): Promise<{ enviados: number; erros: number }> {
  let enviados = 0;
  let erros    = 0;
  const total  = params.clientes.length;

  for (let i = 0; i < total; i++) {
    const { telefone } = params.clientes[i];
    try {
      const resultado =
        params.midiaUrl && params.midiaType
          ? await enviarMidia(telefone, params.midiaType, params.midiaUrl, params.mensagem)
          : await enviarTexto(telefone, params.mensagem);

      if (resultado.ok) enviados++;
      else erros++;
    } catch {
      erros++;
    }

    params.onProgresso?.(i + 1, total);
    if (i < total - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  return { enviados, erros };
}